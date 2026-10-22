import { describe, expect, it } from "vitest";
import { createEncounter, createEntity, createRosterMemberFromEntity } from "./factories";
import { syncLinkedMaximumHP, syncLinkedRosterEntity } from "./roster";
import type { AppSnapshot } from "./types";

function snapshotWithLinkedEntity(currentHP: number, maxHP: number) {
  const member = createRosterMemberFromEntity(createEntity({ name: "Lyra", currentHP: maxHP, maxHP }));
  const encounter = createEncounter("Level up");
  encounter.entities = [
    createEntity({ name: "Lyra", rosterId: member.rosterId, isPersistent: true, currentHP, maxHP }),
    createEntity({ name: "Goblin", currentHP: 7, maxHP: 7 }),
  ];
  const otherEncounter = createEncounter("Later adventure");
  otherEncounter.entities = [createEntity({ name: "Lyra", rosterId: member.rosterId, isPersistent: true, currentHP: 4, maxHP })];

  const snapshot: AppSnapshot = {
    encounters: [encounter, otherEncounter],
    roster: [member],
    contentPacks: [],
    sessionNotes: [],
    settings: { activeEncounterId: encounter.id, activePanel: null, persistenceRequested: true },
  };
  return { snapshot, rosterId: member.rosterId };
}

describe("linked roster maximum HP", () => {
  it("updates the roster template and every linked encounter without healing active characters", () => {
    const { snapshot, rosterId } = snapshotWithLinkedEntity(12, 30);
    const result = syncLinkedMaximumHP(snapshot, rosterId, 40);

    expect(result.roster[0]).toMatchObject({ maxHP: 40, currentHP: 40 });
    expect(result.encounters[0].entities[0]).toMatchObject({ maxHP: 40, currentHP: 12 });
    expect(result.encounters[1].entities[0]).toMatchObject({ maxHP: 40, currentHP: 4 });
    expect(result.encounters[0].entities[1]).toMatchObject({ maxHP: 7, currentHP: 7 });
  });

  it("clamps encounter current HP when the linked maximum is lowered", () => {
    const { snapshot, rosterId } = snapshotWithLinkedEntity(24, 30);
    const result = syncLinkedMaximumHP(snapshot, rosterId, 18);

    expect(result.roster[0]).toMatchObject({ maxHP: 18, currentHP: 18 });
    expect(result.encounters[0].entities[0]).toMatchObject({ maxHP: 18, currentHP: 18 });
  });
});

describe("linked roster profile", () => {
  it("syncs reusable fields while preserving combat-only state", () => {
    const { snapshot, rosterId } = snapshotWithLinkedEntity(12, 30);
    const source = {
      ...snapshot.encounters[0].entities[0],
      name: "Lyra Moonwhisper",
      armorClass: 17,
      initiativeModifier: 4,
      maxHP: 40,
      statBlock: {
        name: "Lyra Moonwhisper",
        speed: "30 ft.",
        details: [{ label: "Skills", value: "Arcana +6" }],
        sections: [],
      },
      notes: [{ id: "note-1", timestamp: 10, text: "Levelled up." }],
      initiative: 19,
      effects: [{ id: "effect-1", definitionId: "blessed", name: "Blessed", description: "Blessed.", category: "beneficial" as const, duration: null, tickAt: "manual" as const }],
    };

    const result = syncLinkedRosterEntity(snapshot, source);

    expect(result.roster[0]).toMatchObject({
      rosterId,
      name: "Lyra Moonwhisper",
      armorClass: 17,
      initiativeModifier: 4,
      maxHP: 40,
      currentHP: 40,
      statBlock: { name: "Lyra Moonwhisper" },
      notes: [{ text: "Levelled up." }],
    });
    expect(result.encounters[0].entities[0]).toMatchObject({ name: "Lyra Moonwhisper", armorClass: 17, maxHP: 40, currentHP: 12 });
    expect(result.encounters[1].entities[0]).toMatchObject({ name: "Lyra Moonwhisper", armorClass: 17, maxHP: 40, currentHP: 4 });
    expect(result.encounters[0].entities[0].initiative).toBeNull();
    expect(result.encounters[0].entities[0].effects).toEqual([]);
  });
});
