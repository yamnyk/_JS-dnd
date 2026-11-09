export function fullName(person) {
  if (person.last === undefined) return person.first;
  return `${person.first} ${person.last}`;
}
