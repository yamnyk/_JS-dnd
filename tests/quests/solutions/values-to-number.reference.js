export function toNumberOrNull(input) {
  if (typeof input !== 'number' && typeof input !== 'string') return null;
  if (typeof input === 'string' && input.trim() === '') return null;
  const number = Number(input);
  return Number.isNaN(number) ? null : number;
}
