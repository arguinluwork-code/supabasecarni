/**
 * Carnicería Control - Edge Function: Dashboard Stats
 * Obtiene estadísticas para el dashboard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../_shared/database.ts';
import {
  successResponse,
  handleError,
  handleCors,
} from '../_shared/utils.ts';
import { DashboardStats } from '../_shared/types.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Allow unauthenticated requests for testing
  // TODO: Add proper authentication in production

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Usar la vista dashboard_stats pre-calculada
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error fetching dashboard stats: ${error.message}`);
    }

    const stats: DashboardStats = {
      total_products: data.total_products || 0,
      active_products: data.active_products || 0,
      pos_products: data.pos_products || 0,
      without_category: data.without_category || 0,
      without_price: data.without_price || 0,
      without_barcode: data.without_barcode || 0,
      negative_margin: data.negative_margin || 0,
      pending_sync: data.pending_sync || 0,
      avg_margin: data.avg_margin || 0,
      avg_margin_percent: data.avg_margin_percent || 0,
      min_price: data.min_price || 0,
      max_price: data.max_price || 0,
    };

    return successResponse(stats);
  } catch (e) {
    return handleError(e);
  }
});
