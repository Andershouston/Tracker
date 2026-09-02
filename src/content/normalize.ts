import type { ContentPackDocument, EffectDefinition, RulesetId } from "../domain/types";
import { BUILTIN_EFFECTS } from "./builtin";

export function availableEffects(packs: ContentPackDocument[], rulesetId: RulesetId): EffectDefinition[] {
  const imported = packs.flatMap((pack) => {
    if (!pack.pack.rulesetCompatibility.includes(rulesetId)) return [];
    return pack.content.conditions.filter((condition) => !condition.rulesetCompatibility || condition.rulesetCompatibility.includes(rulesetId));
  });
  const pickerBuiltins = BUILTIN_EFFECTS.filter((effect) => effect.id !== "stabilized");
  return Array.from(new Map([...pickerBuiltins, ...imported].map((effect) => [effect.id, effect])).values());
}
