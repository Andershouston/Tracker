import type { BestiaryEntry } from "./bestiary";
import { bestiaryLinkId, instantiateBestiaryEntry } from "./bestiary";
import { instantiateRosterMember } from "./factories";
import { configureEntityHP } from "./hit-points";
import { canonicalEntityName } from "./stat-block-links";
import type { Encounter, EncounterEntity, RosterMember } from "./types";

export type EntityNameSuggestion =
  | { id: string; name: string; source: "roster"; detail: string; member: RosterMember }
  | { id: string; name: string; source: "bestiary"; detail: string; entry: BestiaryEntry }
  | { id: string; name: string; source: "encounter"; detail: string; sourceEntity: EncounterEntity };

export function collectEntityNameSuggestions(encounter: Encounter, roster: RosterMember[], bestiary: BestiaryEntry[]): EntityNameSuggestion[] {
  const rosterIds = new Set(encounter.entities.map((entity) => entity.rosterId).filter(Boolean));
  const suggestions: EntityNameSuggestion[] = roster
    .filter((member) => !member.archived && !rosterIds.has(member.rosterId))
    .map((member) => ({ id: `roster:${member.rosterId}`, name: member.name, source: "roster", detail: `Roster · AC ${member.armorClass} · HP ${member.maxHP}`, member }));

  bestiary
    .filter((entry) => entry.rulesetId === encounter.rulesetId)
    .forEach((entry) => suggestions.push({
      id: `bestiary:${entry.key}`,
      name: entry.creature.name,
      source: "bestiary",
      detail: `${entry.edition} · CR ${entry.challengeRating}`,
      entry,
    }));

  const encounteredNames = new Set<string>();
  encounter.entities.forEach((entity) => {
    if (entity.type !== "Enemy" || !entity.statBlock) return;
    const name = canonicalEntityName(entity.name);
    const key = name.toLocaleLowerCase();
    if (encounteredNames.has(key)) return;
    encounteredNames.add(key);
    suggestions.push({ id: `encounter:${entity.id}`, name, source: "encounter", detail: `Encounter · AC ${entity.armorClass} · HP ${entity.maxHP}`, sourceEntity: entity });
  });

  return suggestions;
}

export function matchingEntityNameSuggestions(query: string, suggestions: EntityNameSuggestion[], limit = 8): EntityNameSuggestion[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery.length < 2) return [];
  const sourceOrder = { roster: 0, bestiary: 1, encounter: 2 } as const;
  return suggestions
    .filter((suggestion) => suggestion.name.toLocaleLowerCase().includes(normalizedQuery))
    .sort((left, right) => {
      const leftName = left.name.toLocaleLowerCase();
      const rightName = right.name.toLocaleLowerCase();
      const exactDifference = Number(rightName === normalizedQuery) - Number(leftName === normalizedQuery);
      const prefixDifference = Number(!leftName.startsWith(normalizedQuery)) - Number(!rightName.startsWith(normalizedQuery));
      return exactDifference || prefixDifference || leftName.localeCompare(rightName) || sourceOrder[left.source] - sourceOrder[right.source];
    })
    .slice(0, limit);
}

export function instantiateEntityNameSuggestion(suggestion: EntityNameSuggestion, draft: EncounterEntity, existingEntities: EncounterEntity[]): { entity: EncounterEntity; statBlockSourceId?: string } {
  if (suggestion.source === "roster") {
    return { entity: { ...instantiateRosterMember(suggestion.member), id: draft.id } };
  }
  if (suggestion.source === "bestiary") {
    const entity = instantiateBestiaryEntry(suggestion.entry, existingEntities, bestiaryLinkId(suggestion.entry, existingEntities));
    return { entity: { ...entity, id: draft.id } };
  }

  const source = suggestion.sourceEntity;
  const entity = configureEntityHP({
    ...draft,
    name: canonicalEntityName(source.name),
    type: "Enemy",
    initiativeModifier: source.initiativeModifier,
    armorClass: source.armorClass,
    statBlock: source.statBlock ? structuredClone(source.statBlock) : undefined,
    statBlockLinkId: source.statBlockLinkId,
    statBlockUnlinked: false,
    sourceRef: source.sourceRef ? structuredClone(source.sourceRef) : undefined,
    importedSnapshot: source.importedSnapshot ? structuredClone(source.importedSnapshot) : undefined,
    rosterId: null,
    isPersistent: false,
  }, source.maxHP, source.maxHP);
  return { entity, statBlockSourceId: source.id };
}
