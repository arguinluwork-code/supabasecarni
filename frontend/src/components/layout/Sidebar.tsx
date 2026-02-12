import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/products', icon: '📦', label: 'Productos' },
  { path: '/categories', icon: '📁', label: 'Categorías' },
  { path: '/tags', icon: '🏷️', label: 'Tags' },
  { path: '/analytics', icon: '📈', label: 'Análisis' },
  { path: '/sync', icon: '🔄', label: 'Sincronización' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🥩 Gestor de Productos</h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sync-status">
          <div className="status-indicator"></div>
          <span id="sync-status-text">Conectado</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Última sync: <span id="last-sync-time">hace 1h</span>
        </div>
      </div>
    </div>
  );
}
