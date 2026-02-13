import { OdooClient, formatMany2Many } from '../../../integrations/odoo/client.ts';
import { createSupabaseClient } from '../../../integrations/supabase/client.ts';
import { getOdooConfig, updateConfig } from '../../../integrations/supabase/repositories/config-repo.ts';
import { createSyncLog } from '../../../integrations/supabase/repositories/sync-log-repo.ts';
import {
  getPendingProductsForPush,
  markProductSynced,
  markProductError,
} from '../../../integrations/supabase/repositories/products-repo.ts';
import {
  joinTags,
} from '../../../domain/logic/product/tags.ts';
import { log } from '../logging/sync-log-service.ts';
import { SyncPushResponse } from '../../../functions/_shared/types.ts';

export async function executePushSync(): Promise<SyncPushResponse> {
  log('Starting sync push to Odoo...');

  // Initialize Supabase client
  const supabase = createSupabaseClient();

  // Get Odoo configuration
  const odooConfig = await getOdooConfig(supabase);

  // Initialize Odoo client
  const odooClient = new OdooClient(odooConfig);

  // Get products with pending changes (modified = true)
  const pendingProducts = await getPendingProductsForPush(supabase);

  if (!pendingProducts || pendingProducts.length === 0) {
    log('No pending changes to sync');

    return {
      successCount: 0,
      errorCount: 0,
      message: 'No pending changes to sync',
    } as SyncPushResponse;
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
      const updateErrorMessage = await markProductSynced(supabase, product.id);

      if (updateErrorMessage) {
        log(`Warning: Could not update sync status for product ${product.id}: ${updateErrorMessage}`);
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
      await markProductError(supabase, product.id);
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
    successCount,
    errorCount,
    message: `${successCount} products updated${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
  };

  log(`Sync push completed: ${successCount} success, ${errorCount} errors`);

  return response;
}
