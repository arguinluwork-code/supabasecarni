-- ============================================================================
-- Carnicería Control - Supabase Migration
-- Migración de Google Apps Script + Sheets a PostgreSQL
-- ============================================================================

-- ============================================================================
-- CONFIGURATION TABLE
-- ============================================================================
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE config IS 'Configuración de la aplicación (Odoo credentials, última sincronización, etc.)';

-- Seed initial config
INSERT INTO config (key, value) VALUES
  ('odoo_url', ''),
  ('odoo_db', ''),
  ('odoo_username', ''),
  ('odoo_api_key', ''),
  ('last_sync', NULL),
  ('sync_status', 'never_synced');

-- ============================================================================
-- TAXES TABLE
-- ============================================================================
CREATE TABLE taxes (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  type_tax_use TEXT DEFAULT 'sale',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE taxes IS 'Impuestos sincronizados desde Odoo';
COMMENT ON COLUMN taxes.odoo_id IS 'ID del impuesto en Odoo (account.tax)';

CREATE INDEX idx_taxes_odoo_id ON taxes(odoo_id);
CREATE INDEX idx_taxes_active ON taxes(active);
CREATE INDEX idx_taxes_name ON taxes(name);

-- ============================================================================
-- CATEGORIES TABLE (Product Categories)
-- ============================================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES categories(odoo_id) ON DELETE SET NULL,
  parent_name TEXT,
  complete_name TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Categorías de productos sincronizadas desde Odoo (product.category)';
COMMENT ON COLUMN categories.parent_id IS 'ID de la categoría padre en Odoo (relación jerárquica)';
COMMENT ON COLUMN categories.complete_name IS 'Nombre completo con jerarquía (ej: "Carnes / Res / Cortes Premium")';

CREATE INDEX idx_categories_odoo_id ON categories(odoo_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_name ON categories(name);

-- ============================================================================
-- POS CATEGORIES TABLE
-- ============================================================================
CREATE TABLE pos_categories (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES pos_categories(odoo_id) ON DELETE SET NULL,
  parent_name TEXT,
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pos_categories IS 'Categorías del punto de venta (POS) sincronizadas desde Odoo (pos.category)';

CREATE INDEX idx_pos_categories_odoo_id ON pos_categories(odoo_id);
CREATE INDEX idx_pos_categories_parent_id ON pos_categories(parent_id);
CREATE INDEX idx_pos_categories_name ON pos_categories(name);

-- ============================================================================
-- TAG DIMENSIONS AND TAGS TABLE
-- ============================================================================
CREATE TABLE tag_dimensions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tag_dimensions IS 'Dimensiones de tags (Tipo, Conservación, Departamento, Integridad, Perfil comercial)';

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  dimension_id INTEGER REFERENCES tag_dimensions(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dimension_id, tag_name)
);

COMMENT ON TABLE tags IS 'Tags personalizados para clasificar productos (relación many-to-many con products)';
COMMENT ON COLUMN tags.color IS 'Color del tag en formato hex (ej: #FF5733)';

CREATE INDEX idx_tags_dimension_id ON tags(dimension_id);
CREATE INDEX idx_tags_name ON tags(tag_name);

-- Seed predefined dimensions
INSERT INTO tag_dimensions (name) VALUES
  ('Tipo'),
  ('Conservación'),
  ('Departamento'),
  ('Integridad'),
  ('Perfil comercial');

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  default_code TEXT,
  barcode TEXT,
  list_price DECIMAL(10, 2) DEFAULT 0,
  standard_price DECIMAL(10, 2) DEFAULT 0,
  categ_id INTEGER REFERENCES categories(odoo_id) ON DELETE SET NULL,
  categ_name TEXT,
  pos_categ_id INTEGER REFERENCES pos_categories(odoo_id) ON DELETE SET NULL,
  pos_categ_name TEXT,
  taxes_id INTEGER REFERENCES taxes(odoo_id) ON DELETE SET NULL,
  tax_name TEXT,
  available_in_pos BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  type TEXT DEFAULT 'consu',
  -- Columnas calculadas automáticamente
  margin DECIMAL(10, 2) GENERATED ALWAYS AS (list_price - standard_price) STORED,
  margin_percent DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE
      WHEN standard_price > 0 THEN ((list_price - standard_price) / standard_price * 100)
      ELSE 0
    END
  ) STORED,
  -- Control de cambios y sincronización
  modified BOOLEAN DEFAULT false,
  sync_status TEXT DEFAULT 'SYNCED' CHECK (sync_status IN ('SYNCED', 'PENDING', 'ERROR')),
  last_synced_at TIMESTAMPTZ,
  -- Almacenamiento de imágenes
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Productos sincronizados con Odoo (product.template)';
COMMENT ON COLUMN products.odoo_id IS 'ID del producto en Odoo';
COMMENT ON COLUMN products.default_code IS 'SKU del producto';
COMMENT ON COLUMN products.list_price IS 'Precio de venta';
COMMENT ON COLUMN products.standard_price IS 'Costo del producto';
COMMENT ON COLUMN products.margin IS 'Margen (calculado automáticamente: list_price - standard_price)';
COMMENT ON COLUMN products.margin_percent IS 'Margen porcentual (calculado automáticamente)';
COMMENT ON COLUMN products.modified IS 'Flag que indica si el producto fue modificado y necesita sincronización';
COMMENT ON COLUMN products.sync_status IS 'Estado de sincronización: SYNCED, PENDING, ERROR';
COMMENT ON COLUMN products.image_url IS 'URL de la imagen del producto en Supabase Storage';

CREATE INDEX idx_products_odoo_id ON products(odoo_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_default_code ON products(default_code);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_categ_id ON products(categ_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_modified ON products(modified);
CREATE INDEX idx_products_sync_status ON products(sync_status);
CREATE INDEX idx_products_list_price ON products(list_price);
CREATE INDEX idx_products_margin_percent ON products(margin_percent);

-- Full-text search index for product search (Spanish)
CREATE INDEX idx_products_search ON products
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(default_code, '') || ' ' || COALESCE(barcode, '')));

-- ============================================================================
-- PRODUCT TAGS (Many-to-Many Junction Table)
-- ============================================================================
CREATE TABLE product_tags (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, tag_id)
);

COMMENT ON TABLE product_tags IS 'Relación many-to-many entre productos y tags';

CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag_id ON product_tags(tag_id);

-- ============================================================================
-- SYNC LOG TABLE
-- ============================================================================
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  direction TEXT CHECK (direction IN ('PULL', 'PUSH')),
  type TEXT,
  records_affected INTEGER,
  status TEXT CHECK (status IN ('SUCCESS', 'ERROR', 'PARTIAL')),
  message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sync_log IS 'Log de sincronizaciones con Odoo';
COMMENT ON COLUMN sync_log.direction IS 'PULL (Odoo → Supabase) o PUSH (Supabase → Odoo)';
COMMENT ON COLUMN sync_log.type IS 'Tipo de sync: FULL_SYNC, PRODUCTS, CATEGORIES, etc.';

CREATE INDEX idx_sync_log_timestamp ON sync_log(timestamp DESC);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_direction ON sync_log(direction);

-- ============================================================================
-- PENDING CHANGES TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE pending_changes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(odoo_id) ON DELETE CASCADE,
  product_name TEXT,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

COMMENT ON TABLE pending_changes IS 'Auditoría de cambios pendientes de sincronización';

CREATE INDEX idx_pending_changes_product_id ON pending_changes(product_id);
CREATE INDEX idx_pending_changes_timestamp ON pending_changes(timestamp DESC);
CREATE INDEX idx_pending_changes_synced ON pending_changes(synced_at) WHERE synced_at IS NULL;

-- ============================================================================
-- DATABASE TRIGGERS FOR AUTOMATIC TRACKING
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_categories_updated_at BEFORE UPDATE ON pos_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON taxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Track product changes automatically
CREATE OR REPLACE FUNCTION track_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambios en campos editables, marcar como modificado
  IF (OLD.list_price IS DISTINCT FROM NEW.list_price OR
      OLD.standard_price IS DISTINCT FROM NEW.standard_price OR
      OLD.categ_id IS DISTINCT FROM NEW.categ_id OR
      OLD.pos_categ_id IS DISTINCT FROM NEW.pos_categ_id OR
      OLD.taxes_id IS DISTINCT FROM NEW.taxes_id OR
      OLD.available_in_pos IS DISTINCT FROM NEW.available_in_pos OR
      OLD.active IS DISTINCT FROM NEW.active OR
      OLD.name IS DISTINCT FROM NEW.name OR
      OLD.default_code IS DISTINCT FROM NEW.default_code OR
      OLD.barcode IS DISTINCT FROM NEW.barcode) THEN

    NEW.modified = true;
    NEW.sync_status = 'PENDING';

    -- Log to pending_changes (para audit trail)
    INSERT INTO pending_changes (product_id, product_name, field_changed, old_value, new_value)
    VALUES (NEW.odoo_id, NEW.name, 'UPDATED', '', '');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_product_modifications BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION track_product_changes();

-- Update tag product counts automatically
CREATE OR REPLACE FUNCTION update_tag_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET product_count = product_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET product_count = product_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_counts AFTER INSERT OR DELETE ON product_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_product_count();

-- Update category product counts when products change category
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrementar count de categoría anterior
  IF OLD.categ_id IS NOT NULL THEN
    UPDATE categories SET product_count = product_count - 1 WHERE odoo_id = OLD.categ_id;
  END IF;

  -- Incrementar count de categoría nueva
  IF NEW.categ_id IS NOT NULL THEN
    UPDATE categories SET product_count = product_count + 1 WHERE odoo_id = NEW.categ_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_counts AFTER UPDATE OF categ_id ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (autenticados pueden hacer todo)
-- NOTA: En producción, refinar según roles (admin, viewer, etc.)

CREATE POLICY "Allow authenticated full access" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON pos_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON taxes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON tags
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON tag_dimensions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON product_tags
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON sync_log
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON pending_changes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access" ON config
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- HELPER VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Products with full details including tag names concatenated
CREATE VIEW products_full AS
SELECT
  p.*,
  STRING_AGG(DISTINCT t.tag_name, ', ' ORDER BY t.tag_name) AS tags,
  STRING_AGG(DISTINCT td.name || ':' || t.tag_name, ', ') AS tags_with_dimension
FROM products p
LEFT JOIN product_tags pt ON p.id = pt.product_id
LEFT JOIN tags t ON pt.tag_id = t.id
LEFT JOIN tag_dimensions td ON t.dimension_id = td.id
GROUP BY p.id;

COMMENT ON VIEW products_full IS 'Vista de productos con tags concatenados como string (similar a Google Sheets)';

-- View: Dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE active = true) AS active_products,
  COUNT(*) FILTER (WHERE available_in_pos = true) AS pos_products,
  COUNT(*) FILTER (WHERE categ_id IS NULL) AS without_category,
  COUNT(*) FILTER (WHERE list_price = 0 OR list_price IS NULL) AS without_price,
  COUNT(*) FILTER (WHERE barcode IS NULL OR barcode = '') AS without_barcode,
  COUNT(*) FILTER (WHERE margin < 0) AS negative_margin,
  COUNT(*) FILTER (WHERE modified = true) AS pending_sync,
  ROUND(AVG(margin) FILTER (WHERE list_price > 0 AND standard_price > 0), 2) AS avg_margin,
  ROUND(AVG(margin_percent) FILTER (WHERE list_price > 0 AND standard_price > 0), 2) AS avg_margin_percent,
  MIN(list_price) FILTER (WHERE list_price > 0) AS min_price,
  MAX(list_price) AS max_price
FROM products;

COMMENT ON VIEW dashboard_stats IS 'Estadísticas pre-calculadas para el dashboard';

-- View: Tags grouped by dimension
CREATE VIEW tags_by_dimension AS
SELECT
  td.id AS dimension_id,
  td.name AS dimension_name,
  COUNT(t.id) AS tag_count,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'id', t.id,
      'tag_name', t.tag_name,
      'color', t.color,
      'product_count', t.product_count
    ) ORDER BY t.tag_name
  ) AS tags
FROM tag_dimensions td
LEFT JOIN tags t ON t.dimension_id = td.id
GROUP BY td.id, td.name
ORDER BY td.name;

COMMENT ON VIEW tags_by_dimension IS 'Tags agrupados por dimensión (útil para el frontend)';

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Función: Recalcular todos los contadores de productos por categoría
CREATE OR REPLACE FUNCTION recalculate_category_counts()
RETURNS void AS $$
BEGIN
  UPDATE categories c
  SET product_count = (
    SELECT COUNT(*)
    FROM products p
    WHERE p.categ_id = c.odoo_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_category_counts IS 'Recalcula los contadores de productos por categoría';

-- Función: Recalcular todos los contadores de productos por tag
CREATE OR REPLACE FUNCTION recalculate_tag_counts()
RETURNS void AS $$
BEGIN
  UPDATE tags t
  SET product_count = (
    SELECT COUNT(*)
    FROM product_tags pt
    WHERE pt.tag_id = t.id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_tag_counts IS 'Recalcula los contadores de productos por tag';

-- ============================================================================
-- INITIAL DATA VERIFICATION
-- ============================================================================

-- Función de verificación para validar la integridad después de migración
CREATE OR REPLACE FUNCTION verify_migration()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Config Table'::TEXT,
         CASE WHEN COUNT(*) = 6 THEN 'OK' ELSE 'FAIL' END,
         'Expected 6 config entries, found ' || COUNT(*)::TEXT
  FROM config;

  RETURN QUERY
  SELECT 'Tag Dimensions'::TEXT,
         CASE WHEN COUNT(*) = 5 THEN 'OK' ELSE 'FAIL' END,
         'Expected 5 dimensions, found ' || COUNT(*)::TEXT
  FROM tag_dimensions;

  RETURN QUERY
  SELECT 'Products without category'::TEXT,
         CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
         COUNT(*)::TEXT || ' products without category'
  FROM products WHERE categ_id IS NULL;

  RETURN QUERY
  SELECT 'Products with negative margin'::TEXT,
         'INFO',
         COUNT(*)::TEXT || ' products with negative margin'
  FROM products WHERE margin < 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_migration IS 'Verifica la integridad de los datos después de la migración';
