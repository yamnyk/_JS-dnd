export function firstAndLast(items) {
  if (items.length === 0) return [];
  return [items[0], items[items.length - 1]];
}
