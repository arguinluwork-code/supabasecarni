/**
 * Carnicería Control - Edge Function: Test Odoo Connection
 * Verifica la conectividad con Odoo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  successResponse,
  handleError,
  handleCors,
} from '../_shared/utils.ts';
import { executeConnectionTest } from '../../application/services/sync/connection-service.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Allow unauthenticated requests for testing
  // TODO: Add proper authentication in production

  try {
    const result = await executeConnectionTest();
    return successResponse(result);
  } catch (e) {
    return handleError(e);
  }
});