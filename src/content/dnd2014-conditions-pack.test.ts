import { describe, expect, it } from "vitest";
import { validateContentPack } from "./validation";
import { DND_2014_CONDITIONS_PACK } from "./dnd2014-conditions-pack";

describe("D&D 2014 SRD conditions pack", () => {
  it("is a valid, attributed 2014-only content pack", () => {
    expect(validateContentPack(DND_2014_CONDITIONS_PACK).valid).toBe(true);
    expect(DND_2014_CONDITIONS_PACK.pack.rulesetCompatibility).toEqual(["dnd5e-2014-srd-5.1"]);
    expect(DND_2014_CONDITIONS_PACK.pack.requiredAttribution).toHaveLength(1);
  });

  it("contains all fifteen Appendix A conditions with supported categories", () => {
    const conditions = DND_2014_CONDITIONS_PACK.content.conditions;
    expect(conditions).toHaveLength(15);
    expect(conditions.map((condition) => condition.name).sort()).toEqual([
      "Blinded", "Charmed", "Deafened", "Exhaustion", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious",
    ].sort());
    expect(new Set(conditions.map((condition) => condition.category))).toEqual(new Set(["beneficial", "debuff", "detrimental"]));
  });
});
