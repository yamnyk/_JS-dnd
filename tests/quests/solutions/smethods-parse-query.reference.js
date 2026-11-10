export function parseQuery(qs) {
  const result = new Map();
  for (const piece of qs.split('&')) {
    if (piece === '') continue;
    const equals = piece.indexOf('=');
    const rawKey = equals === -1 ? piece : piece.slice(0, equals);
    const rawValue = equals === -1 ? '' : piece.slice(equals + 1);
    const key = decodeURIComponent(rawKey.replaceAll('+', ' '));
    const value = decodeURIComponent(rawValue.replaceAll('+', ' '));
    result.set(key, [...(result.get(key) ?? []), value]);
  }
  return Object.fromEntries(result);
}
