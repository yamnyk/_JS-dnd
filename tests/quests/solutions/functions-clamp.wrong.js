// Caps the top but forgets the bottom.
export function clamp(value, min, max) {
  return value > max ? max : value;
}
