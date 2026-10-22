import { describe, expect, it } from "vitest";
import { createEntity } from "./factories";
import { canonicalEntityName, linkedStatBlockEntities, matchingCreatureSuggestions, matchingEnemyEntities, nextAvailableEntityName } from "./stat-block-links";

describe("stat block links", () => {
  it("treats trailing numeric indicators as the same creature name", () => {
    expect(canonicalEntityName("Goblin 3")).toBe("Goblin");
    expect(canonicalEntityName("Goblin (4)")).toBe("Goblin");
    expect(canonicalEntityName("Goblin #5")).toBe("Goblin");
  });

  it("only groups matching enemy names", () => {
    const goblin = createEntity({ name: "Goblin", type: "Enemy" });
    const entities = [goblin, createEntity({ name: "Goblin 2", type: "Enemy" }), createEntity({ name: "Goblin 3", type: "Ally" }), createEntity({ name: "Goblin Chief", type: "Enemy" })];
    expect(matchingEnemyEntities(goblin, entities).map((entity) => entity.name)).toEqual(["Goblin", "Goblin 2"]);
  });

  it("finds entities sharing an explicit link", () => {
    const first = createEntity({ name: "Goblin", statBlockLinkId: "goblins" });
    const second = createEntity({ name: "Goblin 2", statBlockLinkId: "goblins" });
    const third = createEntity({ name: "Goblin 3" });
    expect(linkedStatBlockEntities(first, [first, second, third])).toEqual([first, second]);
  });

  it("numbers a repeated typed name", () => {
    expect(nextAvailableEntityName("goblin", ["Goblin", "Goblin 2"])).toBe("goblin 3");
  });

  it("suggests unique matching creatures after two characters", () => {
    const block = { name: "Goblin", details: [], sections: [] };
    const entities = [
      createEntity({ name: "Hobgoblin", statBlock: block }),
      createEntity({ name: "Goblin", statBlock: block }),
      createEntity({ name: "Goblin 2", statBlock: block, statBlockLinkId: "goblins" }),
      createEntity({ name: "Goblin Ally", type: "Ally", statBlock: block }),
    ];
    expect(matchingCreatureSuggestions("go", entities).map((entity) => entity.name)).toEqual(["Goblin 2", "Hobgoblin"]);
    expect(matchingCreatureSuggestions("g", entities)).toEqual([]);
  });
});
