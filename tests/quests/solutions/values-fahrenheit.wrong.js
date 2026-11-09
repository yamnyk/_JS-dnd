// Rounds the answer, so 36.6 loses its tenth.
export function celsiusToFahrenheit(c) {
  return Math.round((c * 9) / 5 + 32);
}
