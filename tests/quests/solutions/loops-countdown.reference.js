export function countdown(from) {
  const numbers = [];
  for (let n = from; n >= 1; n--) {
    numbers.push(n);
  }
  return numbers;
}
