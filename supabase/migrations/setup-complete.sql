-- ============================================================================
-- SETUP COMPLETO - Ejecutar TODO en Supabase SQL Editor
-- ============================================================================
-- Este script configura:
-- 1. Permisos RLS completos para anon
-- 2. Políticas para tabla config
-- 3. Credenciales de Odoo (REEMPLAZAR con tus valores)
-- ============================================================================

-- ============================================================================
-- PARTE 1: PERMISOS RLS COMPLETOS PARA ANON
-- ============================================================================

-- Drop políticas anteriores
DROP POLICY IF EXISTS "Allow anon read tag_dimensions" ON tag_dimensions;
DROP POLICY IF EXISTS "Allow anon read tags" ON tags;
DROP POLICY IF EXISTS "Allow anon read product_tags" ON product_tags;
DROP POLICY IF EXISTS "Allow anon read products" ON products;
DROP POLICY IF EXISTS "Allow anon read categories" ON categories;
DROP POLICY IF EXISTS "Allow anon read pos_categories" ON pos_categories;
DROP POLICY IF EXISTS "Allow anon read taxes" ON taxes;
DROP POLICY IF EXISTS "Allow anon read sync_log" ON sync_log;
DROP POLICY IF EXISTS "Allow anon read pending_changes" ON pending_changes;
DROP POLICY IF EXISTS "Allow authenticated full access on tag_dimensions" ON tag_dimensions;
DROP POLICY IF EXISTS "Allow authenticated full access on tags" ON tags;
DROP POLICY IF EXISTS "Allow authenticated full access on product_tags" ON product_tags;
DROP POLICY IF EXISTS "Allow authenticated full access on products" ON products;
DROP POLICY IF EXISTS "Allow authenticated full access on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated full access on pos_categories" ON pos_categories;
DROP POLICY IF EXISTS "Allow authenticated full access on taxes" ON taxes;
DROP POLICY IF EXISTS "Allow authenticated full access on sync_log" ON sync_log;
DROP POLICY IF EXISTS "Allow authenticated full access on pending_changes" ON pending_changes;

-- Create permisos COMPLETOS para anon
CREATE POLICY "Allow anon full access on tag_dimensions" ON tag_dimensions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on product_tags" ON product_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on pos_categories" ON pos_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on taxes" ON taxes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on sync_log" ON sync_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access on pending_changes" ON pending_changes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PARTE 2: POLÍTICAS PARA TABLA CONFIG
-- ============================================================================

-- Service role (Edge Functions) necesita leer config
DROP POLICY IF EXISTS "Allow service role read config" ON config;
CREATE POLICY "Allow service role read config"
  ON config
  FOR SELECT
  TO service_role
  USING (true);

-- Anon puede leer config (para mostrar estado de sync en UI)
DROP POLICY IF EXISTS "Allow anon read config" ON config;
CREATE POLICY "Allow anon read config"
  ON config
  FOR SELECT
  USING (true);

-- ============================================================================
-- PARTE 3: CONFIGURACIÓN DE ODOO
-- ============================================================================
-- ⚠️ IMPORTANTE: REEMPLAZA estos valores con tus credenciales reales de Odoo
-- ============================================================================

-- Actualizar credenciales de Odoo
UPDATE config SET value = 'https://tu-empresa.odoo.com' WHERE key = 'odoo_url';
UPDATE config SET value = 'tu-base-de-datos' WHERE key = 'odoo_db';
UPDATE config SET value = 'tu-usuario@email.com' WHERE key = 'odoo_username';
UPDATE config SET value = 'tu-api-key-de-odoo' WHERE key = 'odoo_api_key';

-- ============================================================================
-- PARTE 4: VERIFICACIÓN
-- ============================================================================

-- Verificar políticas RLS
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE policyname LIKE '%Allow anon full access%'
   OR policyname LIKE '%config%'
ORDER BY tablename, policyname;

-- Verificar configuración de Odoo (oculta api_key por seguridad)
SELECT
  key,
  CASE
    WHEN key = 'odoo_api_key' THEN '***' || RIGHT(value, 4)
    ELSE value
  END as value,
  updated_at
FROM config
WHERE key LIKE 'odoo_%'
ORDER BY key;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ 9 políticas "Allow anon full access"
-- ✅ 2 políticas para config (service_role y anon)
-- ✅ 4 filas de config con valores de Odoo configurados
-- ============================================================================
