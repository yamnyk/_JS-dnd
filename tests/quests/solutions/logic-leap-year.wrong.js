// Forgets the century rule, so 1900 counts as a leap year.
export function isLeapYear(year) {
  return year % 4 === 0;
}
