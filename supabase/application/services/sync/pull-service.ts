import { OdooClient, parseMany2One } from '../../../integrations/odoo/client.ts';
import { createSupabaseClient } from '../../../integrations/supabase/client.ts';
import { getOdooConfig, updateConfig } from '../../../integrations/supabase/repositories/config-repo.ts';
import { createSyncLog } from '../../../integrations/supabase/repositories/sync-log-repo.ts';
import { createLookupMap } from '../../../integrations/supabase/repositories/categories-repo.ts';
import {
  insertBatch,
  truncateTable,
  getInsertedProductsForMapping,
} from '../../../integrations/supabase/repositories/products-repo.ts';
import { getAllTagsForMapping } from '../../../integrations/supabase/repositories/tags-repo.ts';
import {
  parseTags,
} from '../../../domain/logic/product/tags.ts';
import {
  log,
  elapsedSeconds,
} from '../logging/sync-log-service.ts';
import {
  OdooProduct,
  OdooCategory,
  OdooPOSCategory,
  OdooTax,
  SyncPullResponse,
} from '../../../functions/_shared/types.ts';

export async function executePullSync(): Promise<SyncPullResponse> {
  log('Starting sync pull from Odoo...');
  const startTime = Date.now();

  // Initialize Supabase client
  const supabase = createSupabaseClient();

  // Get Odoo configuration
  const odooConfig = await getOdooConfig(supabase);

  // Initialize Odoo client
  const odooClient = new OdooClient(odooConfig);

  // Sync in order: taxes -> categories -> pos_categories -> products
  log('Syncing taxes...');
  const taxesCount = await syncTaxes(odooClient, supabase);

  log('Syncing categories...');
  const categoriesCount = await syncCategories(odooClient, supabase);

  log('Syncing POS categories...');
  const posCategoriesCount = await syncPOSCategories(odooClient, supabase);

  log('Syncing products...');
  const productsCount = await syncProducts(odooClient, supabase);

  // Update last_sync timestamp
  await updateConfig(supabase, 'last_sync', new Date().toISOString());
  await updateConfig(supabase, 'sync_status', 'synced');

  // Log successful sync
  await createSyncLog(supabase, {
    direction: 'PULL',
    type: 'FULL_SYNC',
    records_affected: taxesCount + categoriesCount + posCategoriesCount + productsCount,
    status: 'SUCCESS',
    message: 'Full sync completed successfully',
  });

  const elapsed = elapsedSeconds(startTime);

  const response: SyncPullResponse = {
    elapsed,
    counts: {
      taxes: taxesCount,
      categories: categoriesCount,
      posCategories: posCategoriesCount,
      products: productsCount,
    },
    message: `Sync completed in ${elapsed.toFixed(1)}s`,
  };

  log(`Sync completed successfully in ${elapsed.toFixed(1)}s`);

  return response;
}

/**
 * Sincroniza impuestos desde Odoo
 */
async function syncTaxes(odooClient: OdooClient, supabase: any): Promise<number> {
  log('Fetching taxes from Odoo...');

  const taxes: OdooTax[] = await odooClient.searchRead(
    'account.tax',
    [['type_tax_use', '=', 'sale']],
    ['name', 'amount', 'type_tax_use', 'active']
  );

  log(`Fetched ${taxes.length} taxes from Odoo`);

  // Clear existing taxes
  await truncateTable(supabase, 'taxes');

  if (taxes.length > 0) {
    const taxRows = taxes.map(tax => ({
      odoo_id: tax.id,
      name: tax.name,
      amount: tax.amount || 0,
      type_tax_use: tax.type_tax_use,
      active: tax.active !== false,
    }));

    await insertBatch(supabase, 'taxes', taxRows);
    log(`Inserted ${taxes.length} taxes into database`);
  }

  return taxes.length;
}

/**
 * Sincroniza categorias de producto desde Odoo
 */
async function syncCategories(odooClient: OdooClient, supabase: any): Promise<number> {
  log('Fetching categories from Odoo...');

  const categories: OdooCategory[] = await odooClient.searchRead(
    'product.category',
    [],
    ['name', 'parent_id', 'complete_name', 'product_count']
  );

  log(`Fetched ${categories.length} categories from Odoo`);

  // Clear existing categories
  await truncateTable(supabase, 'categories');

  if (categories.length > 0) {
    const categoryRows = categories.map(cat => {
      const parent = parseMany2One(cat.parent_id);

      return {
        odoo_id: cat.id,
        name: cat.name,
        parent_id: parent?.id || null,
        parent_name: parent?.name || null,
        complete_name: cat.complete_name || cat.name,
        product_count: cat.product_count || 0,
      };
    });

    await insertBatch(supabase, 'categories', categoryRows);
    log(`Inserted ${categories.length} categories into database`);
  }

  return categories.length;
}

/**
 * Sincroniza categorias de POS desde Odoo
 */
async function syncPOSCategories(odooClient: OdooClient, supabase: any): Promise<number> {
  log('Fetching POS categories from Odoo...');

  const categories: OdooPOSCategory[] = await odooClient.searchRead(
    'pos.category',
    [],
    ['name', 'parent_id', 'sequence']
  );

  log(`Fetched ${categories.length} POS categories from Odoo`);

  // Clear existing POS categories
  await truncateTable(supabase, 'pos_categories');

  if (categories.length > 0) {
    const posCategoryRows = categories.map(cat => {
      const parent = parseMany2One(cat.parent_id);

      return {
        odoo_id: cat.id,
        name: cat.name,
        parent_id: parent?.id || null,
        parent_name: parent?.name || null,
        sequence: cat.sequence || 0,
      };
    });

    await insertBatch(supabase, 'pos_categories', posCategoryRows);
    log(`Inserted ${categories.length} POS categories into database`);
  }

  return categories.length;
}

/**
 * Sincroniza productos desde Odoo (con paginacion)
 */
async function syncProducts(odooClient: OdooClient, supabase: any): Promise<number> {
  log('Fetching products from Odoo...');

  const BATCH_SIZE = 200;
  let offset = 0;
  const allProducts: OdooProduct[] = [];

  // Fetch products in batches
  while (true) {
    const products: OdooProduct[] = await odooClient.searchRead(
      'product.template',
      [],
      [
        'name',
        'default_code',
        'barcode',
        'list_price',
        'standard_price',
        'categ_id',
        'pos_categ_ids',
        'taxes_id',
        'available_in_pos',
        'active',
        'type',
        'x_tags',
        'write_date',
      ],
      BATCH_SIZE,
      offset
    );

    if (products.length === 0) break;

    allProducts.push(...products);
    offset += BATCH_SIZE;

    log(`Fetched ${allProducts.length} products so far...`);

    // Prevencion de timeout: limitar a 5000 productos por sync
    if (offset > 5000) {
      log('Reached 5000 products limit, stopping fetch');
      break;
    }
  }

  log(`Fetched ${allProducts.length} products from Odoo`);

  // Clear existing products
  await truncateTable(supabase, 'products');

  if (allProducts.length > 0) {
    // Create lookup maps para enriquecer datos
    const categoryMap = await createLookupMap(supabase, 'categories', 'odoo_id', 'complete_name');
    const posCategoryMap = await createLookupMap(supabase, 'pos_categories', 'odoo_id', 'name');
    const taxMap = await createLookupMap(supabase, 'taxes', 'odoo_id', 'name');

    // Fetch all tags for mapping
    const tagsData = await getAllTagsForMapping(supabase);

    const tagNameToId = new Map<string, number>();
    if (tagsData) {
      tagsData.forEach((tag: any) => {
        tagNameToId.set(tag.tag_name, tag.id);
      });
    }

    // Transform products for database
    const productRows = allProducts.map(prod => {
      const categId = parseMany2One(prod.categ_id)?.id || null;
      const posCategoryId = prod.pos_categ_ids && prod.pos_categ_ids.length > 0 ? prod.pos_categ_ids[0] : null;
      const taxId = prod.taxes_id && prod.taxes_id.length > 0 ? prod.taxes_id[0] : null;

      return {
        odoo_id: prod.id,
        name: prod.name,
        default_code: prod.default_code || null,
        barcode: prod.barcode || null,
        list_price: prod.list_price || 0,
        standard_price: prod.standard_price || 0,
        categ_id: categId,
        categ_name: categId ? (categoryMap.get(categId) || null) : null,
        pos_categ_id: posCategoryId,
        pos_categ_name: posCategoryId ? (posCategoryMap.get(posCategoryId) || null) : null,
        taxes_id: taxId,
        tax_name: taxId ? (taxMap.get(taxId) || null) : null,
        available_in_pos: prod.available_in_pos || false,
        active: prod.active !== false,
        type: prod.type || 'consu',
        modified: false,
        sync_status: 'SYNCED',
        last_synced_at: new Date().toISOString(),
        image_url: null,
      };
    });

    // Insert products
    await insertBatch(supabase, 'products', productRows);
    log(`Inserted ${allProducts.length} products into database`);

    // Now insert product_tags (many-to-many relation)
    const productTagRows: { product_id: number; tag_id: number }[] = [];

    // First, get the inserted products with their internal IDs
    const insertedProducts = await getInsertedProductsForMapping(supabase);

    const odooIdToInternalId = new Map<number, number>();
    if (insertedProducts) {
      insertedProducts.forEach((p: any) => {
        odooIdToInternalId.set(p.odoo_id, p.id);
      });
    }

    // Parse tags and create product_tags relationships
    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      const tags = parseTags(product.x_tags);
      const internalId = odooIdToInternalId.get(product.id);

      if (internalId && tags.length > 0) {
        for (const tagName of tags) {
          const tagId = tagNameToId.get(tagName);
          if (tagId) {
            productTagRows.push({
              product_id: internalId,
              tag_id: tagId,
            });
          }
        }
      }
    }

    if (productTagRows.length > 0) {
      await insertBatch(supabase, 'product_tags', productTagRows);
      log(`Inserted ${productTagRows.length} product-tag relationships`);
    }
  }

  return allProducts.length;
}
