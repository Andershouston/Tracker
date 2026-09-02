import type { Encounter, EncounterEntity } from "./types";

export function rollInitiative(entity: EncounterEntity, random = Math.random): EncounterEntity {
  const roll = Math.floor(random() * 20) + 1 + entity.initiativeModifier;
  return { ...entity, initiative: roll, hasRolledInitiative: true };
}

export function rollAll(encounter: Encounter, type?: EncounterEntity["type"]): Encounter {
  return {
    ...encounter,
    entities: encounter.entities.map((entity) => {
      if (type && entity.type !== type) return entity;
      return rollInitiative(entity);
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function sortInitiative(encounter: Encounter): Encounter {
  return {
    ...encounter,
    entities: [...encounter.entities].sort((a, b) => {
      const initiative = (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity);
      return initiative || b.initiativeModifier - a.initiativeModifier;
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function resetInitiative(encounter: Encounter): Encounter {
  return {
    ...encounter,
    mode: "staging",
    round: 1,
    activeEntityId: null,
    entities: encounter.entities.map((entity) => ({ ...entity, initiative: null, hasRolledInitiative: false })),
    updatedAt: new Date().toISOString(),
  };
}
