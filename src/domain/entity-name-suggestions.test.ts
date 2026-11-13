import { describe, expect, it } from "vitest";
import { collectBestiaryEntries } from "./bestiary";
import { collectEntityNameSuggestions, instantiateEntityNameSuggestion, matchingEntityNameSuggestions } from "./entity-name-suggestions";
import { createEncounter, createEntity, createRosterMemberFromEntity } from "./factories";
import type { CreatureTemplate } from "./types";

const goblin: CreatureTemplate = { id: "goblin", name: "Goblin", armorClass: 15, hitPoints: { average: 7 }, initiativeModifier: 2, rulesetCompatibility: ["dnd5e-2014-srd-5.1"], statBlock: { name: "Goblin", details: [{ label: "Challenge", value: "1/4" }], sections: [] } };

describe("entity name suggestions", () => {
  it("offers available roster members and ruleset-matching bestiary entries", () => {
    const encounter = createEncounter("Test", "dnd5e-2014-srd-5.1");
    const lyra = createRosterMemberFromEntity(createEntity({ name: "Lyra" }));
    const thorin = createRosterMemberFromEntity(createEntity({ name: "Thorin" }));
    encounter.entities = [{ ...createEntity({ name: "Lyra" }), rosterId: lyra.rosterId }];
    const suggestions = collectEntityNameSuggestions(encounter, [lyra, thorin], collectBestiaryEntries([goblin], []));
    expect(suggestions.map((suggestion) => suggestion.name)).toEqual(["Thorin", "Goblin"]);
  });

  it("ranks exact and prefix matches while accepting partial names", () => {
    const encounter = createEncounter("Test", "dnd5e-2014-srd-5.1");
    const suggestions = collectEntityNameSuggestions(encounter, [
      createRosterMemberFromEntity(createEntity({ name: "Hobgoblin" })),
      createRosterMemberFromEntity(createEntity({ name: "Goblin" })),
    ], []);
    expect(matchingEntityNameSuggestions("goblin", suggestions).map((suggestion) => suggestion.name)).toEqual(["Goblin", "Hobgoblin"]);
    expect(matchingEntityNameSuggestions("g", suggestions)).toEqual([]);
  });

  it("materializes a bestiary suggestion into the draft entity", () => {
    const encounter = createEncounter("Test", "dnd5e-2014-srd-5.1");
    const [suggestion] = collectEntityNameSuggestions(encounter, [], collectBestiaryEntries([goblin], []));
    const draft = createEntity({ name: "go" });
    const result = instantiateEntityNameSuggestion(suggestion, draft, encounter.entities).entity;
    expect(result.id).toBe(draft.id);
    expect(result.name).toBe("Goblin");
    expect(result.armorClass).toBe(15);
    expect(result.maxHP).toBe(7);
    expect(result.sourceRef?.packId).toBe("local-bestiary");
  });
});
