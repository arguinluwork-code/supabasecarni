-- ============================================================================
-- FULL PERMISSIONS for ANON (Private App - No Authentication Required)
-- ============================================================================
-- Since this is a private app, we grant full CRUD access to anonymous users
-- Execute in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- 1. DROP ALL EXISTING POLICIES (Clean slate)
-- ============================================================================

-- Tags
DROP POLICY IF EXISTS "Allow anon read tag_dimensions" ON tag_dimensions;
DROP POLICY IF EXISTS "Allow anon read tags" ON tags;
DROP POLICY IF EXISTS "Allow anon read product_tags" ON product_tags;
DROP POLICY IF EXISTS "Allow authenticated full access on tag_dimensions" ON tag_dimensions;
DROP POLICY IF EXISTS "Allow authenticated full access on tags" ON tags;
DROP POLICY IF EXISTS "Allow authenticated full access on product_tags" ON product_tags;

-- Products and Categories
DROP POLICY IF EXISTS "Allow anon read products" ON products;
DROP POLICY IF EXISTS "Allow anon read categories" ON categories;
DROP POLICY IF EXISTS "Allow anon read pos_categories" ON pos_categories;
DROP POLICY IF EXISTS "Allow anon read taxes" ON taxes;
DROP POLICY IF EXISTS "Allow authenticated full access on products" ON products;
DROP POLICY IF EXISTS "Allow authenticated full access on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated full access on pos_categories" ON pos_categories;
DROP POLICY IF EXISTS "Allow authenticated full access on taxes" ON taxes;

-- Sync
DROP POLICY IF EXISTS "Allow anon read sync_log" ON sync_log;
DROP POLICY IF EXISTS "Allow anon read pending_changes" ON pending_changes;
DROP POLICY IF EXISTS "Allow authenticated full access on sync_log" ON sync_log;
DROP POLICY IF EXISTS "Allow authenticated full access on pending_changes" ON pending_changes;

-- ============================================================================
-- 2. CREATE FULL ACCESS POLICIES FOR ANON
-- ============================================================================

-- Tags - Full CRUD
CREATE POLICY "Allow anon full access on tag_dimensions"
  ON tag_dimensions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon full access on tags"
  ON tags
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon full access on product_tags"
  ON product_tags
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Products - Full CRUD
CREATE POLICY "Allow anon full access on products"
  ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Categories - Full CRUD
CREATE POLICY "Allow anon full access on categories"
  ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon full access on pos_categories"
  ON pos_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Taxes - Full CRUD
CREATE POLICY "Allow anon full access on taxes"
  ON taxes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Sync - Full CRUD
CREATE POLICY "Allow anon full access on sync_log"
  ON sync_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon full access on pending_changes"
  ON pending_changes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. VERIFY POLICIES
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE policyname LIKE '%Allow anon full access%'
ORDER BY tablename, policyname;

-- ============================================================================
-- Expected output: All tables should have "Allow anon full access" policies
-- cmd should show: *  (meaning ALL operations: SELECT, INSERT, UPDATE, DELETE)
-- roles should show: {public}
-- qual and with_check should show: true
-- ============================================================================
