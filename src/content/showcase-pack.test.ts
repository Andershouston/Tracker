import { describe, expect, it } from "vitest";
import { validateContentPack } from "./validation";
import { SHOWCASE_CONTENT_PACK } from "./showcase-pack";

describe("development showcase content pack", () => {
  it("remains valid against the public content-pack schema", () => {
    const result = validateContentPack(SHOWCASE_CONTENT_PACK);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(SHOWCASE_CONTENT_PACK.content.conditions.length).toBeGreaterThan(0);
    expect(SHOWCASE_CONTENT_PACK.content.creatures.length).toBeGreaterThan(0);
    expect(SHOWCASE_CONTENT_PACK.content.spells.length).toBeGreaterThan(0);
  });
});
