// Keeps only the last value of a repeated key.
export function parseQuery(qs) {
  const result = Object.create(null);
  for (const piece of qs.split('&')) {
    if (piece === '') continue;
    const equals = piece.indexOf('=');
    const rawKey = equals === -1 ? piece : piece.slice(0, equals);
    const rawValue = equals === -1 ? '' : piece.slice(equals + 1);
    result[decodeURIComponent(rawKey.replaceAll('+', ' '))] = [decodeURIComponent(rawValue.replaceAll('+', ' '))];
  }
  return result;
}
