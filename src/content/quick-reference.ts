export interface QuickReferenceEntry {
  id: string;
  title: string;
  summary: string;
  description?: string;
}

export interface QuickReferenceSection {
  title: string;
  qualifier: string;
  introduction: string;
  entries: QuickReferenceEntry[];
}

export const QUICK_REFERENCES = {
  movement: {
    title: "Movement",
    qualifier: "Limited by movement speed",
    introduction: "You can move at any time during your turn (before, after, or during actions).",
    entries: [
      { id: "move", title: "Move", summary: "Cost: 5ft per 5ft", description: "Use up to your speed; you can split it before, after, or between attacks within an action.\n\nSwitching between different speeds (for example, walking and flying) mid-move: subtract distance already moved from the new speed to find what is left." },
      { id: "climb", title: "Climb", summary: "Cost: 10ft per 5ft" },
      { id: "swim", title: "Swim", summary: "Cost: 10ft per 5ft" },
      { id: "drop-prone", title: "Drop prone", summary: "No cost" },
      { id: "crawl", title: "Crawl", summary: "Cost: 10ft per 5ft", description: "Crawling costs 1 extra foot per foot moved and stacks with difficult terrain." },
      { id: "stand", title: "Stand up", summary: "Cost: half total movement" },
      { id: "high-jump", title: "High jump", summary: "Cost: 5ft per 5ft" },
      { id: "long-jump", title: "Long jump", summary: "Cost: 5ft per 5ft" },
      { id: "flying", title: "Flying", summary: "Cost: 5ft per 5ft", description: "If a flying creature is knocked prone, has its speed reduced to 0, or otherwise cannot move, it falls unless it can hover or is held aloft magically." },
      { id: "creature-space", title: "Moving through creatures", summary: "Cost: 5ft per 5ft", description: "You can move through a nonhostile creature's space freely. You can move through a hostile creature's space only if it is two or more sizes larger or smaller than you. You can never end your move in another creature's space. Leaving a hostile creature's reach provokes an opportunity attack." },
      { id: "difficult-terrain", title: "Difficult terrain", summary: "Cost modifier: 10ft per 5ft", description: "Every foot costs 1 extra foot. A creature's space, hostile or not, also counts as difficult terrain." },
      { id: "improvise", title: "Improvise", summary: "Any stunt not on this list" },
      { id: "grapple-move", title: "Grapple move", summary: "Modifier: speed halved", description: "You can drag or carry the grappled creature, but your speed is halved unless it is two or more sizes smaller than you." },
    ],
  },
  actions: {
    title: "Combat Actions",
    qualifier: "Standard actions",
    introduction: "On your turn, take one of the actions presented here, an action you gained from your class or a special feature, or an action that you improvise.\n\nWhen you describe an action not detailed elsewhere in the rules, the GM tells you whether that action is possible and what kind of roll you need to make, if any, to determine success or failure.",
    entries: [
      { id: "attack", title: "Attack", summary: "Melee or ranged attack", description: "You make one melee or ranged attack. Certain features, such as Extra Attack, allow you to make more than one attack with this action.\n\nMaking an Attack\n1. Choose a target within range.\n2. Determine modifiers: cover, advantage or disadvantage, and other bonuses or penalties.\n3. Resolve the attack roll; on a hit, roll damage unless the attack specifies otherwise.\n\nRule of thumb: if you are making an attack roll, it is an attack." },
      { id: "grapple", title: "Grapple", summary: "Special melee attack", description: "A special melee attack made via the Attack action; it replaces one attack if you have multiple.\n\nRequirements\nThe target must be within reach and no more than one size larger than you. You need a free hand.\n\nContest\nYour Strength (Athletics) check versus the target's Strength (Athletics) or Dexterity (Acrobatics), target's choice. You automatically succeed if the target is incapacitated.\n\nSuccess\nThe target becomes grappled. You can release it at any time without using an action." },
      { id: "shove", title: "Shove", summary: "Special melee attack", description: "A special melee attack made via the Attack action; it replaces one attack if you have multiple.\n\nThe target must be within reach and no more than one size larger than you. Make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics), target's choice.\n\nOn a success, either knock the target prone or push it 5 feet away." },
      { id: "cast-action", title: "Cast a spell", summary: "Cast time of 1 action" },
      { id: "dash", title: "Dash", summary: "Double movement speed", description: "Gain extra movement equal to your speed, after modifiers, for this turn." },
      { id: "disengage", title: "Disengage", summary: "Prevent opportunity attacks", description: "Your movement does not provoke opportunity attacks for the rest of the turn." },
      { id: "dodge", title: "Dodge", summary: "Increase defenses", description: "Until your next turn, attacks against you have disadvantage if you can see the attacker, and you have advantage on Dexterity saving throws. You lose this benefit if you are incapacitated or your speed drops to 0." },
      { id: "escape", title: "Escape", summary: "Escape a grapple", description: "Contest your Strength (Athletics) or Dexterity (Acrobatics) check against the grappler's Strength (Athletics). On a success, you escape and are no longer grappled." },
      { id: "help", title: "Help", summary: "Grant an ally advantage", description: "Give an ally advantage on their next ability check for a task, provided they act before your next turn; or give an ally advantage on their next attack against a creature within 5 feet of you, provided they attack before your next turn." },
      { id: "equip", title: "Equip", summary: "Equip or unequip an item" },
      { id: "hide", title: "Hide", summary: "Hide from sight", description: "Make a Dexterity (Stealth) check to hide. Success grants the benefits of being unseen." },
      { id: "search", title: "Search", summary: "Search the location", description: "Make a Wisdom (Perception) or Intelligence (Investigation) check, as the GM determines." },
      { id: "ready", title: "Ready", summary: "Choose trigger and action", description: "Choose a trigger and a response: an action or movement up to your speed. When the trigger occurs, use your reaction to act. Readying a spell requires concentration until triggered; if concentration breaks, the spell is lost." },
      { id: "use-object", title: "Use Object", summary: "Interact, use special abilities", description: "Interact with an object that requires your action, or interact with a second object beyond your normal one free interaction per turn." },
      { id: "class-action", title: "Use Class feature", summary: "Some features cost actions" },
      { id: "improvise-action", title: "Improvise", summary: "Any action not on this list" },
    ],
  },
  bonus: {
    title: "Bonus Actions",
    qualifier: "1 per round",
    introduction: "You can take a bonus action only when a special ability, spell, or feature states that you can do something as a bonus action.",
    entries: [
      { id: "offhand", title: "Offhand Attack", summary: "Two-Weapon Fighting", description: "If you take the Attack action and attack with a light melee weapon in one hand, you can use your bonus action to attack with a different light melee weapon in your other hand.\n\nDo not add your ability modifier to the bonus attack's damage unless that modifier is negative. A weapon with the thrown property can be thrown instead of swung." },
      { id: "cast-bonus", title: "Cast a spell", summary: "Cast time of 1 bonus action" },
      { id: "class-bonus", title: "Use class feature", summary: "Some features use bonus actions" },
    ],
  },
  reactions: {
    title: "Reactions",
    qualifier: "1 per round",
    introduction: "An instant response to a trigger, which can occur on your turn or on someone else's.\n\nAfter you take a reaction, you cannot take another one until the start of your next turn. If the reaction interrupts another creature's turn, that creature continues its turn immediately afterward.",
    entries: [
      { id: "opportunity", title: "Opportunity attack", summary: "Enemy leaves your reach", description: "Triggered when a hostile creature you can see leaves your reach. Use your reaction to make one melee attack, resolved right before it leaves.\n\nYou do not get an opportunity attack if the creature Disengaged, teleports, or is moved without using its own movement, action, or reaction." },
      { id: "readied", title: "Readied action", summary: "Part of your Ready action" },
      { id: "cast-reaction", title: "Cast a spell", summary: "Cast time of 1 reaction" },
    ],
  },
} satisfies Record<string, QuickReferenceSection>;
