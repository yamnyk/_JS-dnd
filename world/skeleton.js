// The fixed shape of every world (spec 5.2): same number of locations, NPCs, and quests for
// every player. The Master only invents names, descriptions, and voices for these slots.
// Roles are setting-neutral on purpose: a "market" becomes a night bazaar, a scrap bazaar, a
// goblin fair. Every location has 4 exits or fewer because choice prompts take at most 4 options.
export const SKELETON = {
  start: 'L1',
  locations: [
    { slot: 'L1', role: 'starting hub', exits: ['L2', 'L3', 'L4'] },
    { slot: 'L2', role: 'market', exits: ['L1', 'L5'] },
    { slot: 'L3', role: 'outskirts', exits: ['L1', 'L6'] },
    { slot: 'L4', role: 'ruin', exits: ['L1', 'L5'] },
    { slot: 'L5', role: 'archive', exits: ['L2', 'L4', 'L6'] },
    { slot: 'L6', role: 'stronghold', exits: ['L3', 'L5'] },
  ],
  // Who hands out which quests: one table. `rung` is the rung of the ladder (quests/curriculum.js) whose quests
  // this NPC offers, so a rung moves the hero to a new place. N7 owns the capstone, the final exam, which opens
  // only when every other quest is solved. Change an owner here and nowhere else.
  npcs: [
    { slot: 'N1', location: 'L1', role: 'mentor', rung: 1 },
    { slot: 'N2', location: 'L2', role: 'trader', rung: 2 },
    { slot: 'N3', location: 'L5', role: 'keeper', rung: 3 },
    { slot: 'N4', location: 'L3', role: 'wanderer', rung: 4 },
    { slot: 'N5', location: 'L4', role: 'recluse', rung: 5 },
    { slot: 'N6', location: 'L6', role: 'captain', rung: 6 },
    // The final boss. The fight opens only after the ladder is complete and the final exam is solved.
    { slot: 'N7', location: 'L6', role: 'boss', rung: 7 },
  ],
};
