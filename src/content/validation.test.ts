import { describe, expect, it } from "vitest";
import { validateContentPack } from "./validation";

describe("content pack validation", () => {
  it("accepts a minimal version one pack", () => {
    const result = validateContentPack({
      schemaVersion: 1,
      pack: {
        id: "example-pack",
        name: "Example Pack",
        sourceVersion: "1.0.0",
        rulesetCompatibility: ["dnd5e-2014-srd-5.1"],
        requiredAttribution: [],
      },
      content: { conditions: [], creatures: [], spells: [] },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported schema versions", () => {
    const result = validateContentPack({ schemaVersion: 99, pack: {}, content: {} });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("schemaVersion must currently be 1.");
  });
});
