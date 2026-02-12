import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { DashboardStats, ProductFull } from './types/database';
import './App.css';

function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading dashboard data from Supabase...');

      // Load dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (statsError) {
        console.error('Stats error:', statsError);
        throw statsError;
      }

      console.log('Stats loaded:', statsData);
      setStats(statsData);

      // Load recent products
      const { data: productsData, error: productsError } = await supabase
        .from('products_full')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }

      console.log('Products loaded:', productsData?.length);
      setProducts(productsData || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <h2>Cargando datos de Supabase...</h2>
          <p>Conectando con tu base de datos sincronizada con Odoo</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>❌ Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData}>🔄 Reintentar</button>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary>Ayuda para debugging</summary>
            <ul style={{ marginTop: '0.5rem' }}>
              <li>Verifica que el archivo .env.local existe</li>
              <li>Verifica que las credenciales de Supabase son correctas</li>
              <li>Abre la consola del navegador (F12) para ver más detalles</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🥩 Carnicería Control</h1>
        <p>Sistema de gestión sincronizado con Odoo 19 Enterprise</p>
      </header>

      {stats && (
        <div className="dashboard">
          <h2>📊 Dashboard</h2>

          <div className="stats-grid">
            <div className="stat-card primary">
              <h3>{stats.total_products}</h3>
              <p>Total Productos</p>
            </div>

            <div className="stat-card success">
              <h3>{stats.active_products}</h3>
              <p>Productos Activos</p>
            </div>

            <div className="stat-card info">
              <h3>{stats.pos_products}</h3>
              <p>Disponibles en POS</p>
            </div>

            <div className="stat-card">
              <h3>${stats.avg_margin?.toFixed(2)}</h3>
              <p>Margen Promedio</p>
            </div>

            <div className="stat-card">
              <h3>{stats.avg_margin_percent?.toFixed(1)}%</h3>
              <p>Margen Porcentual</p>
            </div>

            <div className="stat-card warning">
              <h3>{stats.pending_sync}</h3>
              <p>Pendientes Sync</p>
            </div>
          </div>

          <div className="section">
            <h3>🛍️ Productos Recientes</h3>
            <p className="subtitle">Últimos 10 productos actualizados</p>

            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                    <th>Costo</th>
                    <th>Margen</th>
                    <th>Margen %</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="product-name">{product.name}</td>
                      <td className="code">{product.default_code || '-'}</td>
                      <td>{product.categ_name || 'Sin categoría'}</td>
                      <td className="price">${product.list_price.toFixed(2)}</td>
                      <td className="price">${product.standard_price.toFixed(2)}</td>
                      <td className={`margin ${product.margin < 0 ? 'negative' : 'positive'}`}>
                        ${product.margin.toFixed(2)}
                      </td>
                      <td className={`margin ${product.margin_percent < 0 ? 'negative' : 'positive'}`}>
                        {product.margin_percent.toFixed(1)}%
                      </td>
                      <td>
                        <span className={`status ${product.sync_status.toLowerCase()}`}>
                          {product.sync_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="actions">
            <button className="btn-primary" onClick={loadDashboardData}>
              🔄 Recargar Datos
            </button>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>
          Migrado de Google Apps Script a Supabase •
          {stats && ` ${stats.total_products} productos sincronizados desde Odoo`}
        </p>
      </footer>
    </div>
  );
}

export default App;
