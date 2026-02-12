/**
 * Carnicería Control - Edge Function: Test Odoo Connection
 * Verifica la conectividad con Odoo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OdooClient } from '../_shared/odoo-client.ts';
import {
  createSupabaseClient,
  getOdooConfig,
  updateConfig,
} from '../_shared/database.ts';
import {
  successResponse,
  handleError,
  handleCors,
  log,
} from '../_shared/utils.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
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

    return successResponse(result);
  } catch (e) {
    return handleError(e);
  }
});
