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
