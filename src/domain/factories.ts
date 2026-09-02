import type { AppSnapshot, Encounter, EncounterEntity, EntityType, RulesetId, RosterMember } from "./types";

export const uid = (prefix = "id") => {
  const secureId = globalThis.crypto?.randomUUID?.();
  if (secureId) return `${prefix}_${secureId.replaceAll("-", "")}`;

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

export function createEntity(overrides: Partial<EncounterEntity> = {}): EncounterEntity {
  return {
    id: uid("entity"),
    name: "Unknown",
    type: "Enemy",
    initiative: null,
    initiativeModifier: 0,
    hasRolledInitiative: false,
    maxHP: 10,
    currentHP: 10,
    tempHP: 0,
    lethalOverflow: 0,
    armorClass: 12,
    effects: [],
    notes: [],
    isPersistent: false,
    isDead: false,
    isUnconscious: false,
    isDying: false,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    reactionUsed: false,
    isDelayed: false,
    rosterId: null,
    ...overrides,
  };
}

export function createRosterMemberFromEntity(entity: EncounterEntity): RosterMember {
  const rosterId = entity.rosterId ?? uid("roster");
  return {
    ...structuredClone(entity),
    id: uid("entity"),
    rosterId,
    initiative: null,
    hasRolledInitiative: false,
    currentHP: Math.max(0, entity.maxHP),
    tempHP: 0,
    lethalOverflow: 0,
    effects: [],
    isPersistent: true,
    isDead: entity.maxHP === 0,
    isUnconscious: false,
    isDying: false,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    reactionUsed: false,
    isDelayed: false,
  };
}

export function instantiateRosterMember(member: RosterMember): EncounterEntity {
  return {
    ...structuredClone(member),
    id: uid("entity"),
    rosterId: member.rosterId,
    initiative: null,
    hasRolledInitiative: false,
    currentHP: Math.max(0, member.maxHP),
    tempHP: 0,
    lethalOverflow: 0,
    effects: [],
    isPersistent: true,
    isDead: member.maxHP === 0,
    isUnconscious: false,
    isDying: false,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    reactionUsed: false,
    isDelayed: false,
  };
}

export function createEncounter(name = "New Encounter", rulesetId: RulesetId = "dnd5e-2024-srd-5.2.1"): Encounter {
  const now = new Date().toISOString();
  return {
    id: uid("encounter"),
    name,
    rulesetId,
    round: 1,
    activeEntityId: null,
    mode: "staging",
    entities: [],
    log: [],
    createdAt: now,
    updatedAt: now,
  };
}

function rosterMember(entity: EncounterEntity): RosterMember {
  return createRosterMemberFromEntity(entity);
}

export function createSeedSnapshot(): AppSnapshot {
  const encounter = createEncounter("Example Encounter");
  encounter.entities = [
    createEntity({ name: "Aria Swiftblade", type: "PC", initiative: 18, hasRolledInitiative: true, initiativeModifier: 4, maxHP: 52, currentHP: 52, armorClass: 16, isPersistent: true }),
    createEntity({ name: "Lyra Moonwhisper", type: "PC", initiative: 15, hasRolledInitiative: true, initiativeModifier: 3, maxHP: 40, currentHP: 40, armorClass: 13, isPersistent: true }),
    createEntity({ name: "Goblin Chief", type: "Enemy", initiative: 14, hasRolledInitiative: true, initiativeModifier: 2, maxHP: 36, currentHP: 21, armorClass: 15 }),
    createEntity({ name: "Thorin Ironforge", type: "PC", initiative: 12, hasRolledInitiative: true, initiativeModifier: 1, maxHP: 78, currentHP: 55, tempHP: 5, armorClass: 18, isPersistent: true }),
    createEntity({ name: "Town Guard", type: "Ally", initiative: 11, hasRolledInitiative: true, initiativeModifier: 1, maxHP: 30, currentHP: 30, armorClass: 14 }),
    createEntity({ name: "Goblin Archer", type: "Enemy", initiative: 9, hasRolledInitiative: true, initiativeModifier: 2, maxHP: 16, currentHP: 8, armorClass: 13 }),
  ];
  encounter.entities = encounter.entities.map((entity) => entity.isPersistent ? { ...entity, rosterId: uid("roster") } : entity);
  encounter.log.push({ id: uid("log"), round: 1, turn: 0, type: "system", message: "Example Encounter loaded. Welcome, DM!", timestamp: Date.now() });
  const roster = encounter.entities.filter((entity) => entity.isPersistent).map(rosterMember);
  return {
    encounters: [encounter],
    roster,
    contentPacks: [],
    sessionNotes: [],
    settings: { activeEncounterId: encounter.id, activePanel: "log", persistenceRequested: false },
  };
}

export function parseEntityType(value: string): EntityType {
  return value === "PC" || value === "Ally" || value === "Neutral" ? value : "Enemy";
}
