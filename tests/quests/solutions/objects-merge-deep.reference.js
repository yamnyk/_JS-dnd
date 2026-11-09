const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export function mergeDeep(a, b) {
  const merged = { ...a };
  for (const [key, value] of Object.entries(b)) {
    merged[key] = isPlainObject(value) && isPlainObject(merged[key]) ? mergeDeep(merged[key], value) : value;
  }
  return merged;
}
