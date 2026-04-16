import { Activity, BadgeInfo, Cable, Heart } from 'lucide-react';
import type { ConnectionProfile, QuickStats, RuntimeSnapshot } from '../types';
import { formatDateTime, formatLatency } from '../lib/utils';

interface TopStatusBarProps {
  stats: QuickStats;
  runtime: RuntimeSnapshot;
  activeProtocolLabel: string;
  selectedProfile?: ConnectionProfile | null;
}

export function TopStatusBar({ stats, runtime, activeProtocolLabel, selectedProfile }: TopStatusBarProps): JSX.Element {
  return (
    <div className="stats-page">
      <h1>Статистика</h1>
      <div className="stats-sheet panel-surface">
        <div className="stats-row"><span><Cable size={16} /> Сервер</span><strong>{runtime.activeProfileName ?? selectedProfile?.name ?? '—'}</strong></div>
        <div className="stats-row"><span><Activity size={16} /> Время подключения</span><strong>{formatDateTime(runtime.connectedAt)}</strong></div>
        <div className="stats-row"><span><BadgeInfo size={16} /> Пропускная способность прокси</span><strong>{formatLatency(selectedProfile?.latencyMs)}</strong></div>
        <div className="stats-row"><span><Heart size={16} /> Избранных профилей</span><strong>{stats.favorites}</strong></div>
        <div className="stats-row"><span><BadgeInfo size={16} /> Всего профилей</span><strong>{stats.total}</strong></div>
        <div className="stats-row"><span><Activity size={16} /> Online-профилей</span><strong>{stats.online}</strong></div>
        <div className="stats-row"><span><Cable size={16} /> Активный протокол</span><strong>{runtime.protocol?.toUpperCase() ?? activeProtocolLabel}</strong></div>
        <div className="stats-row"><span><BadgeInfo size={16} /> Системный proxy</span><strong>{runtime.systemProxyEnabled ? 'Включён' : 'Выключен'}</strong></div>
      </div>
    </div>
  );
}
