import { ChevronRight, Heart, HeartOff, Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ConnectionProfile, RuntimeSnapshot, SubscriptionEntry } from '../types';
import { EmptyState } from './ui/EmptyState';
import { flagEmoji, formatLatency, protocolLabel } from '../lib/utils';

interface ServerListProps {
  profiles: ConnectionProfile[];
  subscriptions: SubscriptionEntry[];
  runtime: RuntimeSnapshot;
  selectedProfileId?: string;
  onSelect: (profileId: string) => void;
  onConnect: (profile: ConnectionProfile) => void;
  onToggleFavorite: (profileId: string) => void;
  onEdit: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onExport: (profile: ConnectionProfile) => void;
  onCreateProfile: () => void;
}

export function ServerList({
  profiles,
  subscriptions,
  runtime,
  selectedProfileId,
  onSelect,
  onConnect,
  onToggleFavorite,
  onEdit,
  onDelete,
  onExport,
  onCreateProfile
}: ServerListProps): JSX.Element {
  const groups = profiles.reduce<Record<string, ConnectionProfile[]>>((acc, profile) => {
    const key = profile.subscriptionId ?? 'local';
    acc[key] = acc[key] ?? [];
    acc[key].push(profile);
    return acc;
  }, {});

  if (profiles.length === 0) {
    return <EmptyState icon={<ChevronRight size={24} />} title="Пока нет профилей" description="Импортируйте конфиг, добавьте подписку или создайте профиль вручную." action={<button type="button" className="primary-button" onClick={onCreateProfile}>Создать профиль</button>} />;
  }

  return (
    <div className="server-list-groups">
      {Object.entries(groups).map(([key, group]) => {
        const subscription = subscriptions.find((sub) => sub.id === key);
        return (
          <section key={key} className="server-list-group">
            {subscription && (
              <div className="subscription-banner">
                <div>
                  <div className="subscription-banner__title">{subscription.name}</div>
                  <div className="subscription-banner__meta">
                    {subscription.lastUpdatedAt ? `Обновлено ${new Date(subscription.lastUpdatedAt).toLocaleDateString('ru-RU')}` : 'Ожидает обновления'}
                    {' · '}
                    {group.length} профилей
                  </div>
                </div>
                <div className="subscription-banner__quota">{subscription.autoUpdate ? 'Автообновление · Вкл' : 'Автообновление · Выкл'}</div>
              </div>
            )}

            <div className="server-list">
              {group.map((profile) => {
                const isActive = runtime.activeProfileId === profile.id;
                const isSelected = selectedProfileId === profile.id || isActive;
                return (
                  <motion.button
                    layout
                    key={profile.id}
                    type="button"
                    className={`server-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelect(profile.id)}
                  >
                    <div className="server-row__flag">{flagEmoji(profile.countryCode)}</div>
                    <div className="server-row__content">
                      <div className="server-row__name">{profile.name}</div>
                      <div className="server-row__meta">{protocolLabel(profile.protocol)} | {profile.countryName ?? 'Unknown'} | {profile.server}</div>
                    </div>
                    <div className="server-row__latency">{formatLatency(profile.latencyMs)}</div>
                    <div className="server-row__actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="server-row__icon" onClick={() => onToggleFavorite(profile.id)}>{profile.favorite ? <Heart size={15} /> : <HeartOff size={15} />}</button>
                      <button type="button" className="server-row__icon" onClick={() => onEdit(profile.id)}><Pencil size={15} /></button>
                      <button type="button" className="server-row__icon" onClick={() => onExport(profile)}><SquareArrowOutUpRight size={15} /></button>
                      <button type="button" className="server-row__icon" onClick={() => onDelete(profile.id)}><Trash2 size={15} /></button>
                      <button type="button" className="server-row__connect" onClick={() => onConnect(profile)}>
                        {isActive ? 'Активен' : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
