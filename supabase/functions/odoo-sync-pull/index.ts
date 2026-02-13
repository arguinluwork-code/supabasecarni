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
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Allow unauthenticated requests for testing
  // TODO: Add proper authentication in production

  try {
    const response = await executePullSync();
    return successResponse(response);
  } catch (e) {
    return handleError(e);
  }
});