import type { AppSettings } from '../types';

interface SettingsPanelProps { settings: AppSettings; onChange: (patch: Partial<AppSettings>) => void; }

export function SettingsPanel({ settings, onChange }: SettingsPanelProps): JSX.Element {
  return (
    <div className="settings-page">
      <div className="settings-section">
        <h2>Настройки интерфейса</h2>
        <div className="settings-list panel-surface">
          <div className="settings-row">
            <span>Язык</span>
            <select value={settings.language} onChange={(event) => onChange({ language: event.target.value as AppSettings['language'] })}>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="settings-row">
            <span>Тема</span>
            <select value={settings.theme} onChange={(event) => onChange({ theme: event.target.value as AppSettings['theme'] })}>
              <option value="dark">Тёмная</option>
              <option value="light">Светлая</option>
              <option value="system">Системная</option>
            </select>
          </div>
          <div className="settings-row">
            <span>Акцент</span>
            <select value={settings.accentPreset} onChange={(event) => onChange({ accentPreset: event.target.value as AppSettings['accentPreset'] })}>
              <option value="ember">Orange / Black</option>
              <option value="carbon">Graphite</option>
              <option value="frost">White / Ice</option>
            </select>
          </div>
          <label className="settings-row settings-row--toggle">
            <span>Плавные анимации</span>
            <input type="checkbox" checked={settings.animationsEnabled} onChange={(event) => onChange({ animationsEnabled: event.target.checked })} />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2>Настройки туннеля</h2>
        <div className="settings-list panel-surface">
          <label className="settings-row settings-row--toggle">
            <span>Включать системный proxy</span>
            <input type="checkbox" checked={settings.enableSystemProxy} onChange={(event) => onChange({ enableSystemProxy: event.target.checked })} />
          </label>
          <label className="settings-row settings-row--toggle">
            <span>Автопереподключение</span>
            <input type="checkbox" checked={settings.autoReconnect} onChange={(event) => onChange({ autoReconnect: event.target.checked })} />
          </label>
          <div className="settings-row">
            <span>Предпочитаемый тип IP</span>
            <div className="settings-row__badge">IPv4</div>
          </div>
          <div className="settings-row">
            <span>Локальный proxy port</span>
            <input type="number" min={1025} max={65535} value={settings.localProxyPort} onChange={(event) => onChange({ localProxyPort: Number(event.target.value) })} />
          </div>
          <div className="settings-row">
            <span>Таймаут пинга, мс</span>
            <input type="number" min={500} max={10000} value={settings.pingTimeoutMs} onChange={(event) => onChange({ pingTimeoutMs: Number(event.target.value) })} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Дополнительные настройки</h2>
        <div className="settings-list panel-surface">
          <label className="settings-row settings-row--toggle">
            <span>Автообновление подписок</span>
            <input type="checkbox" checked={settings.autoUpdateSubscriptions} onChange={(event) => onChange({ autoUpdateSubscriptions: event.target.checked })} />
          </label>
          <div className="settings-row">
            <span>Интервал автообновления</span>
            <input type="number" min={5} max={720} value={settings.autoUpdateIntervalMinutes} onChange={(event) => onChange({ autoUpdateIntervalMinutes: Number(event.target.value) })} />
          </div>
          <div className="settings-row">
            <span>Сортировка по умолчанию</span>
            <select value={settings.defaultSort} onChange={(event) => onChange({ defaultSort: event.target.value as AppSettings['defaultSort'] })}>
              <option value="latency">Пинг</option>
              <option value="name">Имя</option>
              <option value="country">Страна</option>
              <option value="protocol">Протокол</option>
            </select>
          </div>
          <label className="settings-row settings-row--toggle">
            <span>Запуск вместе с Windows</span>
            <input type="checkbox" checked={settings.launchOnWindowsStartup} onChange={(event) => onChange({ launchOnWindowsStartup: event.target.checked })} />
          </label>
        </div>
      </div>
    </div>
  );
}
