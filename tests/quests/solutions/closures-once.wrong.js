// Decides "already ran" by looking at the result, so a result that is falsy runs fn again.
export function once(fn) {
  let result;
  return (...args) => {
    if (!result) {
      result = fn(...args);
    }
    return result;
  };
}
