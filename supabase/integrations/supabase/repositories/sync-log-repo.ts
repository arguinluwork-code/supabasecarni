import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Crea un log de sincronización
 * @param supabase - Cliente de Supabase
 * @param params - Parámetros del log
 */
export async function createSyncLog(
  supabase: SupabaseClient,
  params: {
    direction: 'PULL' | 'PUSH';
    type: string;
    records_affected: number;
    status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
    message: string;
    error_details?: any;
  }
): Promise<void> {
  const { error } = await supabase.from('sync_log').insert({
    timestamp: new Date().toISOString(),
    direction: params.direction,
    type: params.type,
    records_affected: params.records_affected,
    status: params.status,
    message: params.message,
    error_details: params.error_details || null,
  });

  if (error) {
    console.error('Error creating sync log:', error);
    // No lanzar error aquí, solo loguear (para no bloquear el sync por problemas de logging)
  }
}
