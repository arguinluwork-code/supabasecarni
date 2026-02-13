-- ============================================================================
-- Allow anonymous read access to all main tables
-- Frontend uses anon key and doesn't require authentication for read operations
-- ============================================================================

-- Tags tables
CREATE POLICY "Allow anon read tag_dimensions"
  ON tag_dimensions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read tags"
  ON tags
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read product_tags"
  ON product_tags
  FOR SELECT
  USING (true);

-- Products and categories tables
CREATE POLICY "Allow anon read products"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read categories"
  ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read pos_categories"
  ON pos_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read taxes"
  ON taxes
  FOR SELECT
  USING (true);

-- Sync tables (read-only for monitoring)
CREATE POLICY "Allow anon read sync_log"
  ON sync_log
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read pending_changes"
  ON pending_changes
  FOR SELECT
  USING (true);

-- Keep write operations restricted to authenticated users
-- (existing "Allow authenticated full access" policies handle this)
