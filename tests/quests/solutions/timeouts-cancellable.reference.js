export function cancellable(fn, ms) {
  const timerId = setTimeout(fn, ms);
  return () => {
    clearTimeout(timerId);
  };
}
