export function adultNames(users) {
  return users
    .filter((user) => user.age >= 18)
    .sort((a, b) => a.age - b.age || a.name.localeCompare(b.name))
    .map((user) => user.name);
}
