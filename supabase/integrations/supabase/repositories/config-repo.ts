import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OdooConfig } from '../../odoo/client.ts';

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
