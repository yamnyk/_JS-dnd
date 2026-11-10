// Forgets to pass the index to the callback.
export function myMap(items, fn) {
  const result = [];
  for (let index = 0; index < items.length; index++) {
    result.push(fn(items[index]));
  }
  return result;
}
