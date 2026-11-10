export function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fallback;
    }
    throw error;
  }
}
