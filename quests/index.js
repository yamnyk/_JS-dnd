import diceRoll from './dice-roll.js';
import valuesFahrenheit from './values-fahrenheit.js';
import valuesDescribe from './values-describe.js';
import valuesToNumber from './values-to-number.js';
import stringShout from './string-shout.js';
import stringsCountLabel from './strings-count-label.js';
import stringsMiddle from './strings-middle.js';
import arraysFirstLast from './arrays-first-last.js';
import arraySum from './array-sum.js';
import arraysRotate from './arrays-rotate.js';
import objectsFullName from './objects-full-name.js';
import objectsCountWords from './objects-count-words.js';
import objectsMergeDeep from './objects-merge-deep.js';

// The fixed quest list, in play order: by rung, the opening first, then subject, then easy to hard
// (quests/curriculum.js pins the order). Checks live in the repo; the Master only reskins the story.
export const QUESTS = [
  diceRoll,
  valuesFahrenheit,
  valuesDescribe,
  valuesToNumber,
  stringShout,
  stringsCountLabel,
  stringsMiddle,
  arraysFirstLast,
  arraySum,
  arraysRotate,
  objectsFullName,
  objectsCountWords,
  objectsMergeDeep,
];

export const getQuest = (id) => QUESTS.find((quest) => quest.id === id);
