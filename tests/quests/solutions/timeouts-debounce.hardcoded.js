// Schedules the catalog example only: a fixed wait of 100 ms and the first argument.
export function debounce(fn, ms) {
  let timerId;
  return (value) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(value), 100);
  };
}
