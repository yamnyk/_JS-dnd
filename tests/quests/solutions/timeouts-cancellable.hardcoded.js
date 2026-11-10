// Schedules the catalog example only: a fixed timer of 100 ms that cancel stops.
export function cancellable(fn, ms) {
  const timerId = setTimeout(fn, 100);
  return () => clearTimeout(timerId);
}
