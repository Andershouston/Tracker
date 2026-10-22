import { describe, expect, it } from "vitest";
import { filterQuickReferenceSections, type QuickReferenceKey } from "./quick-reference";

describe("quick reference filtering", () => {
  it("shows every section when no filter chip is selected", () => {
    const result = filterQuickReferenceSections(new Set<QuickReferenceKey>(), "");
    expect(result.map(({ key }) => key)).toEqual(["movement", "actions", "reactions", "bonus"]);
  });

  it("supports multiple selected rule types", () => {
    const result = filterQuickReferenceSections(new Set<QuickReferenceKey>(["movement", "reactions"]), "");
    expect(result.map(({ key }) => key)).toEqual(["movement", "reactions"]);
  });

  it("searches only within the selected rule types", () => {
    const actionsOnly = filterQuickReferenceSections(new Set<QuickReferenceKey>(["actions"]), "cast a spell");
    expect(actionsOnly).toHaveLength(1);
    expect(actionsOnly[0].key).toBe("actions");
    expect(actionsOnly[0].entries.map((entry) => entry.id)).toEqual(["cast-action"]);

    const movementOnly = filterQuickReferenceSections(new Set<QuickReferenceKey>(["movement"]), "cast a spell");
    expect(movementOnly).toEqual([]);
  });
});
