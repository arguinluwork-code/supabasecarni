import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import type { DashboardStats, ProductFull } from '../types/database';
import './Dashboard.css';

export function Dashboard() {
  const { products, stats, loading, setProducts, setStats, setLoading, setError } = useAppStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (statsError) throw statsError;
      setStats(statsData as DashboardStats);

      // Load recent products
      const { data: productsData, error: productsError } = await supabase
        .from('products_full')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (productsError) throw productsError;
      setProducts(productsData as ProductFull[]);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-label">Total Productos</div>
            <div className="stat-icon">📦</div>
          </div>
          <div className="stat-value">{stats.total_products}</div>
          <div className="stat-description">Productos en el sistema</div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-label">Activos</div>
            <div className="stat-icon">✓</div>
          </div>
          <div className="stat-value">{stats.active_products}</div>
          <div className="stat-description">Productos activos</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-label">Pendientes Sync</div>
            <div className="stat-icon">⚠️</div>
          </div>
          <div className="stat-value">{stats.pending_sync}</div>
          <div className="stat-description">Cambios sin sincronizar</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-header">
            <div className="stat-label">Con Problemas</div>
            <div className="stat-icon">❌</div>
          </div>
          <div className="stat-value">{stats.without_category + stats.without_price}</div>
          <div className="stat-description">Sin categoría o precio</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">Productos Recientes</div>
          <div className="table-controls">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Últimos 10 productos actualizados
            </span>
          </div>
        </div>
        <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Precio</th>
                <th>Margen</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-name">{product.name}</div>
                    {product.default_code && (
                      <div className="product-code">{product.default_code}</div>
                    )}
                  </td>
                  <td>{product.default_code || '-'}</td>
                  <td>${product.list_price.toFixed(2)}</td>
                  <td style={{ color: product.margin >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {product.margin_percent.toFixed(1)}%
                  </td>
                  <td>
                    {product.active ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
