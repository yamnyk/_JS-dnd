// Starts the timer only on the first call and keeps those arguments, so a later call neither restarts the wait
// nor changes what fn gets.
export function debounce(fn, ms) {
  let timerId = null;
  return (...args) => {
    if (timerId === null) {
      timerId = setTimeout(() => {
        timerId = null;
        fn(...args);
      }, ms);
    }
  };
}
