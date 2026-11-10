// Starts a repeating timer and never clears it, so fn keeps running after the first time.
export function callLater(fn, ms) {
  setInterval(() => fn(), ms);
}
