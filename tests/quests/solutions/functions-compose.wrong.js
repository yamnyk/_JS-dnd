// Applies the functions left to right instead of right to left.
export function compose(...fns) {
  return (input) => fns.reduce((result, fn) => fn(result), input);
}
