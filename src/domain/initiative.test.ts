import { describe, expect, it } from "vitest";
import { createEncounter, createEntity } from "./factories";
import { rollAll } from "./initiative";

describe("initiative batches", () => {
  it("rerolls every matching entity and leaves other types untouched", () => {
    const encounter = createEncounter("Test");
    encounter.entities = [
      createEntity({ type: "Enemy", initiative: -50, hasRolledInitiative: true }),
      createEntity({ type: "PC", initiative: 15, hasRolledInitiative: true }),
    ];
    const result = rollAll(encounter, "Enemy");
    expect(result.entities[0].initiative).not.toBe(-50);
    expect(result.entities[1].initiative).toBe(15);
  });
});
