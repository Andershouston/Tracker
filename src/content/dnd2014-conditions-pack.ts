import type { ContentPackDocument, EffectCategory, EffectDefinition } from "../domain/types";

const condition = (id: string, name: string, category: EffectCategory, description: string): EffectDefinition => ({
  id,
  name,
  category,
  description,
  rulesetCompatibility: ["dnd5e-2014-srd-5.1"],
  duration: { default: null, tickAt: "manual" },
});

export const DND_2014_CONDITIONS_PACK: ContentPackDocument = {
  schemaVersion: 1,
  pack: {
    id: "dnd-2014-srd-conditions",
    name: "D&D 2014 SRD Conditions",
    sourceVersion: "System Reference Document 5.1",
    rulesetCompatibility: ["dnd5e-2014-srd-5.1"],
    requiredAttribution: [
      {
        text: "System Reference Document 5.1 by Wizards of the Coast LLC, licensed under CC BY 4.0.",
        url: "https://creativecommons.org/licenses/by/4.0/",
      },
    ],
  },
  content: {
    conditions: [
      condition("blinded", "Blinded", "debuff", "Cannot see, automatically fails sight-dependent checks, attacks with disadvantage, and is attacked with advantage."),
      condition("charmed", "Charmed", "debuff", "Cannot attack or harm the charmer, who gains advantage on social checks involving the creature."),
      condition("deafened", "Deafened", "debuff", "Cannot hear and automatically fails checks that depend on hearing."),
      condition("exhausted", "Exhaustion", "detrimental", "Suffers cumulative penalties according to its current level of exhaustion."),
      condition("frightened", "Frightened", "debuff", "Has disadvantage on checks and attacks while the source is visible and cannot willingly move closer to it."),
      condition("grappled", "Grappled", "detrimental", "Its speed becomes 0 until the grapple ends."),
      condition("incapacitated", "Incapacitated", "detrimental", "Cannot take actions or reactions."),
      condition("invisible", "Invisible", "beneficial", "Cannot be seen without special senses; its attacks have advantage and attacks against it have disadvantage."),
      condition("paralyzed", "Paralyzed", "detrimental", "Is incapacitated, cannot move or speak, automatically fails certain saves, and is especially vulnerable to nearby attackers."),
      condition("petrified", "Petrified", "detrimental", "Is transformed into an inanimate substance, incapacitated, resistant to damage, and largely insulated from outside effects."),
      condition("poisoned", "Poisoned", "debuff", "Has disadvantage on attack rolls and ability checks."),
      condition("prone", "Prone", "detrimental", "Can only crawl until it stands and has altered attack advantages based on an attacker's distance."),
      condition("restrained", "Restrained", "detrimental", "Its speed becomes 0; its attacks and Dexterity saves are impaired, while attacks against it have advantage."),
      condition("stunned", "Stunned", "detrimental", "Is incapacitated, cannot move, speaks only falteringly, automatically fails certain saves, and is attacked with advantage."),
      condition("unconscious", "Unconscious", "detrimental", "Is incapacitated and unaware, drops held items, falls prone, automatically fails certain saves, and is vulnerable to nearby attacks."),
    ],
    creatures: [],
    spells: [],
  },
};
