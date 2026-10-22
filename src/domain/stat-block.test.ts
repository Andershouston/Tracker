import { describe, expect, it } from "vitest";
import { parseMonsterStatBlock, statBlockAsJson } from "./stat-block";

const GOBLIN = `Ash Raider
Small Fey, Neutral
AC 15 Initiative +2 (12)
HP 10 (3d6)
Speed 30 ft.
STR 8 -1 -1 DEX 15 +2 +2 CON 10 +0 +0 INT 10 +0 +0 WIS 8 -1 -1 CHA 8 -1 -1
Skills Stealth +6
Gear Leather Armor, Scimitar, Shield, Shortbow
Senses Darkvision 60 ft., Passive Perception 9
Languages Common, Goblin
CR 1/4 (XP 50; PB +2)
Actions
Ash Blade. Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Slashing damage.
Bonus Actions
Fade. The raider takes the Hide action.
Habitat Forest, Grassland, Hill`;

describe("monster stat-block import", () => {
  it("extracts a conventional pasted stat block", () => {
    const block = parseMonsterStatBlock(GOBLIN);
    expect(block).toMatchObject({ name: "Ash Raider", identity: "Small Fey, Neutral", armorClass: "15", initiative: "+2 (12)", hitPoints: "10 (3d6)", speed: "30 ft." });
    expect(block.abilities?.dex).toEqual({ score: 15, modifier: "+2", save: "+2" });
    expect(block.sections.map((section) => section.title)).toEqual(["Actions", "Bonus Actions"]);
    expect(block.sections[0].entries[0].name).toBe("Ash Blade");
    expect(block.details.at(-1)).toEqual({ label: "Habitat", value: "Forest, Grassland, Hill" });
  });

  it("round-trips the tracker structured JSON format", () => {
    const original = parseMonsterStatBlock(GOBLIN);
    expect(parseMonsterStatBlock(statBlockAsJson(original))).toEqual(original);
  });

  it("rejects text without recognizable stat-block fields", () => {
    expect(() => parseMonsterStatBlock("A mysterious goblin\nNothing else is known.")).toThrow(/recognizable/i);
  });
});
