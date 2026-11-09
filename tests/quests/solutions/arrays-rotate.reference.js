export function rotateLeft(items, steps) {
  if (items.length === 0) return [];
  const shift = ((steps % items.length) + items.length) % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}
