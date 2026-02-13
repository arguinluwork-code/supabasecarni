import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
