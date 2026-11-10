// Drops falsy items even when the callback says to keep them.
export function myFilter(items, fn) {
  const kept = [];
  for (let index = 0; index < items.length; index++) {
    if (items[index] && fn(items[index], index)) {
      kept.push(items[index]);
    }
  }
  return kept;
}
