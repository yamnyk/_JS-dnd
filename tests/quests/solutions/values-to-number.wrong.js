// Trusts Number alone: '' becomes 0 instead of null.
export function toNumberOrNull(input) {
  const number = Number(input);
  return Number.isNaN(number) ? null : number;
}
