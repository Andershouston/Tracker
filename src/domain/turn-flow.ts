import { tickTurnStart } from "./effects";
import { withLog } from "./logging";
import type { Encounter } from "./types";

function tickActive(encounter: Encounter): Encounter {
  if (!encounter.activeEntityId) return encounter;
  const results = encounter.entities.map((entity) => tickTurnStart(entity, encounter.activeEntityId!, encounter.round));
  let next = { ...encounter, entities: results.map((result) => result.entity) };
  results.forEach(({ entity, expired }) => {
    for (const effect of expired) next = withLog(next, "condition", `${entity.name}: ${effect.name} expired.`);
  });
  return next;
}

export function beginCombat(encounter: Encounter): Encounter {
  if (!encounter.entities.length) return encounter;
  let next: Encounter = { ...encounter, mode: "active", round: 1, activeEntityId: encounter.entities[0].id };
  next = withLog(next, "system", "Combat started.");
  return tickActive(next);
}

export function nextTurn(encounter: Encounter): Encounter {
  if (encounter.mode !== "active" || !encounter.entities.length) return encounter;
  const index = encounter.entities.findIndex((entity) => entity.id === encounter.activeEntityId);
  const wrapped = index < 0 || index >= encounter.entities.length - 1;
  const nextIndex = wrapped ? 0 : index + 1;
  let next: Encounter = {
    ...encounter,
    round: wrapped ? encounter.round + 1 : encounter.round,
    activeEntityId: encounter.entities[nextIndex].id,
    entities: encounter.entities.map((entity, i) => (i === nextIndex ? { ...entity, isDelayed: false } : entity)),
  };
  if (wrapped) next = withLog(next, "system", `Round ${next.round} begins.`);
  return tickActive(next);
}

export function previousTurn(encounter: Encounter): Encounter {
  if (encounter.mode !== "active" || !encounter.entities.length) return encounter;
  const index = encounter.entities.findIndex((entity) => entity.id === encounter.activeEntityId);
  const wrapped = index <= 0 && encounter.round > 1;
  const nextIndex = index <= 0 ? (wrapped ? encounter.entities.length - 1 : 0) : index - 1;
  return {
    ...encounter,
    round: wrapped ? encounter.round - 1 : encounter.round,
    activeEntityId: encounter.entities[nextIndex].id,
  };
}

export function endRound(encounter: Encounter): Encounter {
  if (encounter.mode !== "active" || !encounter.entities.length) return encounter;
  const index = encounter.entities.findIndex((entity) => entity.id === encounter.activeEntityId);
  const skipped = Math.max(0, encounter.entities.length - index - 1);
  let next: Encounter = { ...encounter, round: encounter.round + 1, activeEntityId: encounter.entities[0].id };
  next = withLog(next, "system", `Round ended early by DM (${skipped} entities skipped). Round ${next.round} begins.`);
  return tickActive(next);
}

export function delayTurn(encounter: Encounter): Encounter {
  if (encounter.mode !== "active") return encounter;
  const index = encounter.entities.findIndex((entity) => entity.id === encounter.activeEntityId);
  if (index < 0) return encounter;
  const entities = [...encounter.entities];
  const [delayed] = entities.splice(index, 1);
  entities.push({ ...delayed, isDelayed: true });
  const activeIndex = Math.min(index, entities.length - 1);
  let next: Encounter = { ...encounter, entities, activeEntityId: entities[activeIndex]?.id ?? null };
  next = withLog(next, "system", `${delayed.name} delayed their turn.`);
  return tickActive(next);
}

export function returnToStaging(encounter: Encounter): Encounter {
  return withLog({ ...encounter, mode: "staging", activeEntityId: null }, "intermission", "Returned to staging.");
}

export function removeEntity(encounter: Encounter, entityId: string): Encounter {
  const removedIndex = encounter.entities.findIndex((entity) => entity.id === entityId);
  if (removedIndex < 0) return encounter;
  const removed = encounter.entities[removedIndex];
  const entities = encounter.entities.filter((entity) => entity.id !== entityId);
  let activeEntityId = encounter.activeEntityId;
  if (activeEntityId === entityId) activeEntityId = entities[Math.min(removedIndex, entities.length - 1)]?.id ?? null;
  return withLog({ ...encounter, entities, activeEntityId }, "system", `${removed.name} removed.`);
}
