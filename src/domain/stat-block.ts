import type { AbilityKey, MonsterStatBlock, MonsterStatEntry, MonsterStatSection } from "./types";

const ABILITIES: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const SECTION_TITLES = new Map([
  ["traits", "Traits"], ["special traits", "Traits"], ["actions", "Actions"],
  ["bonus actions", "Bonus Actions"], ["reactions", "Reactions"],
  ["legendary actions", "Legendary Actions"], ["lair actions", "Lair Actions"],
  ["mythic actions", "Mythic Actions"],
]);
const DETAIL_LABELS = [
  "Saving Throws", "Skills", "Gear", "Damage Vulnerabilities", "Damage Resistances",
  "Damage Immunities", "Condition Immunities", "Senses", "Languages", "Challenge", "CR",
  "Proficiency Bonus", "PB", "Habitat", "Treasure", "Source",
];

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const signedModifier = (score: number) => {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : String(modifier);
};

function statEntry(line: string): MonsterStatEntry {
  const match = line.match(/^([^.!?]{1,80})\.\s+(.+)$/);
  return match ? { name: clean(match[1]), description: clean(match[2]) } : { name: "", description: clean(line) };
}

function validStructuredBlock(value: unknown): value is MonsterStatBlock {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MonsterStatBlock>;
  return typeof candidate.name === "string" && Array.isArray(candidate.details) && Array.isArray(candidate.sections);
}

function fromStructuredJson(value: unknown): MonsterStatBlock | null {
  const candidate = value && typeof value === "object" && "statBlock" in value
    ? (value as { statBlock?: unknown }).statBlock
    : value;
  if (!validStructuredBlock(candidate)) return null;
  return {
    ...candidate,
    name: clean(candidate.name),
    identity: candidate.identity ? clean(candidate.identity) : undefined,
    details: candidate.details
      .filter((detail) => detail && typeof detail.label === "string" && typeof detail.value === "string")
      .map((detail) => ({ label: clean(detail.label), value: clean(detail.value) })),
    sections: candidate.sections
      .filter((section) => section && typeof section.title === "string" && Array.isArray(section.entries))
      .map((section) => ({
        title: clean(section.title),
        entries: section.entries
          .filter((entry) => entry && typeof entry.name === "string" && typeof entry.description === "string")
          .map((entry) => ({ name: clean(entry.name), description: clean(entry.description) })),
      })),
  };
}

export function parseMonsterStatBlock(source: string): MonsterStatBlock {
  const trimmed = source.trim();
  if (!trimmed) throw new Error("Paste a stat block or structured JSON first.");

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let parsed: unknown;
    try { parsed = JSON.parse(trimmed); }
    catch { throw new Error("The JSON could not be read. Check its punctuation and try again."); }
    const block = fromStructuredJson(parsed);
    if (!block) throw new Error("JSON must include a name, details array, and sections array.");
    return block;
  }

  const lines = source.split(/\r?\n/).map(clean).filter(Boolean);
  if (!lines.length) throw new Error("Paste a stat block first.");
  const block: MonsterStatBlock = { name: lines[0], details: [], sections: [] };
  let activeSection: MonsterStatSection | null = null;
  let recognized = 0;

  for (const line of lines.slice(1)) {
    const sectionTitle = SECTION_TITLES.get(line.toLocaleLowerCase().replace(/:$/, ""));
    if (sectionTitle) {
      activeSection = { title: sectionTitle, entries: [] };
      block.sections.push(activeSection);
      recognized += 1;
      continue;
    }
    const detailLabel = DETAIL_LABELS.find((label) => {
      const lowerLine = line.toLocaleLowerCase();
      const lowerLabel = label.toLocaleLowerCase();
      return lowerLine === lowerLabel || lowerLine.startsWith(`${lowerLabel} `) || lowerLine.startsWith(`${lowerLabel}:`);
    });
    if (detailLabel) {
      block.details.push({ label: detailLabel, value: clean(line.slice(detailLabel.length).replace(/^\s*:?[ ]*/, "")) });
      activeSection = null;
      recognized += 1;
      continue;
    }
    if (activeSection) {
      const entry = statEntry(line);
      const previous = activeSection.entries.at(-1);
      if (!entry.name && previous) previous.description = clean(`${previous.description} ${entry.description}`);
      else activeSection.entries.push(entry);
      continue;
    }

    const ac = line.match(/^(?:Armor Class|AC)\s*:?[ ]*(.+?)(?=\s+Initiative\b|$)/i);
    if (ac) { block.armorClass = clean(ac[1]); recognized += 1; }
    const initiative = line.match(/\bInitiative\s*:?[ ]*(.+)$/i);
    if (initiative) { block.initiative = clean(initiative[1]); recognized += 1; }
    const hp = line.match(/^(?:Hit Points|HP)\s*:?[ ]*(.+)$/i);
    if (hp) { block.hitPoints = clean(hp[1]); recognized += 1; continue; }
    const speed = line.match(/^Speed\s*:?[ ]*(.+)$/i);
    if (speed) { block.speed = clean(speed[1]); recognized += 1; continue; }

    const abilityMatches = Array.from(line.matchAll(/\b(STR|DEX|CON|INT|WIS|CHA)\s+(\d{1,2})(?:\s+([+−-]\d+))?(?:\s+([+−-]\d+))?/gi));
    if (abilityMatches.length) {
      block.abilities ??= {};
      abilityMatches.forEach((match) => {
        const key = match[1].toLocaleLowerCase() as AbilityKey;
        const score = Number(match[2]);
        block.abilities![key] = { score, modifier: match[3]?.replace("−", "-") ?? signedModifier(score), save: match[4]?.replace("−", "-") };
      });
      recognized += abilityMatches.length;
      continue;
    }

    if (!block.identity && !ac) block.identity = line;
  }

  if (!recognized) throw new Error("No recognizable stat-block fields were found. Include labels such as AC, HP, Speed, Actions, or Skills.");
  return block;
}

export function statBlockAsJson(block: MonsterStatBlock): string {
  const orderedAbilities = block.abilities
    ? Object.fromEntries(ABILITIES.filter((key) => block.abilities?.[key]).map((key) => [key, block.abilities![key]]))
    : undefined;
  return JSON.stringify({ ...block, abilities: orderedAbilities }, null, 2);
}
