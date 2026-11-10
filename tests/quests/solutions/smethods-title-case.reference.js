export function titleCase(text) {
  if (text === '') return '';
  return text
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
