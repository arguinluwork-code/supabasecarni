import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { TagDimension, Tag } from '../types/database';
import './Tags.css';

interface TagsByDimension {
  dimension: TagDimension;
  tags: Tag[];
}

export function Tags() {
  const [dimensions, setDimensions] = useState<TagDimension[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'product_count'>('name');
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading tags data...');

      // Cargar dimensiones
      const { data: dimensionsData, error: dimensionsError } = await supabase
        .from('tag_dimensions')
        .select('*')
        .order('name');

      console.log('Dimensions:', dimensionsData, 'Error:', dimensionsError);

      if (dimensionsError) throw dimensionsError;

      // Cargar tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('tag_name');

      console.log('Tags:', tagsData, 'Error:', tagsError);

      if (tagsError) throw tagsError;

      setDimensions(dimensionsData || []);
      setTags(tagsData || []);

      console.log(`Loaded ${dimensionsData?.length || 0} dimensions and ${tagsData?.length || 0} tags`);

      // Expandir todas las dimensiones por defecto
      const allDimensionIds = (dimensionsData || []).map(d => d.id);
      setExpandedDimensions(new Set(allDimensionIds));
    } catch (err) {
      console.error('Error loading tags:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  // Agrupar tags por dimensión
  const tagsByDimension = useMemo<TagsByDimension[]>(() => {
    const result: TagsByDimension[] = [];

    dimensions.forEach(dimension => {
      let dimensionTags = tags.filter(tag => tag.dimension_id === dimension.id);

      // Filtrar por búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        dimensionTags = dimensionTags.filter(tag =>
          tag.tag_name.toLowerCase().includes(search)
        );
      }

      // Ordenar
      dimensionTags.sort((a, b) => {
        if (sortBy === 'name') {
          return a.tag_name.localeCompare(b.tag_name);
        }
        return b.product_count - a.product_count;
      });

      // Solo incluir dimensión si tiene tags después del filtro
      if (dimensionTags.length > 0 || !searchTerm) {
        result.push({
          dimension,
          tags: dimensionTags
        });
      }
    });

    return result;
  }, [dimensions, tags, searchTerm, sortBy]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalTags = tags.length;
    const totalProducts = tags.reduce((sum, tag) => sum + tag.product_count, 0);
    const tagsWithProducts = tags.filter(tag => tag.product_count > 0).length;
    const mostUsedTag = tags.length > 0
      ? tags.reduce((max, tag) => tag.product_count > max.product_count ? tag : max)
      : null;

    return {
      totalTags,
      totalProducts,
      tagsWithProducts,
      mostUsedTag
    };
  }, [tags]);

  function toggleDimension(dimensionId: number) {
    const newExpanded = new Set(expandedDimensions);
    if (newExpanded.has(dimensionId)) {
      newExpanded.delete(dimensionId);
    } else {
      newExpanded.add(dimensionId);
    }
    setExpandedDimensions(newExpanded);
  }

  function expandAll() {
    setExpandedDimensions(new Set(dimensions.map(d => d.id)));
  }

  function collapseAll() {
    setExpandedDimensions(new Set());
  }

  async function initializeTags() {
    try {
      setInitializing(true);
      setError(null);

      const { data, error: initError } = await supabase.functions.invoke('init-tags');

      if (initError) throw initError;

      console.log('Tags initialized:', data);

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inicializar tags');
    } finally {
      setInitializing(false);
    }
  }

  if (loading) {
    return (
      <div className="content-area">
        <div className="loading-spinner">Cargando tags...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {error && <div className="error-banner">{error}</div>}

      {/* Toolbar */}
      <div className="tags-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-actions">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'product_count')}
            className="filter-select"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="product_count">Ordenar por uso</option>
          </select>

          <div className="expand-controls">
            <button onClick={expandAll} className="btn-secondary">
              Expandir todo
            </button>
            <button onClick={collapseAll} className="btn-secondary">
              Contraer todo
            </button>
          </div>

          <button onClick={loadData} className="btn-primary">
            🔄 Actualizar
          </button>
        </div>

        <div className="results-info">
          {tagsByDimension.length} dimensiones • {tags.length} tags totales
          {searchTerm && ' (filtrados)'}
        </div>
      </div>

      {/* Tags por dimensión */}
      <div className="tags-container">
        {tagsByDimension.length > 0 ? (
          tagsByDimension.map(({ dimension, tags: dimensionTags }) => {
            const isExpanded = expandedDimensions.has(dimension.id);

            return (
              <div key={dimension.id} className="dimension-card">
                <div
                  className="dimension-header"
                  onClick={() => toggleDimension(dimension.id)}
                >
                  <button className="expand-btn">
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <div className="dimension-info">
                    <h3 className="dimension-name">{dimension.name}</h3>
                    <span className="dimension-count">
                      {dimensionTags.length} tags
                    </span>
                  </div>
                  <div className="dimension-stats">
                    <span className="total-products">
                      {dimensionTags.reduce((sum, tag) => sum + tag.product_count, 0)} productos
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="tags-grid">
                    {dimensionTags.length > 0 ? (
                      dimensionTags.map(tag => (
                        <div
                          key={tag.id}
                          className="tag-card"
                          style={{
                            borderLeftColor: tag.color || 'var(--border-color)',
                            borderLeftWidth: '4px'
                          }}
                        >
                          <div className="tag-header">
                            <span className="tag-name">{tag.tag_name}</span>
                            {tag.color && (
                              <span
                                className="tag-color-indicator"
                                style={{ backgroundColor: tag.color }}
                              />
                            )}
                          </div>
                          <div className="tag-meta">
                            <span className="tag-product-count">
                              {tag.product_count} productos
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-tags">
                        No hay tags en esta dimensión
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏷️</div>
            <div className="empty-state-title">No hay tags</div>
            <div className="empty-state-description">
              {searchTerm
                ? 'No se encontraron tags con ese término de búsqueda'
                : 'Las tablas de tags están vacías. Haz clic en el botón para inicializar los tags predefinidos.'
              }
            </div>
            {!searchTerm && tags.length === 0 && (
              <button
                onClick={initializeTags}
                disabled={initializing}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                {initializing ? 'Inicializando...' : 'Inicializar Tags'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="tags-stats">
        <div className="stat-card">
          <div className="stat-label">Total de tags</div>
          <div className="stat-value">{stats.totalTags}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tags en uso</div>
          <div className="stat-value">{stats.tagsWithProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total productos etiquetados</div>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tag más usado</div>
          <div className="stat-value">
            {stats.mostUsedTag ? stats.mostUsedTag.tag_name : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
