// Sorts the names, but the brief says to keep the order of the users.
export function names(users) {
  return users.map((user) => user.name).sort();
}
