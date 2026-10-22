import { configureEntityHP } from "./hit-points";
import type { AppSnapshot, EncounterEntity, RosterMember } from "./types";

function applyRosterProfile(target: EncounterEntity, source: EncounterEntity, rosterTemplate = false): EncounterEntity {
  const profiled = {
    ...target,
    name: source.name,
    type: source.type,
    initiativeModifier: source.initiativeModifier,
    armorClass: source.armorClass,
    statBlock: source.statBlock ? structuredClone(source.statBlock) : undefined,
    notes: structuredClone(source.notes),
  };
  return configureEntityHP(profiled, rosterTemplate ? source.maxHP : undefined, source.maxHP);
}

/**
 * Writes reusable character information back to the roster template and every
 * encounter copy that references it. Combat-only state (current HP, initiative,
 * effects, reactions, death saves, and turn state) remains local to each copy.
 */
export function syncLinkedRosterEntity(snapshot: AppSnapshot, source: EncounterEntity): AppSnapshot {
  if (!source.rosterId || !snapshot.roster.some((member) => member.rosterId === source.rosterId)) return snapshot;
  const rosterId = source.rosterId;
  return {
    ...snapshot,
    roster: snapshot.roster.map((member) => member.rosterId === rosterId
      ? applyRosterProfile(member, source, true) as RosterMember
      : member),
    encounters: snapshot.encounters.map((encounter) => ({
      ...encounter,
      entities: encounter.entities.map((entity) => entity.rosterId === rosterId
        ? applyRosterProfile(entity, source)
        : entity),
    })),
  };
}

/**
 * Keeps the reusable roster template and every encounter copy linked to it on
 * the same maximum HP. Encounter copies retain their current HP unless the new
 * maximum requires it to be clamped; roster templates remain fully healed.
 */
export function syncLinkedMaximumHP(snapshot: AppSnapshot, rosterId: string, maxHP: number): AppSnapshot {
  return {
    ...snapshot,
    roster: snapshot.roster.map((member) => member.rosterId === rosterId
      ? configureEntityHP(member, maxHP, maxHP) as RosterMember
      : member),
    encounters: snapshot.encounters.map((encounter) => ({
      ...encounter,
      entities: encounter.entities.map((entity) => entity.rosterId === rosterId
        ? configureEntityHP(entity, undefined, maxHP)
        : entity),
    })),
  };
}
