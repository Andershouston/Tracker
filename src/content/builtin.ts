import type { EffectDefinition, EffectTick } from "../domain/types";

const effect = (
  id: string,
  name: string,
  category: EffectDefinition["category"],
  description: string,
  duration: number | null = null,
  tickAt: EffectTick = "turn-start",
): EffectDefinition => ({ id, name, category, description, duration: { default: duration, tickAt } });

export const BUILTIN_EFFECTS: EffectDefinition[] = [
  effect("dodge-action", "Dodge", "beneficial", "Attacks from visible attackers have disadvantage and Dexterity saves have advantage.", 1),
  effect("readied-action", "Readied Action", "neutral", "Waiting to use a reaction when a chosen trigger occurs.", 1),
  effect("reaction-used", "Reaction Used", "detrimental", "Cannot take another reaction until the start of the next turn.", 1),
  effect("stabilized", "Stable", "beneficial", "Unconscious at 0 HP, but no longer making death saving throws.", null, "manual"),
];

const ICON_FILES: Record<string, string> = {
  concentration: "Concentration.svg",
  advantage: "Advantage.svg",
  disadvantage: "Disadvantage.svg",
  blessed: "Blessed.svg",
  hasted: "Hasted.svg",
  inspired: "Inspired.svg",
  raging: "Raging.svg",
  "shield-of-faith": "Shield of Faith.svg",
  invisible: "Invisible.svg",
  flying: "Flying.svg",
  blinded: "Blinded.svg",
  charmed: "Charmed.svg",
  deafened: "Deafened.svg",
  exhausted: "Exhausted.svg",
  frightened: "Frightened.svg",
  grappled: "Grappled.svg",
  incapacitated: "Incapacitated.svg",
  paralyzed: "Paralyzed.svg",
  petrified: "Petrified.svg",
  poisoned: "Poisoned.svg",
  prone: "Prone.svg",
  restrained: "Restrained.svg",
  stunned: "Stunned.svg",
  unconscious: "Unconcious.svg",
  baned: "Baned.svg",
  hex: "Hex.svg",
  marked: "Mark.svg",
  burning: "On Fire.svg",
  bleeding: "wounded.svg",
  confused: "Confused.svg",
  entangled: "Entangled.svg",
  possessed: "Possessed.svg",
  "dodge-action": "Dodge Action.svg",
  "readied-action": "Holding Action.svg",
  "reaction-used": "Reaction Used.svg",
  stabilized: "Stabilized.svg",
};

export const effectIconPath = (id: string) => ICON_FILES[id] ? `/icons/conditions/${encodeURIComponent(ICON_FILES[id])}` : null;
