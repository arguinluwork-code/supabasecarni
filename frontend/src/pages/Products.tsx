import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ProductFull, Category } from '../types/database';
import './Products.css';

interface Filters {
  search: string;
  category: string;
  active: string;
  pos: string;
  syncStatus: string;
  minMargin: string;
  maxMargin: string;
}

export function Products() {
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductFull>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    active: '',
    pos: '',
    syncStatus: '',
    minMargin: '',
    maxMargin: ''
  });
  const [sortBy, setSortBy] = useState<keyof ProductFull>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Cargar productos y categorías
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
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.default_code?.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search)
      );
    }

    // Filtro por categoría
    if (filters.category) {
      result = result.filter(p => p.categ_id === parseInt(filters.category));
    }

    // Filtro por estado activo
    if (filters.active === 'true') {
      result = result.filter(p => p.active);
    } else if (filters.active === 'false') {
      result = result.filter(p => !p.active);
    }

    // Filtro por disponibilidad POS
    if (filters.pos === 'true') {
      result = result.filter(p => p.available_in_pos);
    } else if (filters.pos === 'false') {
      result = result.filter(p => !p.available_in_pos);
    }

    // Filtro por estado de sincronización
    if (filters.syncStatus) {
      result = result.filter(p => p.sync_status === filters.syncStatus);
    }

    // Filtro por margen
    if (filters.minMargin) {
      result = result.filter(p => p.margin_percent >= parseFloat(filters.minMargin));
    }
    if (filters.maxMargin) {
      result = result.filter(p => p.margin_percent <= parseFloat(filters.maxMargin));
    }

    // Ordenar
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Manejar nulls
      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDesc ? bVal - aVal : aVal - bVal;
      }

      return 0;
    });

    return result;
  }, [products, filters, sortBy, sortDesc]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Manejo de edición
  function startEdit(product: ProductFull) {
    setEditingId(product.id);
    setEditValues({
      list_price: product.list_price,
      standard_price: product.standard_price,
      available_in_pos: product.available_in_pos,
      active: product.active
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(id: number) {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('products')
        .update(editValues)
        .eq('id', id);

      if (updateError) throw updateError;

      // Actualizar localmente
      setProducts(products.map(p =>
        p.id === id ? { ...p, ...editValues, modified: true, sync_status: 'PENDING' as const } : p
      ));

      setEditingId(null);
      setEditValues({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  // Selección
  function toggleSelect(id: number) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
    }
  }

  // Acciones en lote
  async function bulkUpdate(updates: Partial<ProductFull>) {
    if (selectedIds.size === 0) return;

    try {
      setError(null);
      const ids = Array.from(selectedIds);

      for (const id of ids) {
        const { error: updateError } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      // Actualizar localmente
      setProducts(products.map(p =>
        selectedIds.has(p.id)
          ? { ...p, ...updates, modified: true, sync_status: 'PENDING' as const }
          : p
      ));

      setSelectedIds(new Set());
      alert(`${ids.length} productos actualizados`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en actualización masiva');
    }
  }

  // Renderizado de celda editable
  function renderEditableCell(product: ProductFull, field: keyof ProductFull, type: 'text' | 'number' | 'checkbox' = 'text') {
    const isEditing = editingId === product.id;

    if (!isEditing) {
      if (type === 'checkbox') {
        return <span>{product[field] ? '✓' : '✗'}</span>;
      }
      if (typeof product[field] === 'number') {
        return <span>€{(product[field] as number).toFixed(2)}</span>;
      }
      return <span>{product[field] as string}</span>;
    }

    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={editValues[field] as boolean ?? product[field]}
          onChange={(e) => setEditValues({ ...editValues, [field]: e.target.checked })}
        />
      );
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          step="0.01"
          value={(editValues[field] ?? product[field]) as number}
          onChange={(e) => setEditValues({ ...editValues, [field]: parseFloat(e.target.value) })}
          className="edit-input"
        />
      );
    }

    return <span>{product[field] as string}</span>;
  }

  // Cambiar ordenamiento
  function handleSort(field: keyof ProductFull) {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
  }

  if (loading) {
    return (
      <div className="content-area">
        <div className="loading-spinner">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {error && <div className="error-banner">{error}</div>}

      {/* Filtros y búsqueda */}
      <div className="products-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, código o código de barras..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.product_count})
              </option>
            ))}
          </select>

          <select
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          <select
            value={filters.pos}
            onChange={(e) => setFilters({ ...filters, pos: e.target.value })}
            className="filter-select"
          >
            <option value="">Disponibilidad POS</option>
            <option value="true">Disponible en POS</option>
            <option value="false">No disponible en POS</option>
          </select>

          <select
            value={filters.syncStatus}
            onChange={(e) => setFilters({ ...filters, syncStatus: e.target.value })}
            className="filter-select"
          >
            <option value="">Estado de sincronización</option>
            <option value="SYNCED">Sincronizado</option>
            <option value="PENDING">Pendiente</option>
            <option value="ERROR">Error</option>
          </select>

          <input
            type="number"
            placeholder="Margen min %"
            value={filters.minMargin}
            onChange={(e) => setFilters({ ...filters, minMargin: e.target.value })}
            className="filter-input"
          />

          <input
            type="number"
            placeholder="Margen max %"
            value={filters.maxMargin}
            onChange={(e) => setFilters({ ...filters, maxMargin: e.target.value })}
            className="filter-input"
          />

          <button onClick={() => setFilters({
            search: '',
            category: '',
            active: '',
            pos: '',
            syncStatus: '',
            minMargin: '',
            maxMargin: ''
          })} className="btn-secondary">
            Limpiar filtros
          </button>
        </div>

        <div className="results-info">
          Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
          {selectedIds.size > 0 && <span> • {selectedIds.size} seleccionados</span>}
        </div>

        {/* Acciones en lote */}
        {selectedIds.size > 0 && (
          <div className="bulk-actions">
            <button onClick={() => bulkUpdate({ active: true })} className="btn-primary">
              Activar seleccionados
            </button>
            <button onClick={() => bulkUpdate({ active: false })} className="btn-secondary">
              Desactivar seleccionados
            </button>
            <button onClick={() => bulkUpdate({ available_in_pos: true })} className="btn-primary">
              Habilitar en POS
            </button>
            <button onClick={() => bulkUpdate({ available_in_pos: false })} className="btn-secondary">
              Deshabilitar en POS
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="btn-text">
              Limpiar selección
            </button>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Nombre {sortBy === 'name' && (sortDesc ? '▼' : '▲')}
              </th>
              <th onClick={() => handleSort('default_code')} className="sortable">
                Código {sortBy === 'default_code' && (sortDesc ? '▼' : '▲')}
              </th>
              <th onClick={() => handleSort('barcode')} className="sortable">
                Código de barras {sortBy === 'barcode' && (sortDesc ? '▼' : '▲')}
              </th>
              <th onClick={() => handleSort('categ_name')} className="sortable">
                Categoría {sortBy === 'categ_name' && (sortDesc ? '▼' : '▲')}
              </th>
              <th onClick={() => handleSort('list_price')} className="sortable">
                Precio venta {sortBy === 'list_price' && (sortDesc ? '▼' : '▲')}
              </th>
              <th onClick={() => handleSort('standard_price')} className="sortable">
                Precio costo {sortBy === 'standard_price' && (sortDesc ? '▼' : '▲')}
              </th>
              <th onClick={() => handleSort('margin_percent')} className="sortable">
                Margen % {sortBy === 'margin_percent' && (sortDesc ? '▼' : '▲')}
              </th>
              <th>POS</th>
              <th>Activo</th>
              <th onClick={() => handleSort('sync_status')} className="sortable">
                Estado {sortBy === 'sync_status' && (sortDesc ? '▼' : '▲')}
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map(product => (
              <tr key={product.id} className={editingId === product.id ? 'editing' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </td>
                <td className="product-name">{product.name}</td>
                <td>{product.default_code || '-'}</td>
                <td>{product.barcode || '-'}</td>
                <td>{product.categ_name || '-'}</td>
                <td>{renderEditableCell(product, 'list_price', 'number')}</td>
                <td>{renderEditableCell(product, 'standard_price', 'number')}</td>
                <td className={product.margin_percent < 0 ? 'negative-margin' : 'positive-margin'}>
                  {product.margin_percent.toFixed(2)}%
                </td>
                <td>{renderEditableCell(product, 'available_in_pos', 'checkbox')}</td>
                <td>{renderEditableCell(product, 'active', 'checkbox')}</td>
                <td>
                  <span className={`status-badge status-${product.sync_status.toLowerCase()}`}>
                    {product.sync_status}
                  </span>
                </td>
                <td className="actions-cell">
                  {editingId === product.id ? (
                    <>
                      <button onClick={() => saveEdit(product.id)} className="btn-save">
                        💾
                      </button>
                      <button onClick={cancelEdit} className="btn-cancel">
                        ✖
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(product)} className="btn-edit">
                      ✏️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-secondary"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
