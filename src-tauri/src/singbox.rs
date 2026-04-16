use crate::{
    errors::{AppError, AppResult},
    models::{ConnectionProfile, RuntimeSettings},
    storage::AppPaths,
};
use serde_json::{json, Value};
use std::{
    fs::{self, File, OpenOptions},
    process::{Child, Command, Stdio},
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn str_field<'a>(details: &'a Value, key: &str) -> Option<&'a str> {
    details.get(key).and_then(|v| v.as_str())
}

fn bool_field(details: &Value, key: &str, fallback: bool) -> bool {
    details.get(key).and_then(|v| v.as_bool()).unwrap_or(fallback)
}

fn make_transport(details: &Value) -> Option<Value> {
    match str_field(details, "transportType").unwrap_or("tcp") {
        "ws" => Some(json!({
            "type": "ws",
            "path": str_field(details, "path").unwrap_or("/"),
            "headers": {
                "Host": str_field(details, "host").unwrap_or("")
            }
        })),
        "grpc" => Some(json!({
            "type": "grpc",
            "service_name": str_field(details, "serviceName").unwrap_or("grpc")
        })),
        "httpupgrade" => Some(json!({
            "type": "httpupgrade",
            "host": str_field(details, "host").unwrap_or(""),
            "path": str_field(details, "path").unwrap_or("/")
        })),
        _ => None,
    }
}

fn make_tls(details: &Value) -> Option<Value> {
    if !bool_field(details, "tlsEnabled", false) {
        return None;
    }
    let mut tls = json!({
        "enabled": true,
        "server_name": str_field(details, "tlsServerName").unwrap_or(""),
        "insecure": bool_field(details, "tlsInsecure", false)
    });

    if let Some(fingerprint) = str_field(details, "fingerprint") {
        tls["utls"] = json!({
            "enabled": true,
            "fingerprint": fingerprint
        });
    }

    if let Some(public_key) = str_field(details, "realityPublicKey") {
        tls["reality"] = json!({
            "enabled": true,
            "public_key": public_key,
            "short_id": str_field(details, "realityShortId").unwrap_or(""),
            "spider_x": str_field(details, "realitySpiderX").unwrap_or("/")
        });
    }

    Some(tls)
}

fn strip_ansi_codes(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut result = String::with_capacity(input.len());
    let mut i = 0;

    while i < bytes.len() {
        if bytes[i] == 0x1b {
            i += 1;
            if i < bytes.len() && bytes[i] == b'[' {
                i += 1;
                while i < bytes.len() {
                    let b = bytes[i];
                    i += 1;
                    if (b as char).is_ascii_alphabetic() {
                        break;
                    }
                }
                continue;
            }
        }

        result.push(bytes[i] as char);
        i += 1;
    }

    result
}

fn create_hidden_command(program: &std::path::Path) -> Command {
    let mut command = Command::new(program);
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

pub fn build_outbound(profile: &ConnectionProfile) -> AppResult<Value> {
    let d = &profile.details;
    let tls = make_tls(d);
    let transport = make_transport(d);
    let outbound = match profile.protocol.as_str() {
        "vless" => json!({
            "type": "vless",
            "tag": "primary",
            "server": profile.server,
            "server_port": profile.port,
            "uuid": str_field(d, "uuid").ok_or_else(|| AppError::Message("VLESS uuid missing".to_string()))?,
            "flow": str_field(d, "flow"),
            "packet_encoding": str_field(d, "packetEncoding").unwrap_or("xudp"),
            "tls": tls,
            "transport": transport
        }),
        "vmess" => json!({
            "type": "vmess",
            "tag": "primary",
            "server": profile.server,
            "server_port": profile.port,
            "uuid": str_field(d, "uuid").ok_or_else(|| AppError::Message("VMess uuid missing".to_string()))?,
            "security": str_field(d, "security").unwrap_or("auto"),
            "alter_id": d.get("alterId").and_then(|v| v.as_u64()).unwrap_or(0),
            "tls": tls,
            "transport": transport
        }),
        "trojan" => json!({
            "type": "trojan",
            "tag": "primary",
            "server": profile.server,
            "server_port": profile.port,
            "password": str_field(d, "password").ok_or_else(|| AppError::Message("Trojan password missing".to_string()))?,
            "tls": tls,
            "transport": transport
        }),
        "shadowsocks" => json!({
            "type": "shadowsocks",
            "tag": "primary",
            "server": profile.server,
            "server_port": profile.port,
            "method": str_field(d, "method").ok_or_else(|| AppError::Message("Shadowsocks method missing".to_string()))?,
            "password": str_field(d, "password").ok_or_else(|| AppError::Message("Shadowsocks password missing".to_string()))?
        }),
        "socks" => json!({
            "type": "socks",
            "tag": "primary",
            "server": profile.server,
            "server_port": profile.port,
            "username": str_field(d, "username"),
            "password": str_field(d, "password"),
            "version": str_field(d, "version").unwrap_or("5")
        }),
        "hysteria2" => json!({
            "type": "hysteria2",
            "tag": "primary",
            "server": profile.server,
            "server_port": profile.port,
            "password": str_field(d, "password").ok_or_else(|| AppError::Message("Hysteria2 password missing".to_string()))?,
            "obfs": {
                "type": str_field(d, "obfsType"),
                "password": str_field(d, "obfsPassword")
            },
            "tls": tls
        }),
        "custom" => {
            if let Some(raw_json) = str_field(d, "rawConfigJson") {
                serde_json::from_str::<Value>(raw_json)?
            } else {
                return Err(AppError::Message("Custom rawConfigJson missing".to_string()));
            }
        }
        other => return Err(AppError::Message(format!("Unsupported protocol: {}", other))),
    };
    Ok(outbound)
}

pub fn write_runtime_config(paths: &AppPaths, profile: &ConnectionProfile, settings: &RuntimeSettings) -> AppResult<()> {
    let outbound = build_outbound(profile)?;
    let config = if profile.protocol == "custom" && outbound.get("outbounds").is_some() {
        outbound
    } else {
        json!({
          "log": {
            "level": "info",
            "timestamp": true
          },
          "dns": {
            "strategy": "ipv4_only",
            "servers": [
              { "type": "local", "tag": "dns-direct" },
              {
                "type": "https",
                "tag": "dns-remote",
                "server": "1.1.1.1",
                "server_port": 443,
                "path": "/dns-query",
                "detour": "primary"
              }
            ]
          },
          "inbounds": [
            {
              "type": "mixed",
              "tag": "mixed-in",
              "listen": "127.0.0.1",
              "listen_port": settings.local_proxy_port,
              "sniff": true,
              "set_system_proxy": false
            }
          ],
          "outbounds": [
            outbound,
            { "type": "direct", "tag": "direct" },
            { "type": "block", "tag": "block" }
          ],
          "route": {
            "auto_detect_interface": true,
            "final": "primary"
          }
        })
    };

    fs::write(&paths.current_config_path, serde_json::to_vec_pretty(&config)?)?;
    Ok(())
}

pub fn validate_config(paths: &AppPaths) -> AppResult<()> {
    let output = create_hidden_command(&paths.sidecar_path)
        .arg("check")
        .arg("-c")
        .arg(&paths.current_config_path)
        .output()?;
    if !output.status.success() {
        let stderr = strip_ansi_codes(&String::from_utf8_lossy(&output.stderr));
        let stdout = strip_ansi_codes(&String::from_utf8_lossy(&output.stdout));
        let message = if stderr.trim().is_empty() {
            stdout.trim().to_string()
        } else {
            stderr.trim().to_string()
        };
        return Err(AppError::Message(message));
    }
    Ok(())
}

fn open_log(path: &std::path::Path) -> AppResult<File> {
    Ok(OpenOptions::new().create(true).append(true).open(path)?)
}

pub fn spawn_sidecar(paths: &AppPaths) -> AppResult<Child> {
    let stdout = open_log(&paths.logs_dir.join("sing-box.stdout.log"))?;
    let stderr = open_log(&paths.logs_dir.join("sing-box.stderr.log"))?;
    let child = create_hidden_command(&paths.sidecar_path)
        .arg("run")
        .arg("-c")
        .arg(&paths.current_config_path)
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr))
        .spawn()?;
    Ok(child)
}
