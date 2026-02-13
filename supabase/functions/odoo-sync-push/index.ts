/**
 * Carnicería Control - Edge Function: Sync Push (Supabase -> Odoo)
 * Sincroniza cambios pendientes desde PostgreSQL a Odoo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  successResponse,
  handleError,
  handleCors,
} from '../_shared/utils.ts';
import { executePushSync } from '../../application/services/sync/push-service.ts';

serve(async (req) => {
  console.log('=== ODOO SYNC PUSH - Start ===');
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

    console.log('Executing push sync...');
    const response = await executePushSync();
    console.log('Push sync completed successfully');
    return successResponse(response);
  } catch (e) {
    console.error('❌ Error in sync push:', e);
    return handleError(e);
  }
});