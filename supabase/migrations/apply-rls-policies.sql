-- ============================================================================
-- Apply RLS Policies for Anonymous Read Access
-- ============================================================================
-- Copy and paste this in: Supabase Dashboard → SQL Editor → New Query
-- Or use: npx supabase db execute -f supabase/migrations/apply-rls-policies.sql
-- ============================================================================

-- Drop existing policies first (in case they exist with different definitions)
DROP POLICY IF EXISTS "Allow anon read tag_dimensions" ON tag_dimensions;
DROP POLICY IF EXISTS "Allow anon read tags" ON tags;
DROP POLICY IF EXISTS "Allow anon read product_tags" ON product_tags;
DROP POLICY IF EXISTS "Allow anon read products" ON products;
DROP POLICY IF EXISTS "Allow anon read categories" ON categories;
DROP POLICY IF EXISTS "Allow anon read pos_categories" ON pos_categories;
DROP POLICY IF EXISTS "Allow anon read taxes" ON taxes;
DROP POLICY IF EXISTS "Allow anon read sync_log" ON sync_log;
DROP POLICY IF EXISTS "Allow anon read pending_changes" ON pending_changes;

-- Create new policies

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

-- Products and categories
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

-- Sync monitoring tables
CREATE POLICY "Allow anon read sync_log"
  ON sync_log
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anon read pending_changes"
  ON pending_changes
  FOR SELECT
  USING (true);

-- Verify policies created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Allow anon read%'
ORDER BY tablename, policyname;
