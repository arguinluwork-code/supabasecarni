import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SyncLog, ProductFull } from '../types/database';
import './Sync.css';

export function Sync() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [pendingProducts, setPendingProducts] = useState<ProductFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Cargar historial de sincronizaciones
      const { data: logsData, error: logsError } = await supabase
        .from('sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;

      // Cargar productos pendientes de sincronización
      const { data: productsData, error: productsError } = await supabase
        .from('products_full')
        .select('*')
        .eq('sync_status', 'PENDING')
        .order('updated_at', { ascending: false });

      if (productsError) throw productsError;

      setSyncLogs(logsData || []);
      setPendingProducts(productsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncFromOdoo() {
    try {
      setSyncing(true);
      setError(null);
      setSyncMessage('Sincronizando desde Odoo...');

      const { data, error: syncError } = await supabase.functions.invoke('odoo-sync-pull', {
        method: 'POST'
      });

      if (syncError) throw syncError;

      setSyncMessage(
        `✅ Sincronización completada: ${data.summary?.products_synced || 0} productos, ${data.summary?.categories_synced || 0} categorías`
      );

      // Recargar datos
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar desde Odoo');
      setSyncMessage(null);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncToOdoo() {
    if (pendingProducts.length === 0) {
      setError('No hay cambios pendientes para sincronizar');
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      setSyncMessage(`Enviando ${pendingProducts.length} cambios a Odoo...`);

      const { data, error: syncError } = await supabase.functions.invoke('odoo-sync-push', {
        method: 'POST'
      });

      if (syncError) throw syncError;

      setSyncMessage(
        `✅ ${data.updated || 0} productos actualizados en Odoo`
      );

      // Recargar datos
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar hacia Odoo');
      setSyncMessage(null);
    } finally {
      setSyncing(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function formatDuration(ms: number | null) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  if (loading) {
    return (
      <div className="content-area">
        <div className="loading-spinner">Cargando datos de sincronización...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {error && <div className="error-banner">{error}</div>}
      {syncMessage && <div className="success-banner">{syncMessage}</div>}

      {/* Acciones de sincronización */}
      <div className="sync-actions">
        <div className="action-card">
          <div className="action-icon">⬇️</div>
          <div className="action-content">
            <h3>Sincronizar desde Odoo</h3>
            <p>Trae productos, categorías y tags actualizados desde Odoo</p>
          </div>
          <button
            onClick={handleSyncFromOdoo}
            disabled={syncing}
            className="btn-primary btn-large"
          >
            {syncing ? '⏳ Sincronizando...' : '⬇️ Traer desde Odoo'}
          </button>
        </div>

        <div className="action-card">
          <div className="action-icon">⬆️</div>
          <div className="action-content">
            <h3>Sincronizar hacia Odoo</h3>
            <p>
              Envía cambios locales a Odoo
              {pendingProducts.length > 0 && (
                <span className="pending-badge">{pendingProducts.length} pendientes</span>
              )}
            </p>
          </div>
          <button
            onClick={handleSyncToOdoo}
            disabled={syncing || pendingProducts.length === 0}
            className="btn-primary btn-large"
          >
            {syncing ? '⏳ Sincronizando...' : '⬆️ Enviar a Odoo'}
          </button>
        </div>
      </div>

      {/* Productos pendientes */}
      {pendingProducts.length > 0 && (
        <div className="pending-section">
          <h3>Cambios Pendientes de Sincronización</h3>
          <div className="table-container">
            <table className="sync-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Precio venta</th>
                  <th>Precio costo</th>
                  <th>Estado</th>
                  <th>Última modificación</th>
                </tr>
              </thead>
              <tbody>
                {pendingProducts.slice(0, 10).map(product => (
                  <tr key={product.id}>
                    <td className="product-name">{product.name}</td>
                    <td>{product.default_code || '-'}</td>
                    <td>€{product.list_price.toFixed(2)}</td>
                    <td>€{product.standard_price.toFixed(2)}</td>
                    <td>
                      <span className="status-badge status-pending">PENDING</span>
                    </td>
                    <td>{formatDate(product.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pendingProducts.length > 10 && (
            <div className="more-products">
              Y {pendingProducts.length - 10} productos más...
            </div>
          )}
        </div>
      )}

      {/* Historial de sincronizaciones */}
      <div className="sync-history">
        <h3>Historial de Sincronizaciones</h3>
        <div className="table-container">
          <table className="sync-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Estado</th>
                <th>Productos</th>
                <th>Categorías</th>
                <th>Duración</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.length > 0 ? (
                syncLogs.map(log => (
                  <tr key={log.id}>
                    <td>{formatDate(log.started_at)}</td>
                    <td>
                      <span className={`operation-badge operation-${log.operation.toLowerCase()}`}>
                        {log.operation === 'PULL' ? '⬇️ PULL' : '⬆️ PUSH'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{log.products_synced || 0}</td>
                    <td>{log.categories_synced || 0}</td>
                    <td>{formatDuration(log.duration_ms)}</td>
                    <td>
                      {log.error_message ? (
                        <span className="error-text" title={log.error_message}>
                          ❌ Error
                        </span>
                      ) : (
                        <span className="success-text">✅ OK</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    <div className="empty-state-inline">
                      No hay sincronizaciones registradas
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
