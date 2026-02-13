-- ============================================================================
-- Allow anonymous read access to tags tables
-- Frontend uses anon key and doesn't require authentication for read operations
-- ============================================================================

-- Allow anonymous read access to tag_dimensions
CREATE POLICY "Allow anon read tag_dimensions"
  ON tag_dimensions
  FOR SELECT
  USING (true);

-- Allow anonymous read access to tags
CREATE POLICY "Allow anon read tags"
  ON tags
  FOR SELECT
  USING (true);

-- Allow anonymous read access to product_tags
CREATE POLICY "Allow anon read product_tags"
  ON product_tags
  FOR SELECT
  USING (true);

-- Keep write operations restricted to authenticated users
-- (existing "Allow authenticated full access" policies handle this)
