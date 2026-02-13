/**
 * Domain helper: parse comma-separated Odoo tags into normalized values.
 */
export function parseTags(tagsString: string | null | undefined): string[] {
  if (!tagsString) return [];

  return tagsString
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Domain helper: serialize tags for Odoo custom x_tags field.
 */
export function joinTags(tags: string[]): string {
  return tags.join(', ');
}

/**
 * Domain helper: infer dimension ID for a tag based on its name.
 * Returns the most likely dimension ID, or null if cannot infer.
 */
export function inferTagDimension(tagName: string): number | null {
  const normalized = tagName.toLowerCase();

  // Tipo (dimension 1)
  const tipoKeywords = ['materia prima', 'elaboración', 'reventa', 'propio', 'propia'];
  if (tipoKeywords.some(kw => normalized.includes(kw))) {
    return 1;
  }

  // Conservación (dimension 2)
  const conservacionKeywords = ['perecedero', 'congelado', 'fresco', 'refrigerado'];
  if (conservacionKeywords.some(kw => normalized.includes(kw))) {
    return 2;
  }

  // Departamento (dimension 3)
  const departamentoKeywords = ['mostrador', 'pollería', 'fiambrería', 'almacén', 'rotisería'];
  if (departamentoKeywords.some(kw => normalized.includes(kw))) {
    return 3;
  }

  // Integridad (dimension 4)
  const integridadKeywords = ['hueso', 'entero', 'trozado', 'molido', 'fileteado'];
  if (integridadKeywords.some(kw => normalized.includes(kw))) {
    return 4;
  }

  // Perfil comercial (dimension 5)
  const perfilKeywords = ['margen', 'gancho', 'precio', 'estacional'];
  if (perfilKeywords.some(kw => normalized.includes(kw))) {
    return 5;
  }

  // Cannot infer - return null for "uncategorized"
  return null;
}
