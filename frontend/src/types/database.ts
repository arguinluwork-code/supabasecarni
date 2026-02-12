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
  margin: number;
  margin_percent: number;
  modified: boolean;
  sync_status: 'SYNCED' | 'PENDING' | 'ERROR';
  last_synced_at: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFull extends Product {
  tags: string | null;
  tags_with_dimension: string | null;
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

export interface TagDimension {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
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

export interface TagWithDimension extends Tag {
  dimension_name: string;
}

export interface SyncLog {
  id: number;
  operation: 'PULL' | 'PUSH';
  status: 'SUCCESS' | 'ERROR';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  products_synced: number | null;
  categories_synced: number | null;
  error_message: string | null;
  details: any;
}
