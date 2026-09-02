import type { ContentPackDocument } from "../domain/types";

/**
 * Development-only content used to exercise the Library's populated state.
 * App startup includes it on localhost when the user has no installed packs.
 */
export const SHOWCASE_CONTENT_PACK: ContentPackDocument = {
  schemaVersion: 1,
  pack: {
    id: "emberwatch-field-guide",
    name: "The Emberwatch Field Guide: Ashen Coast Encounters",
    sourceVersion: "0.8.3-preview",
    rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
    requiredAttribution: [
      {
        text: "Fictional showcase content created for Initiative Tracker interface testing.",
      },
      {
        text: "Illustrative rules reference — example.invalid/emberwatch-open-content",
        url: "https://example.invalid/emberwatch-open-content",
      },
    ],
  },
  content: {
    conditions: [
      {
        id: "ash-blind",
        name: "Ash-Blind",
        description: "Searing ash clouds the creature's sight. It has disadvantage on its next attack roll before the end of its turn.",
        category: "detrimental",
        rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
        duration: { default: 1, tickAt: "turn-end" },
      },
      {
        id: "cinder-marked",
        name: "Cinder-Marked",
        description: "The next source of fire damage against this creature deals 1d6 additional damage, then the mark ends.",
        category: "debuff",
        rulesetCompatibility: ["dnd5e-2024-srd-5.2.1"],
        duration: { default: 3, tickAt: "turn-end" },
      },
      {
        id: "ember-ward",
        name: "Ember Ward",
        description: "A warm current turns aside sparks and grants resistance to the next instance of fire damage.",
        category: "beneficial",
        rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
        duration: { default: 1, tickAt: "turn-start" },
      },
      {
        id: "glassfooted",
        name: "Glassfooted",
        description: "Volcanic glass makes the ground treacherous. Speed is reduced by 10 feet until the effect ends.",
        category: "detrimental",
        rulesetCompatibility: ["dnd5e-2014-srd-5.1"],
        duration: { default: 2, tickAt: "turn-end" },
      },
      {
        id: "phoenix-tempo",
        name: "Phoenix Tempo",
        description: "Momentum builds after a successful strike, granting a +2 bonus to the next damage roll.",
        category: "buff",
        rulesetCompatibility: ["dnd5e-2024-srd-5.2.1"],
        duration: { default: 1, tickAt: "turn-end" },
      },
      {
        id: "smoke-veiled",
        name: "Smoke-Veiled",
        description: "Smoke obscures the creature without fully blinding it. The effect is removed manually when it leaves the cloud.",
        category: "neutral",
        rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
        duration: { default: null, tickAt: "manual" },
      },
    ],
    creatures: [
      {
        id: "cinderback-behemoth",
        name: "Cinderback Behemoth",
        armorClass: 18,
        hitPoints: { average: 189, formula: "18d12 + 72" },
        initiativeModifier: -1,
        rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
      },
      {
        id: "emberwatch-pathfinder",
        name: "Emberwatch Pathfinder",
        armorClass: 15,
        hitPoints: { average: 44, formula: "8d8 + 8" },
        initiativeModifier: 4,
        rulesetCompatibility: ["dnd5e-2024-srd-5.2.1"],
      },
      {
        id: "obsidian-gull-swarm",
        name: "Swarm of Obsidian Gulls",
        armorClass: 13,
        hitPoints: { average: 36, formula: "8d8" },
        initiativeModifier: 2,
        rulesetCompatibility: ["dnd5e-2014-srd-5.1"],
      },
      {
        id: "saint-vulkas-echo",
        name: "Echo of Saint Vulka, Keeper of the Last Coal",
        armorClass: 20,
        hitPoints: { average: 255, formula: "30d8 + 120" },
        initiativeModifier: 7,
        rulesetCompatibility: ["dnd5e-2024-srd-5.2.1"],
      },
    ],
    spells: [
      {
        id: "borrowed-sunrise",
        name: "Borrowed Sunrise",
        level: 5,
        description: "A false dawn breaks over the battlefield, revealing hidden creatures and invigorating chosen allies.",
        duration: "Concentration, up to 1 minute",
        concentration: true,
        rulesetCompatibility: ["dnd5e-2024-srd-5.2.1"],
      },
      {
        id: "cinderspeech",
        name: "Cinderspeech",
        level: 1,
        description: "A message travels through any two flames you can see within range.",
        duration: "1 round",
        concentration: false,
        rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
      },
      {
        id: "glass-road",
        name: "Glass Road",
        level: 3,
        description: "You create a shining path across unstable ground that supports creatures moving along it.",
        duration: "10 minutes",
        concentration: true,
        rulesetCompatibility: ["dnd5e-2014-srd-5.1"],
      },
      {
        id: "quench-the-heartfire",
        name: "Quench the Heartfire",
        level: 4,
        description: "You suppress magical flame and briefly dull the supernatural fury of a creature you can see.",
        duration: "Concentration, up to 1 minute",
        concentration: true,
        rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
      },
      {
        id: "sparkstep",
        name: "Sparkstep",
        level: 2,
        description: "You vanish in a spray of sparks and reappear in an unoccupied space nearby.",
        duration: "Instantaneous",
        concentration: false,
        rulesetCompatibility: ["dnd5e-2024-srd-5.2.1"],
      },
    ],
  },
};
