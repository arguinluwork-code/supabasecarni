/**
 * Tipos compartidos para Supabase Edge Functions
 */

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface Product {
  id: number;
  odoo_id: number;
  name: string;
  default_code: string | null;
  barcode: string | null;
  list_price: number;
  standard_price: number;
  categ_id: number | null;
  categ_name: string | null;
  pos_categ_id: number | null;
  pos_categ_name: string | null;
  taxes_id: number | null;
  tax_name: string | null;
  available_in_pos: boolean;
  active: boolean;
  type: string;
  margin: number; // Calculado automáticamente
  margin_percent: number; // Calculado automáticamente
  modified: boolean;
  sync_status: 'SYNCED' | 'PENDING' | 'ERROR';
  last_synced_at: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFull extends Product {
  tags: string | null; // Tags concatenados como string
  tags_with_dimension: string | null; // Tags con dimensión: "Tipo:Materia Prima, Departamento:Mostrador"
}

export interface Category {
  id: number;
  odoo_id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  complete_name: string | null;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface POSCategory {
  id: number;
  odoo_id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface Tax {
  id: number;
  odoo_id: number;
  name: string;
  amount: number;
  type_tax_use: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagDimension {
  id: number;
  name: string;
  created_at: string;
}

export interface Tag {
  id: number;
  dimension_id: number;
  tag_name: string;
  color: string | null;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductTag {
  id: number;
  product_id: number;
  tag_id: number;
  created_at: string;
}

export interface Config {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface SyncLog {
  id: number;
  timestamp: string;
  direction: 'PULL' | 'PUSH';
  type: string | null;
  records_affected: number | null;
  status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
  message: string | null;
  error_details: any | null;
  created_at: string;
}

export interface PendingChange {
  id: number;
  product_id: number | null;
  product_name: string | null;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
  synced_at: string | null;
}

export interface DashboardStats {
  total_products: number;
  active_products: number;
  pos_products: number;
  without_category: number;
  without_price: number;
  without_barcode: number;
  negative_margin: number;
  pending_sync: number;
  avg_margin: number;
  avg_margin_percent: number;
  min_price: number;
  max_price: number;
}

// ============================================================================
// ODOO TYPES
// ============================================================================

export interface OdooProduct {
  id: number;
  name: string;
  default_code?: string;
  barcode?: string;
  list_price: number;
  standard_price: number;
  categ_id?: [number, string] | false;
  pos_categ_ids?: number[];
  taxes_id?: number[];
  available_in_pos: boolean;
  active: boolean;
  type: string;
  x_tags?: string; // Custom field en Odoo para tags (comma-separated)
  write_date?: string; // Para conflict detection
}

export interface OdooCategory {
  id: number;
  name: string;
  parent_id?: [number, string] | false;
  complete_name?: string;
}

export interface OdooPOSCategory {
  id: number;
  name: string;
  parent_id?: [number, string] | false;
  sequence: number;
}

export interface OdooTax {
  id: number;
  name: string;
  amount: number;
  type_tax_use: string;
  active: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncPullResponse {
  success: boolean;
  elapsed: number;
  counts: {
    taxes: number;
    categories: number;
    posCategories: number;
    products: number;
  };
  message?: string;
  error?: string;
}

export interface SyncPushResponse {
  success: boolean;
  successCount: number;
  errorCount: number;
  message?: string;
  error?: string;
}

export interface ProductUpdateRequest {
  odoo_id: number;
  updates: Partial<Product>;
}

export interface ProductBatchUpdateRequest {
  product_ids: number[]; // odoo_ids
  updates: Partial<Product>;
}

export interface ProductCreateRequest {
  name: string;
  list_price?: number;
  standard_price?: number;
  categ_id?: number;
  pos_categ_id?: number;
  taxes_id?: number;
  available_in_pos?: boolean;
  active?: boolean;
  default_code?: string;
  barcode?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SyncDirection = 'PULL' | 'PUSH';
export type SyncStatus = 'SUCCESS' | 'ERROR' | 'PARTIAL';
export type ProductSyncStatus = 'SYNCED' | 'PENDING' | 'ERROR';
