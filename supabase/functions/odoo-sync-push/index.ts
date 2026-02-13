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
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Allow unauthenticated requests for testing
  // TODO: Add proper authentication in production

  try {
    const response = await executePushSync();
    return successResponse(response);
  } catch (e) {
    return handleError(e);
  }
});