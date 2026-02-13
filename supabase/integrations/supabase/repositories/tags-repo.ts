import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Obtiene tags para mapeo nombre -> id
 */
export async function getAllTagsForMapping(supabase: SupabaseClient): Promise<any[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, tag_name');

  if (error) {
    throw new Error(`Error fetching tags: ${error.message}`);
  }

  return data || [];
}
