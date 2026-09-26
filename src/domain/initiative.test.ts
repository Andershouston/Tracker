import { describe, expect, it } from "vitest";
import { createEncounter, createEntity } from "./factories";
import { rollAll, setInitiative } from "./initiative";

describe("manual initiative", () => {
  it("stores a manually entered initiative", () => {
    const entity = setInitiative(createEntity(), 17);

    expect(entity.initiative).toBe(17);
    expect(entity.hasRolledInitiative).toBe(true);
  });

  it("returns an entity to the unfilled initiative state when cleared", () => {
    const entity = setInitiative(createEntity({ initiative: 17, hasRolledInitiative: true }), null);

    expect(entity.initiative).toBeNull();
    expect(entity.hasRolledInitiative).toBe(false);
  });
});

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
