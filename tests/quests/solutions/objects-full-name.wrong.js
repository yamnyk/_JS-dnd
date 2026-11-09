// Always adds the space and the last name, even when there is none.
export function fullName(person) {
  return `${person.first} ${person.last}`;
}
