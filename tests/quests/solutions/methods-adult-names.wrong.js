// Sorts the users in place, so the array that came in changes order.
export function adultNames(users) {
  users.sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
  return users.filter((user) => user.age >= 18).map((user) => user.name);
}
