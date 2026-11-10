// Remembers the timer in a variable outside the function, so cancel clears the newest timer of any caller.
let timerId;

export function cancellable(fn, ms) {
  timerId = setTimeout(fn, ms);
  return () => {
    clearTimeout(timerId);
  };
}
