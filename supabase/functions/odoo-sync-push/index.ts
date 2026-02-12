/**
 * Carnicería Control - Edge Function: Sync Push (Supabase → Odoo)
 * Sincroniza cambios pendientes desde PostgreSQL a Odoo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OdooClient, formatMany2Many } from '../_shared/odoo-client.ts';
import {
  createSupabaseClient,
  getOdooConfig,
  createSyncLog,
  updateConfig,
} from '../_shared/database.ts';
import {
  successResponse,
  handleError,
  handleCors,
  log,
  joinTags,
} from '../_shared/utils.ts';
import { SyncPushResponse } from '../_shared/types.ts';

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Allow unauthenticated requests for testing
  // TODO: Add proper authentication in production

  try {
    log('Starting sync push to Odoo...');

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get Odoo configuration
    const odooConfig = await getOdooConfig(supabase);

    // Initialize Odoo client
    const odooClient = new OdooClient(odooConfig);

    // Get products with pending changes (modified = true)
    const { data: pendingProducts, error: queryError } = await supabase
      .from('products')
      .select(`
        id,
        odoo_id,
        name,
        list_price,
        standard_price,
        categ_id,
        pos_categ_id,
        taxes_id,
        available_in_pos,
        active,
        product_tags!inner(tag_id, tags!inner(tag_name))
      `)
      .eq('modified', true);

    if (queryError) {
      throw new Error(`Error fetching pending products: ${queryError.message}`);
    }

    if (!pendingProducts || pendingProducts.length === 0) {
      log('No pending changes to sync');

      return successResponse({
        success: true,
        successCount: 0,
        errorCount: 0,
        message: 'No pending changes to sync',
      } as SyncPushResponse);
    }

    log(`Found ${pendingProducts.length} products with pending changes`);

    let successCount = 0;
    let errorCount = 0;
    const errors: { product: string; error: string }[] = [];

    // Process each product
    for (const product of pendingProducts) {
      try {
        // Prepare values for Odoo
        const values: Record<string, any> = {
          list_price: product.list_price,
          standard_price: product.standard_price,
          available_in_pos: product.available_in_pos,
          active: product.active,
        };

        // Many2one field (categ_id)
        if (product.categ_id !== null) {
          values.categ_id = product.categ_id;
        }

        // Many2many field (pos_categ_ids)
        // Odoo expects: [[6, 0, [ids]]] to replace all related records
        if (product.pos_categ_id !== null) {
          values.pos_categ_ids = formatMany2Many([product.pos_categ_id]);
        } else {
          values.pos_categ_ids = formatMany2Many([]); // Clear relationship
        }

        // Many2many field (taxes_id)
        if (product.taxes_id !== null) {
          values.taxes_id = formatMany2Many([product.taxes_id]);
        } else {
          values.taxes_id = formatMany2Many([]);
        }

        // Tags (custom field x_tags in Odoo - comma-separated string)
        const tags = product.product_tags?.map((pt: any) => pt.tags.tag_name) || [];
        values.x_tags = joinTags(tags);

        log(`Updating product ${product.odoo_id} (${product.name})...`);

        // Update in Odoo
        await odooClient.write('product.template', [product.odoo_id], values);

        // Mark as synced in Supabase
        const { error: updateError } = await supabase
          .from('products')
          .update({
            modified: false,
            sync_status: 'SYNCED',
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (updateError) {
          log(`Warning: Could not update sync status for product ${product.id}: ${updateError.message}`);
        }

        successCount++;
        log(`Successfully updated product ${product.odoo_id}`);
      } catch (e) {
        errorCount++;
        const errorMessage = e instanceof Error ? e.message : String(e);
        log(`Error updating product ${product.odoo_id}: ${errorMessage}`);

        errors.push({
          product: `${product.name} (ID: ${product.odoo_id})`,
          error: errorMessage,
        });

        // Mark as error in Supabase
        await supabase
          .from('products')
          .update({
            sync_status: 'ERROR',
          })
          .eq('id', product.id);
      }
    }

    // Update last_sync timestamp
    await updateConfig(supabase, 'last_sync', new Date().toISOString());

    // Log sync result
    const status = errorCount > 0 ? 'PARTIAL' : 'SUCCESS';
    await createSyncLog(supabase, {
      direction: 'PUSH',
      type: 'PRODUCTS',
      records_affected: successCount,
      status,
      message: `${successCount} updated, ${errorCount} errors`,
      error_details: errors.length > 0 ? errors : null,
    });

    const response: SyncPushResponse = {
      success: true,
      successCount,
      errorCount,
      message: `${successCount} products updated${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
    };

    log(`Sync push completed: ${successCount} success, ${errorCount} errors`);

    return successResponse(response);
  } catch (e) {
    return handleError(e);
  }
});
