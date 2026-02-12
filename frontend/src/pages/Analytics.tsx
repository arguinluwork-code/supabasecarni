import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ProductFull, DashboardStats } from '../types/database';
import './Analytics.css';

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface MarginBucket {
  range: string;
  count: number;
  percentage: number;
}

export function Analytics() {
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Cargar productos
      const { data: productsData, error: productsError } = await supabase
        .from('products_full')
        .select('*');

      if (productsError) throw productsError;

      // Cargar estadísticas
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (statsError) throw statsError;

      setProducts(productsData || []);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  // Distribución por categoría
  const categoryDistribution = useMemo<CategoryDistribution[]>(() => {
    const total = products.length;
    if (total === 0) return [];

    const distribution = new Map<string, number>();

    products.forEach(product => {
      const category = product.categ_name || 'Sin categoría';
      distribution.set(category, (distribution.get(category) || 0) + 1);
    });

    return Array.from(distribution.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [products]);

  // Distribución de márgenes
  const marginDistribution = useMemo<MarginBucket[]>(() => {
    const total = products.length;
    if (total === 0) return [];

    const buckets = [
      { range: '< 0%', min: -Infinity, max: 0 },
      { range: '0-10%', min: 0, max: 10 },
      { range: '10-20%', min: 10, max: 20 },
      { range: '20-30%', min: 20, max: 30 },
      { range: '30-40%', min: 30, max: 40 },
      { range: '40-50%', min: 40, max: 50 },
      { range: '> 50%', min: 50, max: Infinity }
    ];

    return buckets.map(bucket => {
      const count = products.filter(p =>
        p.margin_percent >= bucket.min && p.margin_percent < bucket.max
      ).length;

      return {
        range: bucket.range,
        count,
        percentage: (count / total) * 100
      };
    });
  }, [products]);

  // Top productos por margen
  const topProductsByMargin = useMemo(() => {
    return [...products]
      .filter(p => p.margin_percent > 0)
      .sort((a, b) => b.margin_percent - a.margin_percent)
      .slice(0, 10);
  }, [products]);

  // Productos con margen negativo
  const negativeMarginProducts = useMemo(() => {
    return [...products]
      .filter(p => p.margin_percent < 0)
      .sort((a, b) => a.margin_percent - b.margin_percent)
      .slice(0, 10);
  }, [products]);

  // Distribución por estado
  const statusDistribution = useMemo(() => {
    const active = products.filter(p => p.active).length;
    const inactive = products.length - active;
    const pos = products.filter(p => p.available_in_pos).length;
    const synced = products.filter(p => p.sync_status === 'SYNCED').length;
    const pending = products.filter(p => p.sync_status === 'PENDING').length;

    return [
      { label: 'Activos', value: active, color: 'var(--success)' },
      { label: 'Inactivos', value: inactive, color: 'var(--text-muted)' },
      { label: 'En POS', value: pos, color: 'var(--info)' },
      { label: 'Sincronizados', value: synced, color: 'var(--success)' },
      { label: 'Pendientes', value: pending, color: 'var(--warning)' }
    ];
  }, [products]);

  if (loading) {
    return (
      <div className="content-area">
        <div className="loading-spinner">Cargando análisis...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="content-area">
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-title">No hay datos</div>
          <div className="empty-state-description">
            No hay datos suficientes para mostrar análisis
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {error && <div className="error-banner">{error}</div>}

      <div className="analytics-header">
        <h2>Análisis de Productos</h2>
        <button onClick={loadData} className="btn-primary">
          🔄 Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="kpis-grid">
        <div className="kpi-card">
          <div className="kpi-label">Margen promedio</div>
          <div className="kpi-value">{stats.avg_margin_percent.toFixed(2)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Margen en €</div>
          <div className="kpi-value">€{stats.avg_margin.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Precio promedio</div>
          <div className="kpi-value">
            €{((stats.min_price + stats.max_price) / 2).toFixed(2)}
          </div>
        </div>
        <div className="kpi-card negative">
          <div className="kpi-label">Márgenes negativos</div>
          <div className="kpi-value">{stats.negative_margin}</div>
        </div>
      </div>

      {/* Distribución por categoría */}
      <div className="chart-section">
        <h3>Top 10 Categorías</h3>
        <div className="bar-chart">
          {categoryDistribution.map((item, index) => (
            <div key={index} className="bar-item">
              <div className="bar-label">{item.category}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${item.percentage}%` }}
                >
                  <span className="bar-value">{item.count}</span>
                </div>
              </div>
              <div className="bar-percentage">{item.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución de márgenes */}
      <div className="chart-section">
        <h3>Distribución de Márgenes</h3>
        <div className="histogram">
          {marginDistribution.map((bucket, index) => (
            <div key={index} className="histogram-bar">
              <div
                className="histogram-fill"
                style={{
                  height: `${Math.max(bucket.percentage * 2, 5)}%`,
                  backgroundColor: bucket.range.startsWith('<')
                    ? 'var(--danger)'
                    : 'var(--primary)'
                }}
              >
                <span className="histogram-value">{bucket.count}</span>
              </div>
              <div className="histogram-label">{bucket.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por estado */}
      <div className="chart-section">
        <h3>Estado de Productos</h3>
        <div className="status-grid">
          {statusDistribution.map((item, index) => (
            <div key={index} className="status-item">
              <div className="status-bar-container">
                <div
                  className="status-bar-fill"
                  style={{
                    width: `${(item.value / products.length) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="status-info">
                <span className="status-label">{item.label}</span>
                <span className="status-value">
                  {item.value} ({((item.value / products.length) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top productos por margen */}
      <div className="tables-grid">
        <div className="chart-section">
          <h3>🏆 Top 10 Mejores Márgenes</h3>
          <div className="products-mini-table">
            {topProductsByMargin.map((product, index) => (
              <div key={product.id} className="mini-table-row">
                <div className="mini-row-index">{index + 1}</div>
                <div className="mini-row-name">{product.name}</div>
                <div className="mini-row-value positive">
                  {product.margin_percent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productos con margen negativo */}
        {negativeMarginProducts.length > 0 && (
          <div className="chart-section">
            <h3>⚠️ Márgenes Negativos</h3>
            <div className="products-mini-table">
              {negativeMarginProducts.map((product, index) => (
                <div key={product.id} className="mini-table-row">
                  <div className="mini-row-index">{index + 1}</div>
                  <div className="mini-row-name">{product.name}</div>
                  <div className="mini-row-value negative">
                    {product.margin_percent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
