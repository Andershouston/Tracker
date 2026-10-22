import { describe, expect, it } from "vitest";
import { nextDuplicateEntityName } from "./entity-names";

describe("duplicate entity names", () => {
  it("adds a numeric suffix to an unnumbered name", () => {
    expect(nextDuplicateEntityName("Goblin", ["Goblin"])).toBe("Goblin 2");
  });

  it("increments an existing trailing number", () => {
    expect(nextDuplicateEntityName("Goblin 1", ["Goblin 1"])).toBe("Goblin 2");
  });

  it("skips existing names without regard to case", () => {
    expect(nextDuplicateEntityName("Goblin 1", ["Goblin 1", "goblin 2", "Goblin 3"])).toBe("Goblin 4");
  });
});
