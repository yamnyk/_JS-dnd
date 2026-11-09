export function countWords(words) {
  const counts = {};
  for (const word of words) {
    counts[word] = Object.hasOwn(counts, word) ? counts[word] + 1 : 1;
  }
  return counts;
}
