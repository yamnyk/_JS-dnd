// Treats zero as singular.
export function countLabel(count, noun) {
  return count > 1 ? `${count} ${noun}s` : `${count} ${noun}`;
}
