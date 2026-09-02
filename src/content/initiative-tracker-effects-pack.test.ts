import { describe, expect, it } from "vitest";
import { validateContentPack } from "./validation";
import { INITIATIVE_TRACKER_EFFECTS_PACK } from "./initiative-tracker-effects-pack";
import { availableEffects } from "./normalize";

describe("Initiative Tracker effects pack", () => {
  it("is valid and contains the complete Figma collection", () => {
    const result = validateContentPack(INITIATIVE_TRACKER_EFFECTS_PACK);
    const ids = INITIATIVE_TRACKER_EFFECTS_PACK.content.conditions.map((effect) => effect.id);
    expect(result.valid).toBe(true);
    expect(ids).toHaveLength(60);
    expect(new Set(ids).size).toBe(60);
    expect(INITIATIVE_TRACKER_EFFECTS_PACK.pack.rulesetCompatibility).toEqual([
      "dnd5e-2014-srd-5.1",
      "dnd5e-2024-srd-5.2.1",
    ]);
    expect(INITIATIVE_TRACKER_EFFECTS_PACK.content.conditions.every((effect) => effect.presentation?.icon)).toBe(true);
  });

  it("is available to both supported encounter rulesets", () => {
    for (const ruleset of ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"] as const) {
      const effects = availableEffects([INITIATIVE_TRACKER_EFFECTS_PACK], ruleset);
      expect(effects.some((effect) => effect.id === "blessed")).toBe(true);
      expect(effects).toHaveLength(63);
    }
  });
});
