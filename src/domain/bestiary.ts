import type { ContentPackDocument, CreatureTemplate, EncounterEntity, RulesetId } from "./types";
import { createEntity, uid } from "./factories";
import { nextAvailableEntityName } from "./stat-block-links";

export type BestiaryOrigin = { kind: "local" } | { kind: "pack"; packId: string; sourceVersion: string };

export interface BestiaryEntry {
  key: string;
  creature: CreatureTemplate;
  rulesetId: RulesetId;
  origin: BestiaryOrigin;
  edition: "14" | "24" | "HB";
  challengeRating: string;
  creatureType: string;
}

const RULESET_2014: RulesetId = "dnd5e-2014-srd-5.1";
const RULESET_2024: RulesetId = "dnd5e-2024-srd-5.2.1";

export function statBlockDetail(creature: CreatureTemplate, label: string): string {
  return creature.statBlock?.details.find((detail) => detail.label.toLocaleLowerCase() === label.toLocaleLowerCase())?.value ?? "";
}

export function challengeRating(creature: CreatureTemplate): string {
  const value = statBlockDetail(creature, "Challenge") || statBlockDetail(creature, "CR");
  return value.match(/^(?:CR\s*)?([^\s(]+)/i)?.[1] ?? "—";
}

export function creatureType(creature: CreatureTemplate): string {
  const identity = creature.statBlock?.identity ?? "";
  const types = ["Aberration", "Beast", "Celestial", "Construct", "Dragon", "Elemental", "Fey", "Fiend", "Giant", "Humanoid", "Monstrosity", "Ooze", "Plant", "Undead"];
  return types.find((type) => identity.toLocaleLowerCase().includes(type.toLocaleLowerCase())) ?? "Other";
}

export function collectBestiaryEntries(local: CreatureTemplate[], packs: ContentPackDocument[]): BestiaryEntry[] {
  const entries: BestiaryEntry[] = [];
  const add = (creature: CreatureTemplate, origin: BestiaryOrigin) => {
    const rulesets = creature.rulesetCompatibility?.length ? creature.rulesetCompatibility : [RULESET_2014];
    rulesets.forEach((rulesetId) => entries.push({
      key: `${origin.kind === "pack" ? origin.packId : "local"}:${creature.id}:${rulesetId}`,
      creature,
      rulesetId,
      origin,
      edition: origin.kind === "local" ? "HB" : rulesetId === RULESET_2024 ? "24" : "14",
      challengeRating: challengeRating(creature),
      creatureType: creatureType(creature),
    }));
  };
  local.forEach((creature) => add(creature, { kind: "local" }));
  packs.forEach((pack) => pack.content.creatures.forEach((creature) => add(creature, { kind: "pack", packId: pack.pack.id, sourceVersion: pack.pack.sourceVersion })));
  return entries.sort((a, b) => a.creature.name.localeCompare(b.creature.name) || a.edition.localeCompare(b.edition));
}

export function creatureTemplateFromEntity(entity: EncounterEntity, rulesetId: RulesetId, existingId?: string): CreatureTemplate {
  return {
    id: existingId ?? uid("creature"),
    name: entity.name.replace(/\s+\d+$/, "").trim(),
    armorClass: entity.armorClass,
    hitPoints: { average: entity.maxHP, formula: entity.statBlock?.hitPoints?.match(/\(([^)]+)\)/)?.[1] },
    initiativeModifier: entity.initiativeModifier,
    statBlock: entity.statBlock ? structuredClone({ ...entity.statBlock, name: entity.name.replace(/\s+\d+$/, "").trim() }) : undefined,
    rulesetCompatibility: [rulesetId],
  };
}

export function instantiateBestiaryEntry(entry: BestiaryEntry, existing: EncounterEntity[], statBlockLinkId: string): EncounterEntity {
  const creature = entry.creature;
  const name = nextAvailableEntityName(creature.name, existing.map((entity) => entity.name));
  const sourceRef = entry.origin.kind === "pack"
    ? { packId: entry.origin.packId, entryId: creature.id, sourceVersion: entry.origin.sourceVersion, rulesetId: entry.rulesetId }
    : { packId: "local-bestiary", entryId: creature.id, sourceVersion: "1", rulesetId: entry.rulesetId };
  return createEntity({
    name,
    type: "Enemy",
    armorClass: creature.armorClass,
    maxHP: creature.hitPoints.average,
    currentHP: creature.hitPoints.average,
    initiativeModifier: creature.initiativeModifier,
    statBlock: creature.statBlock ? structuredClone(creature.statBlock) : undefined,
    statBlockLinkId,
    statBlockUnlinked: false,
    sourceRef,
    importedSnapshot: structuredClone(creature),
  });
}

export function bestiaryLinkId(entry: BestiaryEntry, entities: EncounterEntity[]): string {
  const matching = entities.find((entity) => entity.sourceRef?.entryId === entry.creature.id && entity.sourceRef.rulesetId === entry.rulesetId && entity.sourceRef.packId === (entry.origin.kind === "pack" ? entry.origin.packId : "local-bestiary"));
  return matching?.statBlockLinkId ?? uid("stat-block");
}

export function parseChallengeRating(value: string): number {
  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(Number);
    return denominator ? numerator / denominator : Number.NaN;
  }
  return Number(value);
}
