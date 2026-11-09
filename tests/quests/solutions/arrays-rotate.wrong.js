// Works until steps is bigger than the array.
export function rotateLeft(items, steps) {
  return [...items.slice(steps), ...items.slice(0, steps)];
}
