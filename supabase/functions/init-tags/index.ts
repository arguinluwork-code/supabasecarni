/**
 * Carnicería Control - Edge Function: Initialize Tags
 * Initialize predefined tags in the database
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  successResponse,
  handleError,
  handleCors,
} from '../_shared/utils.ts';

interface TagDefinition {
  dimension: string;
  tags: Array<{ name: string; color: string }>;
}

const TAG_DEFINITIONS: TagDefinition[] = [
  {
    dimension: 'Tipo',
    tags: [
      { name: 'Materia Prima', color: '#3498db' },
      { name: 'Elaboración Propia', color: '#2ecc71' },
      { name: 'Reventa', color: '#9b59b6' },
    ],
  },
  {
    dimension: 'Conservación',
    tags: [
      { name: 'Perecedero', color: '#e74c3c' },
      { name: 'No perecedero', color: '#95a5a6' },
      { name: 'Congelado', color: '#3498db' },
    ],
  },
  {
    dimension: 'Departamento',
    tags: [
      { name: 'Mostrador carnicería', color: '#e67e22' },
      { name: 'Pollería', color: '#f39c12' },
      { name: 'Fiambrería', color: '#d35400' },
      { name: 'Almacén', color: '#7f8c8d' },
      { name: 'Rotisería', color: '#c0392b' },
    ],
  },
  {
    dimension: 'Integridad',
    tags: [
      { name: 'Con hueso', color: '#8e44ad' },
      { name: 'Sin hueso', color: '#2980b9' },
      { name: 'Entero', color: '#16a085' },
      { name: 'Trozado', color: '#27ae60' },
      { name: 'Molido', color: '#f1c40f' },
    ],
  },
  {
    dimension: 'Perfil comercial',
    tags: [
      { name: 'Alto margen', color: '#2ecc71' },
      { name: 'Gancho/precio', color: '#e74c3c' },
      { name: 'Estacional', color: '#9b59b6' },
    ],
  },
];

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if tags already exist
    const { data: existingTags, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .limit(1);

    if (checkError) throw checkError;

    if (existingTags && existingTags.length > 0) {
      return successResponse(
        { count: existingTags.length },
        'Tags already initialized'
      );
    }

    // Get dimension IDs
    const { data: dimensions, error: dimError } = await supabase
      .from('tag_dimensions')
      .select('id, name');

    if (dimError) throw dimError;

    const dimensionMap = new Map(dimensions?.map((d) => [d.name, d.id]) || []);

    // Insert tags
    let totalInserted = 0;
    for (const def of TAG_DEFINITIONS) {
      const dimensionId = dimensionMap.get(def.dimension);
      if (!dimensionId) {
        console.error(`Dimension not found: ${def.dimension}`);
        continue;
      }

      const tagRows = def.tags.map((tag) => ({
        dimension_id: dimensionId,
        tag_name: tag.name,
        color: tag.color,
        product_count: 0,
      }));

      const { error: insertError } = await supabase.from('tags').insert(tagRows);

      if (insertError) {
        console.error(`Error inserting tags for ${def.dimension}:`, insertError);
        continue;
      }

      totalInserted += tagRows.length;
    }

    return successResponse(
      {
        inserted: totalInserted,
        dimensions: TAG_DEFINITIONS.length,
      },
      `Successfully initialized ${totalInserted} tags`
    );
  } catch (error) {
    return handleError(error);
  }
});
