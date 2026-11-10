export function myFilter(items, fn) {
  const kept = [];
  for (let index = 0; index < items.length; index++) {
    if (fn(items[index], index)) {
      kept.push(items[index]);
    }
  }
  return kept;
}
