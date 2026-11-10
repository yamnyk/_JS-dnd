// Usage: node dev/quest-tools/assemble.cjs <en|uk> <fragment.cjs> [<fragment.cjs> ...]
// Appends the quest entries of the fragment files to quests/text/<lang>.js, before the closing of `quests`.
// A fragment is `module.exports = { '<id>': { title, brief, stub, expected, specific }, ... }`. Ids that are
// already in the catalog are skipped, so running it twice is safe. QUEST_TOOLS_ROOT points it at another
// folder (the tests use a copy).
const fs = require('fs');
const path = require('path');

const root = process.env.QUEST_TOOLS_ROOT ?? path.resolve(__dirname, '..', '..');
const [lang, ...fragments] = process.argv.slice(2);
if (!['en', 'uk'].includes(lang) || !fragments.length) {
  console.error('usage: assemble.cjs <en|uk> <fragment.cjs>...');
  process.exit(1);
}

const file = path.join(root, 'quests', 'text', `${lang}.js`);
let text = fs.readFileSync(file, 'utf8');
const escapeTemplate = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const list = (items) => items.map((item) => `        ${JSON.stringify(item)},`).join('\n');

let added = 0;
try {
  for (const fragment of fragments) {
    const entries = require(path.resolve(fragment));
    for (const [id, entry] of Object.entries(entries)) {
      if (text.includes(`'${id}': {`)) continue;
      for (const field of ['title', 'brief', 'stub', 'expected', 'specific']) {
        if (entry[field] === undefined) throw new Error(`${id} has no ${field}`);
      }
      const block =
        `    '${id}': {\n` +
        `      title: ${JSON.stringify(entry.title)},\n` +
        `      brief: ${JSON.stringify(entry.brief)},\n` +
        `      stub: \`${escapeTemplate(entry.stub)}\`,\n` +
        `      expected: [\n${list(entry.expected)}\n      ],\n` +
        `      specific: [${entry.specific.length ? `\n${list(entry.specific)}\n      ` : ''}],\n` +
        `    },\n`;
      const end = text.lastIndexOf('  },\n};');
      if (end < 0) throw new Error(`${file}: closing of quests not found`);
      text = text.slice(0, end) + block + text.slice(end);
      added += 1;
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
fs.writeFileSync(file, text);
console.log(`${file}: added ${added} entries`);
