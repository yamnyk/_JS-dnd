// Throws the first error it saw, not the last one.
export function retry(fn, attempts) {
  let firstError;
  let failed = false;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      if (!failed) {
        firstError = error;
        failed = true;
      }
    }
  }
  throw firstError;
}
