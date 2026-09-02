import { uid } from "../domain/factories";
import type { ActiveEffect, AppSnapshot, Encounter, EncounterEntity, EntityNote, EntityType, RosterMember } from "../domain/types";

interface LegacyState {
  activeEncounterId?: string;
  encounters?: Array<Record<string, unknown>>;
  partyRoster?: Array<Record<string, unknown>>;
  sessionNotes?: Array<Record<string, unknown>>;
}

const number = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const boolean = (value: unknown) => value === true;
const entityType = (value: unknown): EntityType => value === "PC" || value === "Ally" || value === "Neutral" ? value : "Enemy";

function notes(value: unknown): EntityNote[] {
  if (Array.isArray(value)) return value.filter((note) => note && typeof note === "object" && typeof note.text === "string").map((note) => ({ id: typeof note.id === "string" ? note.id : uid("note"), timestamp: number(note.timestamp, Date.now()), text: note.text }));
  if (typeof value === "string" && value.trim()) return [{ id: uid("note"), timestamp: Date.now(), text: value.trim() }];
  return [];
}

function effects(value: unknown): ActiveEffect[] {
  if (!Array.isArray(value)) return [];
  return value.filter((effect) => effect && typeof effect === "object" && typeof effect.name === "string").map((effect) => ({
    id: typeof effect.id === "string" ? effect.id : uid("effect"),
    definitionId: typeof effect.key === "string" ? effect.key : typeof effect.definitionId === "string" ? effect.definitionId : "custom",
    name: effect.name,
    description: typeof effect.description === "string" ? effect.description : "",
    category: ["neutral", "beneficial", "buff", "debuff", "detrimental"].includes(String(effect.category)) ? effect.category as ActiveEffect["category"] : "neutral",
    duration: typeof effect.duration === "number" ? effect.duration : null,
    tickAt: "turn-start",
  }));
}

function migrateEntity(raw: Record<string, unknown>): EncounterEntity {
  return {
    id: typeof raw.id === "string" ? raw.id : uid("entity"),
    name: typeof raw.name === "string" ? raw.name : "Unknown",
    type: entityType(raw.type),
    initiative: typeof raw.initiative === "number" ? raw.initiative : null,
    initiativeModifier: number(raw.initiativeModifier, 0),
    hasRolledInitiative: boolean(raw.hasRolledInitiative) || typeof raw.initiative === "number",
    maxHP: number(raw.maxHP, 10),
    currentHP: number(raw.currentHP, 10),
    tempHP: number(raw.tempHP, 0),
    lethalOverflow: Math.max(0, number(raw.lethalOverflow, 0)),
    armorClass: number(raw.armorClass ?? raw.ac, 12),
    effects: effects(raw.effects ?? raw.conditions),
    notes: notes(raw.notes),
    isPersistent: boolean(raw.isPersistent),
    isDead: boolean(raw.isDead),
    isUnconscious: boolean(raw.isUnconscious),
    isDying: boolean(raw.isDying),
    deathSaveSuccesses: number(raw.deathSaveSuccesses, 0),
    deathSaveFailures: number(raw.deathSaveFailures, 0),
    reactionUsed: boolean(raw.reactionUsed),
    isDelayed: boolean(raw.isDelayed),
    rosterId: typeof raw.rosterId === "string" ? raw.rosterId : null,
  };
}

export function importLegacyState(): AppSnapshot | null {
  const raw = localStorage.getItem("dmtools_state");
  if (!raw) return null;
  try {
    const legacy = JSON.parse(raw) as LegacyState;
    if (!Array.isArray(legacy.encounters) || !legacy.encounters.length) return null;
    const encounters: Encounter[] = legacy.encounters.map((item) => {
      const entities = Array.isArray(item.entities) ? item.entities.filter((entity) => entity && typeof entity === "object").map((entity) => migrateEntity(entity as Record<string, unknown>)) : [];
      const activeIndex = number(item.activeIndex, 0);
      return {
        id: typeof item.id === "string" ? item.id : uid("encounter"),
        name: typeof item.name === "string" ? item.name : "Imported Encounter",
        rulesetId: "dnd5e-2014-srd-5.1",
        round: number(item.round, 1),
        activeEntityId: item.mode === "active" ? entities[activeIndex]?.id ?? null : null,
        mode: item.mode === "active" ? "active" : "staging",
        entities,
        log: Array.isArray(item.log) ? item.log.map((entry) => ({
          id: uid("log"),
          round: number(entry.round, 1),
          turn: number(entry.turn, 0),
          type: typeof entry.type === "string" ? entry.type : "system",
          message: typeof entry.message === "string" ? entry.message : "Imported event",
          timestamp: number(entry.ts ?? entry.timestamp, Date.now()),
        })) as Encounter["log"] : [],
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    const roster: RosterMember[] = Array.isArray(legacy.partyRoster) ? legacy.partyRoster.map((item) => {
      const entity = migrateEntity(item);
      const rosterId = typeof item.rosterId === "string" ? item.rosterId : typeof item.id === "string" ? item.id : uid("roster");
      return { ...entity, rosterId, isPersistent: true };
    }) : [];
    return {
      encounters,
      roster,
      contentPacks: [],
      sessionNotes: Array.isArray(legacy.sessionNotes) ? legacy.sessionNotes.filter((note) => note && typeof note.text === "string").map((note) => ({ id: typeof note.id === "string" ? note.id : uid("note"), timestamp: number(note.timestamp, Date.now()), text: note.text as string })) : [],
      settings: { activeEncounterId: legacy.activeEncounterId ?? encounters[0].id, activePanel: "log", persistenceRequested: false },
    };
  } catch {
    return null;
  }
}
