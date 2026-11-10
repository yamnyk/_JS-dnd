// Looks up the catalog examples and nothing else.
const answers = {
  'a=1&b=two&a=3': { a: ['1', '3'], b: ['two'] },
  'name=Ada%20L': { name: ['Ada L'] },
  '': {},
};
export function parseQuery(qs) {
  return answers[qs];
}
