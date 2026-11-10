// Replaces only the first separator.
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/, '-')
    .replace(/^-+|-+$/g, '');
}
