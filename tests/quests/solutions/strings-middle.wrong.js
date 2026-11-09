// Always returns one character, so even lengths lose the second middle one.
export function middle(text) {
  return text.charAt(Math.floor(text.length / 2));
}
