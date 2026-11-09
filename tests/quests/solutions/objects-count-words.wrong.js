// Breaks on words that every object already has, like "constructor".
export function countWords(words) {
  const counts = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
  }
  return counts;
}
