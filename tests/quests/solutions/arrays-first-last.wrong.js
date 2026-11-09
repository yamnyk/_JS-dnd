// Forgets that an empty array has no first or last item.
export function firstAndLast(items) {
  return [items[0], items[items.length - 1]];
}
