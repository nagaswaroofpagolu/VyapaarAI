import React from 'react';
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronLeft,
  ClipboardList,
  Home,
  Mic2,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'stock', label: 'Stock Management', icon: Package },
  { id: 'sales', label: 'Sales & Purchases', icon: ShoppingCart, disabled: true },
  { id: 'customers', label: 'Customers', icon: Users, disabled: true },
  { id: 'voice', label: 'Voice Assistant', icon: Mic2 },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeView, onNavigate, isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark"><Sparkles size={18} strokeWidth={2.6} /></div>
        <div>
          <div className="sidebar-brand-name">Vyapaar<span>AI</span></div>
          <div className="sidebar-brand-subtitle">Smart commerce OS</div>
        </div>
        <button className="sidebar-close btn-icon" onClick={onClose} title="Close navigation">
          <ChevronLeft size={17} />
        </button>
      </div>

      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeView === id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onNavigate(id)}
            disabled={disabled}
            title={disabled ? `${label} is not available yet` : label}
          >
            <Icon size={17} />
            <span>{label}</span>
            {disabled && <small>Soon</small>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <div className="sidebar-tip-icon"><ClipboardList size={15} /></div>
          <div><strong>Voice-first inventory</strong><span>Say what you need, then confirm.</span></div>
        </div>
        <div className="sidebar-profile">
          <div className="profile-avatar">NS</div>
          <div><strong>Naga Stores</strong><span>Administrator</span></div>
          <Settings size={15} />
        </div>
      </div>
    </aside>
  );
}
