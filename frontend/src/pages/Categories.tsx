import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types/database';
import './Categories.css';

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'product_count'>('name');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      setCategories(data || []);

      // Expandir nodos raíz por defecto
      const rootIds = (data || [])
        .filter(cat => !cat.parent_id)
        .map(cat => cat.id);
      setExpandedIds(new Set(rootIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }

  // Construir árbol de categorías
  const categoryTree = useMemo(() => {
    const categoryMap = new Map<number, CategoryNode>();

    // Crear nodos
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        level: 0
      });
    });

    // Construir jerarquía
    const roots: CategoryNode[] = [];
    categoryMap.forEach(node => {
      if (node.parent_id && categoryMap.has(node.parent_id)) {
        const parent = categoryMap.get(node.parent_id)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Ordenar
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return b.product_count - a.product_count;
      });
      nodes.forEach(node => sortNodes(node.children));
    };

    sortNodes(roots);
    return roots;
  }, [categories, sortBy]);

  // Filtrar categorías
  const filteredTree = useMemo(() => {
    if (!searchTerm) return categoryTree;

    const search = searchTerm.toLowerCase();

    const filterNode = (node: CategoryNode): CategoryNode | null => {
      const matches = node.name.toLowerCase().includes(search);
      const filteredChildren = node.children
        .map(filterNode)
        .filter(Boolean) as CategoryNode[];

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }

      return null;
    };

    return categoryTree
      .map(filterNode)
      .filter(Boolean) as CategoryNode[];
  }, [categoryTree, searchTerm]);

  // Aplanar árbol para vista plana
  const flatCategories = useMemo(() => {
    const result: CategoryNode[] = [];

    const flatten = (node: CategoryNode) => {
      result.push(node);
      node.children.forEach(flatten);
    };

    filteredTree.forEach(flatten);
    return result;
  }, [filteredTree]);

  // Toggle expandir/contraer
  function toggleExpand(id: number) {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  }

  // Expandir todo
  function expandAll() {
    const allIds = new Set(categories.map(cat => cat.id));
    setExpandedIds(allIds);
  }

  // Contraer todo
  function collapseAll() {
    const rootIds = categories
      .filter(cat => !cat.parent_id)
      .map(cat => cat.id);
    setExpandedIds(new Set(rootIds));
  }

  // Renderizar nodo del árbol
  function renderTreeNode(node: CategoryNode) {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="category-node">
        <div
          className="category-row"
          style={{ paddingLeft: `${node.level * 1.5}rem` }}
        >
          <div className="category-expand">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="expand-btn"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="expand-placeholder">•</span>
            )}
          </div>

          <div className="category-info">
            <div className="category-name">
              {node.name}
              {node.parent_name && (
                <span className="category-parent"> / {node.parent_name}</span>
              )}
            </div>
            <div className="category-meta">
              Odoo ID: {node.odoo_id}
            </div>
          </div>

          <div className="category-stats">
            <span className="product-count">
              {node.product_count} productos
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="category-children">
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    );
  }

  // Renderizar fila plana
  function renderFlatRow(node: CategoryNode) {
    return (
      <tr key={node.id}>
        <td style={{ paddingLeft: `${node.level * 1.5}rem` }}>
          <span className="level-indicator">
            {'└─ '.repeat(node.level)}
          </span>
          {node.name}
        </td>
        <td>{node.odoo_id}</td>
        <td>{node.parent_name || '-'}</td>
        <td>{node.complete_name || node.name}</td>
        <td className="text-center">
          <span className="count-badge">{node.product_count}</span>
        </td>
      </tr>
    );
  }

  if (loading) {
    return (
      <div className="content-area">
        <div className="loading-spinner">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {error && <div className="error-banner">{error}</div>}

      {/* Toolbar */}
      <div className="categories-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-actions">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('tree')}
              className={viewMode === 'tree' ? 'active' : ''}
            >
              🌳 Árbol
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={viewMode === 'flat' ? 'active' : ''}
            >
              📋 Lista
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'product_count')}
            className="filter-select"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="product_count">Ordenar por cantidad</option>
          </select>

          {viewMode === 'tree' && (
            <div className="expand-controls">
              <button onClick={expandAll} className="btn-secondary">
                Expandir todo
              </button>
              <button onClick={collapseAll} className="btn-secondary">
                Contraer todo
              </button>
            </div>
          )}

          <button onClick={loadCategories} className="btn-primary">
            🔄 Actualizar
          </button>
        </div>

        <div className="results-info">
          {viewMode === 'tree' ? filteredTree.length : flatCategories.length} categorías
          {searchTerm && ' (filtradas)'}
        </div>
      </div>

      {/* Vista de árbol */}
      {viewMode === 'tree' && (
        <div className="categories-tree">
          {filteredTree.length > 0 ? (
            filteredTree.map(renderTreeNode)
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-title">No hay categorías</div>
              <div className="empty-state-description">
                {searchTerm
                  ? 'No se encontraron categorías con ese término de búsqueda'
                  : 'No hay categorías sincronizadas desde Odoo'
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista plana */}
      {viewMode === 'flat' && (
        <div className="table-container">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Odoo ID</th>
                <th>Categoría padre</th>
                <th>Nombre completo</th>
                <th className="text-center">Productos</th>
              </tr>
            </thead>
            <tbody>
              {flatCategories.length > 0 ? (
                flatCategories.map(renderFlatRow)
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    <div className="empty-state-inline">
                      {searchTerm
                        ? 'No se encontraron categorías con ese término de búsqueda'
                        : 'No hay categorías sincronizadas desde Odoo'
                      }
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Estadísticas */}
      <div className="categories-stats">
        <div className="stat-card">
          <div className="stat-label">Total de categorías</div>
          <div className="stat-value">{categories.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categorías raíz</div>
          <div className="stat-value">
            {categories.filter(c => !c.parent_id).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total de productos</div>
          <div className="stat-value">
            {categories.reduce((sum, cat) => sum + cat.product_count, 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categoría con más productos</div>
          <div className="stat-value">
            {categories.length > 0
              ? categories.reduce((max, cat) =>
                  cat.product_count > max.product_count ? cat : max
                ).name
              : '-'
            }
          </div>
        </div>
      </div>
    </div>
  );
}
