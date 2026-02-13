import { supabase } from './browser-client';

/**
 * Call Odoo sync pull edge function
 */
export async function syncPullFromOdoo() {
  return await supabase.functions.invoke('odoo-sync-pull', {
    method: 'POST'
  });
}

/**
 * Call Odoo sync push edge function
 */
export async function syncPushToOdoo() {
  return await supabase.functions.invoke('odoo-sync-push', {
    method: 'POST'
  });
}

/**
 * Call Odoo test connection edge function
 */
export async function testOdooConnection() {
  return await supabase.functions.invoke('odoo-test-connection', {
    method: 'POST'
  });
}

/**
 * Call dashboard stats edge function
 */
export async function fetchDashboardStats() {
  return await supabase.functions.invoke('dashboard-stats', {
    method: 'GET'
  });
}
