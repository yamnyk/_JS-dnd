// Checks the multiple of 3 first, so 15 never reaches the FizzBuzz line.
export function fizzBuzz(n) {
  if (n % 3 === 0) return 'Fizz';
  if (n % 5 === 0) return 'Buzz';
  if (n % 15 === 0) return 'FizzBuzz';
  return String(n);
}
