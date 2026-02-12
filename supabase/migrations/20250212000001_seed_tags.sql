-- ============================================================================
-- Seed Tags Predefinidos
-- Tags iniciales del sistema de Carnicería Control
-- ============================================================================

-- Insertar tags predefinidos según las 5 dimensiones
-- Los IDs de dimensiones se obtienen dinámicamente del insert anterior

-- TIPO (3 tags)
INSERT INTO tags (dimension_id, tag_name, color, product_count) VALUES
  ((SELECT id FROM tag_dimensions WHERE name='Tipo'), 'Materia Prima', '#3498db', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Tipo'), 'Elaboración Propia', '#2ecc71', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Tipo'), 'Reventa', '#9b59b6', 0);

-- CONSERVACIÓN (3 tags)
INSERT INTO tags (dimension_id, tag_name, color, product_count) VALUES
  ((SELECT id FROM tag_dimensions WHERE name='Conservación'), 'Perecedero', '#e74c3c', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Conservación'), 'No perecedero', '#95a5a6', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Conservación'), 'Congelado', '#3498db', 0);

-- DEPARTAMENTO (5 tags)
INSERT INTO tags (dimension_id, tag_name, color, product_count) VALUES
  ((SELECT id FROM tag_dimensions WHERE name='Departamento'), 'Mostrador carnicería', '#e67e22', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Departamento'), 'Pollería', '#f39c12', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Departamento'), 'Fiambrería', '#d35400', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Departamento'), 'Almacén', '#7f8c8d', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Departamento'), 'Rotisería', '#c0392b', 0);

-- INTEGRIDAD (5 tags)
INSERT INTO tags (dimension_id, tag_name, color, product_count) VALUES
  ((SELECT id FROM tag_dimensions WHERE name='Integridad'), 'Con hueso', '#8e44ad', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Integridad'), 'Sin hueso', '#2980b9', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Integridad'), 'Entero', '#16a085', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Integridad'), 'Trozado', '#27ae60', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Integridad'), 'Molido', '#f1c40f', 0);

-- PERFIL COMERCIAL (3 tags)
INSERT INTO tags (dimension_id, tag_name, color, product_count) VALUES
  ((SELECT id FROM tag_dimensions WHERE name='Perfil comercial'), 'Alto margen', '#2ecc71', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Perfil comercial'), 'Gancho/precio', '#e74c3c', 0),
  ((SELECT id FROM tag_dimensions WHERE name='Perfil comercial'), 'Estacional', '#9b59b6', 0);

-- Verificación
SELECT
  td.name AS dimension,
  COUNT(t.id) AS tag_count
FROM tag_dimensions td
LEFT JOIN tags t ON t.dimension_id = td.id
GROUP BY td.name
ORDER BY td.name;
