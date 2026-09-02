import type { EncounterEntity } from "./types";

export interface HealthChange {
  entity: EncounterEntity;
  message: string;
  secondaryMessage?: string;
}

function whole(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function clearDeathState(entity: EncounterEntity): EncounterEntity {
  return {
    ...entity,
    isDead: false,
    isDying: false,
    isUnconscious: false,
    lethalOverflow: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
  };
}

function stateAtOrBelowZero(entity: EncounterEntity, lethalOverflow: number, resetSaves = false): EncounterEntity {
  const overflow = Math.max(0, whole(lethalOverflow));
  const dead = entity.maxHP === 0 || overflow >= entity.maxHP;
  return {
    ...entity,
    currentHP: 0,
    lethalOverflow: overflow,
    isDead: dead,
    isDying: !dead,
    isUnconscious: false,
    deathSaveSuccesses: resetSaves ? 0 : entity.deathSaveSuccesses,
    deathSaveFailures: resetSaves ? 0 : entity.deathSaveFailures,
  };
}

/** Adds safe defaults when reading records written before lethal overflow existed. */
export function normalizeEntityHealth(source: EncounterEntity): EncounterEntity {
  const maxHP = Math.max(0, whole(source.maxHP, 10));
  const rawCurrent = whole(source.currentHP, maxHP);
  const storedOverflow = Math.max(0, whole(source.lethalOverflow ?? 0));
  const entity: EncounterEntity = {
    ...source,
    maxHP,
    currentHP: Math.min(maxHP, Math.max(0, rawCurrent)),
    tempHP: Math.max(0, whole(source.tempHP)),
    lethalOverflow: Math.max(storedOverflow, rawCurrent < 0 ? -rawCurrent : 0),
  };
  if (maxHP === 0) return { ...entity, currentHP: 0, lethalOverflow: 0, isDead: true, isDying: false, isUnconscious: false };
  if (entity.currentHP > 0) return { ...entity, lethalOverflow: 0 };
  if (entity.lethalOverflow >= maxHP) return { ...entity, isDead: true, isDying: false, isUnconscious: false };
  return entity;
}

/** Applies staging/admin HP configuration without describing it as damage or healing. */
export function configureEntityHP(source: EncounterEntity, currentValue?: number, maximumValue?: number): EncounterEntity {
  const entity = normalizeEntityHealth(structuredClone(source));
  const hasMaximum = maximumValue !== undefined;
  const hasCurrent = currentValue !== undefined;
  const nextMaximum = hasMaximum ? whole(maximumValue) : entity.maxHP;
  if (nextMaximum < 0) throw new RangeError("Maximum HP cannot be below zero.");

  let nextCurrent = hasCurrent ? whole(currentValue) : entity.currentHP;
  if (hasCurrent && nextCurrent > nextMaximum) throw new RangeError("Current HP cannot exceed Maximum HP.");
  if (!hasCurrent && nextCurrent > nextMaximum) nextCurrent = nextMaximum;

  const next = { ...entity, maxHP: nextMaximum };
  if (nextMaximum === 0) {
    return { ...next, currentHP: 0, tempHP: 0, lethalOverflow: 0, isDead: true, isDying: false, isUnconscious: false, deathSaveSuccesses: 0, deathSaveFailures: 0 };
  }
  if (nextCurrent > 0) return { ...clearDeathState(next), currentHP: nextCurrent };
  return stateAtOrBelowZero(next, Math.max(0, -nextCurrent), true);
}

export function damageEntity(source: EncounterEntity, rawAmount: number): HealthChange {
  const amount = Math.max(0, whole(rawAmount));
  let entity = normalizeEntityHealth(structuredClone(source));
  const before = entity.currentHP;
  const wasDying = entity.isDying && !entity.isDead;
  let remaining = amount;
  const absorbed = Math.min(entity.tempHP, remaining);
  entity.tempHP -= absorbed;
  remaining -= absorbed;

  if (entity.isDead || entity.maxHP === 0 || remaining === 0) {
    return {
      entity,
      message: `${entity.name} took ${amount} damage. HP: ${before} → ${entity.currentHP}${absorbed ? ` (${absorbed} temp absorbed)` : ""}.`,
    };
  }

  const effectiveCurrent = entity.currentHP > 0 ? entity.currentHP : -entity.lethalOverflow;
  const rawResult = effectiveCurrent - remaining;
  const enteringDying = entity.currentHP > 0 && rawResult <= 0;
  entity = rawResult > 0
    ? { ...entity, currentHP: rawResult, lethalOverflow: 0 }
    : stateAtOrBelowZero(entity, -rawResult, enteringDying);

  if (wasDying && amount > 0) {
    entity.deathSaveFailures = Math.min(3, entity.deathSaveFailures + 1);
    if (entity.deathSaveFailures >= 3) {
      entity.isDead = true;
      entity.isDying = false;
    }
  }

  const diedFromOverflow = entity.isDead && entity.lethalOverflow >= entity.maxHP;

  return {
    entity,
    message: `${entity.name} took ${amount} damage. HP: ${before} → ${entity.currentHP}${absorbed ? ` (${absorbed} temp absorbed)` : ""}.`,
    secondaryMessage: diedFromOverflow
      ? `${entity.name} died from lethal damage.`
      : entity.isDead && wasDying
        ? `${entity.name} died — 3 death save failures.`
        : wasDying
          ? `${entity.name} marked one death save failure.`
          : enteringDying
            ? `${entity.name} is dying.`
            : undefined,
  };
}

export function healEntity(source: EncounterEntity, rawAmount: number): HealthChange {
  const amount = Math.max(0, whole(rawAmount));
  let entity = normalizeEntityHealth(structuredClone(source));
  const before = entity.currentHP;
  if (entity.isDead || entity.maxHP === 0) {
    return { entity, message: `${entity.name} cannot be healed while dead.` };
  }

  const woke = amount > 0 && entity.currentHP === 0 && (entity.isDying || entity.isUnconscious);
  entity.currentHP = Math.min(entity.maxHP, Math.max(0, entity.currentHP) + amount);
  if (entity.currentHP > 0) {
    entity = {
      ...entity,
      isDying: false,
      isUnconscious: false,
      lethalOverflow: 0,
      deathSaveSuccesses: woke ? 3 : entity.deathSaveSuccesses,
      deathSaveFailures: woke ? 0 : entity.deathSaveFailures,
    };
  }
  return {
    entity,
    message: `${entity.name} healed ${entity.currentHP - before} HP. HP: ${before} → ${entity.currentHP}.`,
    secondaryMessage: woke ? `${entity.name} completed three successful death saves and regained consciousness.` : undefined,
  };
}

export function setEntityHP(source: EncounterEntity, value: number): HealthChange {
  const before = source.currentHP;
  const entity = configureEntityHP(source, value);
  return { entity, message: `${entity.name}'s HP was set: ${before} → ${entity.currentHP}.` };
}

export function setTempHP(source: EncounterEntity, value: number): HealthChange {
  const entity = { ...normalizeEntityHealth(source), tempHP: Math.max(0, whole(value)) };
  return { entity, message: `${entity.name} has ${entity.tempHP} temporary HP.` };
}

export function recordDeathSave(source: EncounterEntity, kind: "success" | "failure"): HealthChange {
  const entity = structuredClone(normalizeEntityHealth(source));
  const field = kind === "success" ? "deathSaveSuccesses" : "deathSaveFailures";
  const count = Math.min(3, entity[field] + 1);
  entity[field] = count;
  let secondaryMessage: string | undefined;
  if (entity.deathSaveSuccesses >= 3) {
    entity.isDying = false;
    entity.isUnconscious = true;
    entity.lethalOverflow = 0;
    entity.deathSaveSuccesses = 0;
    entity.deathSaveFailures = 0;
    secondaryMessage = `${entity.name} stabilized and is unconscious.`;
  } else if (entity.deathSaveFailures >= 3) {
    entity.isDying = false;
    entity.isDead = true;
    secondaryMessage = `${entity.name} died — 3 death save failures.`;
  }
  return { entity, message: `${entity.name}: death save ${kind} ${count}.`, secondaryMessage };
}

export function stabilizeEntity(source: EncounterEntity): HealthChange {
  const entity = { ...normalizeEntityHealth(source), lethalOverflow: 0, isDying: false, isUnconscious: true, deathSaveSuccesses: 0, deathSaveFailures: 0 };
  return { entity, message: `${entity.name} was stabilized and is unconscious.` };
}

export function reviveEntity(source: EncounterEntity): HealthChange {
  const maxHP = Math.max(1, source.maxHP);
  const entity = { ...source, maxHP, currentHP: 1, tempHP: Math.max(0, source.tempHP), lethalOverflow: 0, isDead: false, isDying: false, isUnconscious: false, deathSaveSuccesses: 0, deathSaveFailures: 0 };
  return { entity, message: `${entity.name} was revived with 1 HP.` };
}
