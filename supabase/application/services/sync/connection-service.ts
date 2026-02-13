import { OdooClient } from '../../../integrations/odoo/client.ts';
import { createSupabaseClient } from '../../../integrations/supabase/client.ts';
import { getOdooConfig, updateConfig } from '../../../integrations/supabase/repositories/config-repo.ts';
import { log } from '../logging/sync-log-service.ts';

export async function executeConnectionTest() {
  log('Testing Odoo connection...');

  // Initialize Supabase client
  const supabase = createSupabaseClient();

  // Get Odoo configuration
  const odooConfig = await getOdooConfig(supabase);

  // Initialize Odoo client
  const odooClient = new OdooClient(odooConfig);

  // Test connection
  const result = await odooClient.testConnection();

  if (result.success) {
    // Update config status
    await updateConfig(supabase, 'sync_status', 'connected');
    log(`Connection successful: UID ${result.uid}, ${result.count} products found`);
  } else {
    log(`Connection failed: ${result.message}`);
  }

  return result;
}
