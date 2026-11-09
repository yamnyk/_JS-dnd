export function countLabel(count, noun) {
  return count === 1 ? `${count} ${noun}` : `${count} ${noun}s`;
}
