import type { EncounterEntity } from "./types";

const NUMBERED_INDICATOR = /(?:\s+(?:#?\d+|\(\d+\)))$/;

export function canonicalEntityName(name: string): string {
  return name.trim().replace(NUMBERED_INDICATOR, "").trim() || "Entity";
}

export function matchingEnemyEntities(entity: EncounterEntity, entities: EncounterEntity[]): EncounterEntity[] {
  if (entity.type !== "Enemy") return [];
  const canonical = canonicalEntityName(entity.name).toLocaleLowerCase();
  return entities.filter((candidate) => candidate.type === "Enemy" && canonicalEntityName(candidate.name).toLocaleLowerCase() === canonical);
}

export function linkedStatBlockEntities(entity: EncounterEntity, entities: EncounterEntity[]): EncounterEntity[] {
  if (!entity.statBlockLinkId) return [entity];
  return entities.filter((candidate) => candidate.statBlockLinkId === entity.statBlockLinkId);
}

export function nextAvailableEntityName(name: string, existingNames: Iterable<string>): string {
  const trimmed = name.trim() || "Entity";
  const normalizedNames = new Set(Array.from(existingNames, (existingName) => existingName.trim().toLocaleLowerCase()));
  if (!normalizedNames.has(trimmed.toLocaleLowerCase())) return trimmed;
  const baseName = canonicalEntityName(trimmed);
  let suffix = 2;
  while (normalizedNames.has(`${baseName} ${suffix}`.toLocaleLowerCase())) suffix += 1;
  return `${baseName} ${suffix}`;
}

export function suggestedIndependentName(entity: EncounterEntity, entities: EncounterEntity[]): string {
  return nextAvailableEntityName(`${canonicalEntityName(entity.name)} Variant`, entities.filter((candidate) => candidate.id !== entity.id).map((candidate) => candidate.name));
}

export function matchingCreatureSuggestions(query: string, entities: EncounterEntity[], limit = 5): EncounterEntity[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery.length < 2) return [];
  const matches = entities.filter((entity) => entity.type === "Enemy" && entity.statBlock && canonicalEntityName(entity.name).toLocaleLowerCase().includes(normalizedQuery));
  const deduplicated = new Map<string, EncounterEntity>();
  for (const entity of matches) {
    const key = canonicalEntityName(entity.name).toLocaleLowerCase();
    const existing = deduplicated.get(key);
    if (!existing || (!existing.statBlockLinkId && entity.statBlockLinkId)) deduplicated.set(key, entity);
  }
  return [...deduplicated.values()]
    .sort((left, right) => {
      const leftName = canonicalEntityName(left.name).toLocaleLowerCase();
      const rightName = canonicalEntityName(right.name).toLocaleLowerCase();
      const prefixDifference = Number(!leftName.startsWith(normalizedQuery)) - Number(!rightName.startsWith(normalizedQuery));
      return prefixDifference || leftName.localeCompare(rightName);
    })
    .slice(0, limit);
}
