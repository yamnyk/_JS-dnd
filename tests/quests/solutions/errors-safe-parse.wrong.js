// Swallows every error, so it also hides errors that are not parse errors.
export function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
