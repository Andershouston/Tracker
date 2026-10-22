import { describe, expect, it } from "vitest";
import { collectBestiaryEntries, instantiateBestiaryEntry } from "./bestiary";
import type { CreatureTemplate } from "./types";

const goblin: CreatureTemplate = { id: "goblin", name: "Goblin", armorClass: 15, hitPoints: { average: 7 }, initiativeModifier: 2, rulesetCompatibility: ["dnd5e-2014-srd-5.1"], statBlock: { name: "Goblin", identity: "Small Humanoid", details: [{ label: "Challenge", value: "1/4 (50 XP)" }], sections: [] } };

describe("bestiary", () => {
  it("builds compact metadata for local entries", () => {
    const [entry] = collectBestiaryEntries([goblin], []);
    expect(entry.edition).toBe("HB");
    expect(entry.challengeRating).toBe("1/4");
    expect(entry.creatureType).toBe("Humanoid");
  });

  it("numbers repeated additions and preserves a shared stat block link", () => {
    const [entry] = collectBestiaryEntries([goblin], []);
    const first = instantiateBestiaryEntry(entry, [], "shared");
    const second = instantiateBestiaryEntry(entry, [first], "shared");
    expect(first.name).toBe("Goblin");
    expect(second.name).toBe("Goblin 2");
    expect(second.statBlockLinkId).toBe(first.statBlockLinkId);
  });
});
