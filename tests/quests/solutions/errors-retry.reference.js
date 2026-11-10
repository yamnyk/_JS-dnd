export function retry(fn, attempts) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
