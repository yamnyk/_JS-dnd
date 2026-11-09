export function compose(...fns) {
  return (input) => fns.reduceRight((result, fn) => fn(result), input);
}
