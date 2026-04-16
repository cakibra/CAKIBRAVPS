import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, CirclePlus, Globe, Info, Logs, Settings2 } from 'lucide-react';
import logo from '../assets/logo.png';

type TabId = 'servers' | 'settings' | 'statistics' | 'logs';
interface SidebarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onQuickAdd: () => void;
  title: string;
  subtitle: string;
  labels: Record<TabId, string>;
}

export function Sidebar({ activeTab, onChange, onQuickAdd, title, subtitle, labels }: SidebarProps): JSX.Element {
  const items: Array<{ id: TabId; icon: JSX.Element }> = [
    { id: 'servers', icon: <Globe size={18} /> },
    { id: 'settings', icon: <Settings2 size={18} /> },
    { id: 'statistics', icon: <BarChart3 size={18} /> },
    { id: 'logs', icon: <Logs size={18} /> }
  ];

  return (
    <aside className="sidebar">
      <button type="button" className="sidebar__ghost sidebar__ghost--back" aria-label="Back">
        <ArrowLeft size={22} />
      </button>

      <div className="sidebar__brand">
        <img src={logo} alt={title} className="sidebar__brand-logo" />
        <div>
          <div className="brand__title">{title}</div>
          <div className="brand__subtitle">{subtitle}</div>
        </div>
      </div>

      <button type="button" className="sidebar__item sidebar__item--add" onClick={onQuickAdd}>
        <span className="sidebar__item-icon"><CirclePlus size={18} /></span>
        <span className="sidebar__item-label">Добавить</span>
      </button>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const active = item.id === activeTab;
          return (
            <button key={item.id} type="button" className={`sidebar__item ${active ? 'is-active' : ''}`} onClick={() => onChange(item.id)}>
              {active && <motion.div layoutId="sidebar-pill" className="sidebar__pill" />}
              <span className="sidebar__item-icon">{item.icon}</span>
              <span className="sidebar__item-label">{labels[item.id]}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__spacer" />

      <div className="sidebar__about">
        <Info size={16} />
        <span>О программе</span>
      </div>
    </aside>
  );
}
