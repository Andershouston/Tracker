import { uid } from "./factories";
import type { ActiveEffect, EffectDefinition, EncounterEntity } from "./types";

interface EffectSource {
  entityId: string;
  currentRound?: number;
}

export function activateEffect(definition: EffectDefinition, duration = definition.duration?.default ?? null, source?: EffectSource): ActiveEffect {
  return {
    id: uid("effect"),
    definitionId: definition.id,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    duration,
    tickAt: definition.duration?.tickAt ?? "manual",
    sourceEntityId: source?.entityId,
    lastTickRound: source?.currentRound,
    presentation: definition.presentation,
  };
}

export function tickTurnStart(target: EncounterEntity, activeEntityId: string, round: number): { entity: EncounterEntity; expired: ActiveEffect[] } {
  const expired: ActiveEffect[] = [];
  const effects = target.effects
    .map((effect) => {
      const sourceEntityId = effect.sourceEntityId ?? target.id;
      if (effect.tickAt !== "turn-start" || effect.duration === null || sourceEntityId !== activeEntityId || effect.lastTickRound === round) return effect;
      const next = { ...effect, duration: Math.max(0, effect.duration - 1), lastTickRound: round };
      if (next.duration === 0) expired.push(next);
      return next;
    })
    .filter((effect) => effect.duration !== 0);
  const reactionExpired = expired.some((effect) => effect.definitionId === "reaction-used");
  return { entity: { ...target, effects, reactionUsed: reactionExpired ? false : target.reactionUsed }, expired };
}
