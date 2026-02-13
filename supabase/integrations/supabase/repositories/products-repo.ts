import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

/**
 * Obtiene productos pendientes de sincronización (modified = true)
 */
export async function getPendingProductsForPush(supabase: SupabaseClient): Promise<any[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      odoo_id,
      name,
      list_price,
      standard_price,
      categ_id,
      pos_categ_id,
      taxes_id,
      available_in_pos,
      active,
      product_tags!inner(tag_id, tags!inner(tag_name))
    `)
    .eq('modified', true);

  if (error) {
    throw new Error(`Error fetching pending products: ${error.message}`);
  }

  return data || [];
}

/**
 * Marca producto como sincronizado
 */
export async function markProductSynced(
  supabase: SupabaseClient,
  id: number
): Promise<string | null> {
  const { error } = await supabase
    .from('products')
    .update({
      modified: false,
      sync_status: 'SYNCED',
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', id);

  return error ? error.message : null;
}

/**
 * Marca producto con error de sincronización
 */
export async function markProductError(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  await supabase
    .from('products')
    .update({
      sync_status: 'ERROR',
    })
    .eq('id', id);
}

/**
 * Obtiene IDs internos de productos para mapear odoo_id -> id
 */
export async function getInsertedProductsForMapping(supabase: SupabaseClient): Promise<any[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, odoo_id');

  if (error) {
    throw new Error(`Error fetching inserted products: ${error.message}`);
  }

  return data || [];
}
