import { uid } from "./factories";
import type { CombatLogEntry, CombatLogType, Encounter } from "./types";

export function logEntry(encounter: Encounter, type: CombatLogType, message: string): CombatLogEntry {
  const activeIndex = encounter.entities.findIndex((entity) => entity.id === encounter.activeEntityId);
  return {
    id: uid("log"),
    round: encounter.round,
    turn: Math.max(0, activeIndex),
    type,
    message,
    timestamp: Date.now(),
  };
}

export function withLog(encounter: Encounter, type: CombatLogType, message: string): Encounter {
  return { ...encounter, log: [...encounter.log, logEntry(encounter, type, message)].slice(-500), updatedAt: new Date().toISOString() };
}
