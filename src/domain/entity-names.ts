import { canonicalEntityName, nextAvailableEntityName } from "./stat-block-links";

/** Returns the next available numbered name for a duplicated encounter entity. */
export function nextDuplicateEntityName(name: string, existingNames: Iterable<string>): string {
  const baseName = canonicalEntityName(name);
  return nextAvailableEntityName(baseName, [baseName, ...existingNames]);
}
