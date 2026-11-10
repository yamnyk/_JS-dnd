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
import logicFizzbuzz from './logic-fizzbuzz.js';
import logicLeapYear from './logic-leap-year.js';
import logicShippingFee from './logic-shipping-fee.js';
import loopsCountdown from './loops-countdown.js';
import loopsPrimes from './loops-primes.js';
import loopsCollatz from './loops-collatz.js';
import functionsClamp from './functions-clamp.js';
import functionsApplyN from './functions-apply-n.js';
import functionsCompose from './functions-compose.js';
import callbacksTimes from './callbacks-times.js';
import callbacksMyMap from './callbacks-my-map.js';
import callbacksMyFilter from './callbacks-my-filter.js';
import methodsNames from './methods-names.js';
import methodsAdultNames from './methods-adult-names.js';
import methodsTotalsByCategory from './methods-totals-by-category.js';
import smethodsTitleCase from './smethods-title-case.js';
import smethodsSlugify from './smethods-slugify.js';
import smethodsParseQuery from './smethods-parse-query.js';
import closuresCounter from './closures-counter.js';
import closuresOnce from './closures-once.js';
import closuresMemoize from './closures-memoize.js';

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
  logicFizzbuzz,
  logicLeapYear,
  logicShippingFee,
  loopsCountdown,
  loopsPrimes,
  loopsCollatz,
  functionsClamp,
  functionsApplyN,
  functionsCompose,
  callbacksTimes,
  callbacksMyMap,
  callbacksMyFilter,
  methodsNames,
  methodsAdultNames,
  methodsTotalsByCategory,
  smethodsTitleCase,
  smethodsSlugify,
  smethodsParseQuery,
  closuresCounter,
  closuresOnce,
  closuresMemoize,
];

export const getQuest = (id) => QUESTS.find((quest) => quest.id === id);
