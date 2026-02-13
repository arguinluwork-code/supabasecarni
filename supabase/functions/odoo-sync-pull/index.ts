/**
 * Carnicería Control - Edge Function: Sync Pull (Odoo -> Supabase)
 * Sincronización completa desde Odoo a PostgreSQL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  successResponse,
  handleError,
  handleCors,
} from '../_shared/utils.ts';
import { executePullSync } from '../../application/services/sync/pull-service.ts';

serve(async (req) => {
  console.log('=== ODOO SYNC PULL - Start ===');
  console.log('Method:', req.method);
  console.log('Origin:', req.headers.get('origin'));

  try {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) {
      console.log('Returning CORS preflight response');
      return corsResponse;
    }

    // Allow unauthenticated requests for testing
    // TODO: Add proper authentication in production

    console.log('Executing pull sync...');
    const response = await executePullSync();
    console.log('Pull sync completed successfully');
    return successResponse(response);
  } catch (e) {
    console.error('❌ Error in sync pull:', e);
    return handleError(e);
  }
});