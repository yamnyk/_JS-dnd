// Only merges the top level, so a nested object from b replaces the whole nested object from a.
export function mergeDeep(a, b) {
  return { ...a, ...b };
}
