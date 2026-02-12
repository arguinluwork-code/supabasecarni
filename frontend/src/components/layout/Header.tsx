import { useAppStore } from '../../store/appStore';
import './Header.css';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  onSyncFromOdoo?: () => void;
  onSyncToOdoo?: () => void;
  showSyncButtons?: boolean;
}

export function Header({
  title,
  onRefresh,
  onSyncFromOdoo,
  onSyncToOdoo,
  showSyncButtons = true
}: HeaderProps) {
  const { loading } = useAppStore();
  const pendingCount = 0; // TODO: Calculate from products with modified=true

  return (
    <div className="header">
      <h2>{title}</h2>
      <div className="header-actions">
        {onRefresh && (
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>
        )}

        {showSyncButtons && onSyncToOdoo && pendingCount > 0 && (
          <button
            className="btn btn-primary"
            onClick={onSyncToOdoo}
            disabled={loading}
          >
            <span>⬆️</span>
            <span>Enviar cambios a Odoo</span>
            <span className="badge-count">{pendingCount}</span>
          </button>
        )}

        {showSyncButtons && onSyncFromOdoo && (
          <button
            className="btn btn-success"
            onClick={onSyncFromOdoo}
            disabled={loading}
          >
            <span>⬇️</span>
            <span>Traer desde Odoo</span>
          </button>
        )}
      </div>
    </div>
  );
}
