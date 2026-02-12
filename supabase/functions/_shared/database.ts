/**
 * Database helpers para Supabase Edge Functions
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OdooConfig } from './odoo-client.ts';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

/**
 * Crea un cliente de Supabase con service role key
 * (necesario para operaciones administrativas en Edge Functions)
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// CONFIG HELPERS
// ============================================================================

/**
 * Obtiene la configuración de Odoo desde la tabla config
 * @param supabase - Cliente de Supabase
 * @returns Configuración de Odoo
 */
export async function getOdooConfig(supabase: SupabaseClient): Promise<OdooConfig> {
  const { data, error } = await supabase
    .from('config')
    .select('key, value')
    .in('key', ['odoo_url', 'odoo_db', 'odoo_username', 'odoo_api_key']);

  if (error) {
    throw new Error(`Error fetching Odoo config: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Odoo configuration not found in database');
  }

  const config: Record<string, string> = {};
  data.forEach(row => {
    config[row.key] = row.value || '';
  });

  // Validar que todos los campos requeridos existan
  const required = ['odoo_url', 'odoo_db', 'odoo_username', 'odoo_api_key'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required Odoo config: ${key}`);
    }
  }

  return {
    odoo_url: config.odoo_url,
    odoo_db: config.odoo_db,
    odoo_username: config.odoo_username,
    odoo_api_key: config.odoo_api_key,
  };
}

/**
 * Actualiza un valor de configuración
 * @param supabase - Cliente de Supabase
 * @param key - Clave de configuración
 * @param value - Valor a actualizar
 */
export async function updateConfig(
  supabase: SupabaseClient,
  key: string,
  value: string
): Promise<void> {
  const { error } = await supabase
    .from('config')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    throw new Error(`Error updating config ${key}: ${error.message}`);
  }
}

// ============================================================================
// SYNC LOG HELPERS
// ============================================================================

/**
 * Crea un log de sincronización
 * @param supabase - Cliente de Supabase
 * @param params - Parámetros del log
 */
export async function createSyncLog(
  supabase: SupabaseClient,
  params: {
    direction: 'PULL' | 'PUSH';
    type: string;
    records_affected: number;
    status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
    message: string;
    error_details?: any;
  }
): Promise<void> {
  const { error } = await supabase.from('sync_log').insert({
    timestamp: new Date().toISOString(),
    direction: params.direction,
    type: params.type,
    records_affected: params.records_affected,
    status: params.status,
    message: params.message,
    error_details: params.error_details || null,
  });

  if (error) {
    console.error('Error creating sync log:', error);
    // No lanzar error aquí, solo loguear (para no bloquear el sync por problemas de logging)
  }
}

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/**
 * Crea un mapa de lookups (id -> nombre) para una tabla
 * Útil para resolver nombres de categorías, impuestos, etc.
 */
export async function createLookupMap(
  supabase: SupabaseClient,
  table: string,
  keyField: string,
  valueField: string
): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from(table)
    .select(`${keyField}, ${valueField}`);

  if (error) {
    throw new Error(`Error creating lookup map for ${table}: ${error.message}`);
  }

  const map = new Map<number, string>();
  if (data) {
    data.forEach((row: any) => {
      map.set(row[keyField], row[valueField]);
    });
  }

  return map;
}

/**
 * Resuelve el nombre de una categoría por su odoo_id
 */
export async function resolveCategoryName(
  supabase: SupabaseClient,
  odooId: number | null
): Promise<string | null> {
  if (!odooId) return null;

  const { data, error } = await supabase
    .from('categories')
    .select('complete_name, name')
    .eq('odoo_id', odooId)
    .single();

  if (error || !data) return null;

  return data.complete_name || data.name;
}

/**
 * Resuelve el nombre de un impuesto por su odoo_id
 */
export async function resolveTaxName(
  supabase: SupabaseClient,
  odooId: number | null
): Promise<string | null> {
  if (!odooId) return null;

  const { data, error } = await supabase
    .from('taxes')
    .select('name')
    .eq('odoo_id', odooId)
    .single();

  if (error || !data) return null;

  return data.name;
}

/**
 * Resuelve el nombre de una categoría POS por su odoo_id
 */
export async function resolvePOSCategoryName(
  supabase: SupabaseClient,
  odooId: number | null
): Promise<string | null> {
  if (!odooId) return null;

  const { data, error } = await supabase
    .from('pos_categories')
    .select('name')
    .eq('odoo_id', odooId)
    .single();

  if (error || !data) return null;

  return data.name;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Inserta registros en batch con manejo de errores
 * @param supabase - Cliente de Supabase
 * @param table - Nombre de la tabla
 * @param records - Registros a insertar
 * @param batchSize - Tamaño del batch (default: 1000)
 */
export async function insertBatch<T extends Record<string, any>>(
  supabase: SupabaseClient,
  table: string,
  records: T[],
  batchSize = 1000
): Promise<void> {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);

    if (error) {
      throw new Error(`Error inserting batch to ${table}: ${error.message}`);
    }
  }
}

/**
 * Limpia una tabla (DELETE all rows)
 * CUIDADO: Esta operación es destructiva
 */
export async function truncateTable(
  supabase: SupabaseClient,
  table: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .neq('id', 0); // Esto es un hack para deletear todo (WHERE id != 0)

  if (error) {
    throw new Error(`Error truncating table ${table}: ${error.message}`);
  }
}
