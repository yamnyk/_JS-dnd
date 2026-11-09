function isPrime(number) {
  for (let divisor = 2; divisor * divisor <= number; divisor++) {
    if (number % divisor === 0) return false;
  }
  return true;
}

export function primesUpTo(n) {
  const primes = [];
  for (let candidate = 2; candidate <= n; candidate++) {
    if (isPrime(candidate)) primes.push(candidate);
  }
  return primes;
}
