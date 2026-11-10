// Capitalizes the first letter of each word but leaves the rest of the word as it was.
export function titleCase(text) {
  if (text === '') return '';
  return text
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
