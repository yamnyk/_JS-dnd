export function middle(text) {
  if (text === '') return '';
  const half = Math.floor(text.length / 2);
  return text.length % 2 === 0 ? text.slice(half - 1, half + 1) : text[half];
}
