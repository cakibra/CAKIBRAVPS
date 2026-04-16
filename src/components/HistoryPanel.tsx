import { TerminalSquare } from 'lucide-react';
import type { ConnectionHistoryEntry, RuntimeSnapshot } from '../types';
import { EmptyState } from './ui/EmptyState';
import { formatDateTime, formatLatency } from '../lib/utils';

interface HistoryPanelProps {
  history: ConnectionHistoryEntry[];
  runtime: RuntimeSnapshot;
}

export function HistoryPanel({ history, runtime }: HistoryPanelProps): JSX.Element {
  const lines = [
    runtime.lastError ? `[runtime] ${runtime.lastError}` : null,
    ...history.map((entry) => `${formatDateTime(entry.connectedAt)} | ${entry.success ? 'INFO' : 'ERROR'} | ${entry.profileName} | ${entry.server} | ${entry.protocol.toUpperCase()} | ${formatLatency(entry.latencyMs)}`)
  ].filter(Boolean) as string[];

  if (lines.length === 0) {
    return <EmptyState icon={<TerminalSquare size={24} />} title="Логи пока пусты" description="После теста, подключения или ошибки события появятся здесь." />;
  }

  return (
    <div className="logs-page">
      <h1>Логи</h1>
      <div className="logs-console panel-surface">
        {lines.map((line) => <div key={line} className="logs-console__line">{line}</div>)}
      </div>
    </div>
  );
}
