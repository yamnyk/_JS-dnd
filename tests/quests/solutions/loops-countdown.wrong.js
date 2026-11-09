// Stops one step too late, so the list ends with 0.
export function countdown(from) {
  const numbers = [];
  for (let n = from; n >= 0; n--) {
    numbers.push(n);
  }
  return numbers;
}
