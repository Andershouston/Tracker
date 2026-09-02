import { describe, expect, it } from "vitest";
import { createEncounter, createEntity } from "./factories";
import { activateEffect } from "./effects";
import { beginCombat, delayTurn, nextTurn, previousTurn, removeEntity } from "./turn-flow";
import type { EffectDefinition } from "./types";

const TIMED_EFFECT: EffectDefinition = {
  id: "burning",
  name: "Burning",
  description: "Test effect",
  category: "detrimental",
  duration: { default: 1, tickAt: "turn-start" },
};

describe("turn flow", () => {
  const encounter = () => {
    const value = createEncounter("Test");
    value.entities = [createEntity({ name: "One" }), createEntity({ name: "Two" }), createEntity({ name: "Three" })];
    return value;
  };

  it("begins at the first entity", () => {
    const value = encounter();
    const result = beginCombat(value);
    expect(result.mode).toBe("active");
    expect(result.activeEntityId).toBe(value.entities[0].id);
  });

  it("advances and increments the round when wrapping", () => {
    let result = beginCombat(encounter());
    result = nextTurn(result);
    result = nextTurn(result);
    result = nextTurn(result);
    expect(result.round).toBe(2);
    expect(result.activeEntityId).toBe(result.entities[0].id);
  });

  it("moves a delayed entity to the bottom", () => {
    const result = delayTurn(beginCombat(encounter()));
    expect(result.entities.at(-1)?.name).toBe("One");
    expect(result.activeEntityId).toBe(result.entities[0].id);
  });

  it("can move backward without leaving round one", () => {
    const result = previousTurn(beginCombat(encounter()));
    expect(result.round).toBe(1);
    expect(result.activeEntityId).toBe(result.entities[0].id);
  });

  it("continues with the next logical entity when the active one is removed", () => {
    let value = beginCombat(encounter());
    value = nextTurn(value);
    const removedId = value.activeEntityId;
    const expectedId = value.entities[2].id;
    const result = removeEntity(value, removedId!);
    expect(result.activeEntityId).toBe(expectedId);
  });

  it("expires an effect at the start of the source entity's next turn", () => {
    let value = beginCombat(encounter());
    const source = value.entities[0];
    const target = value.entities[1];
    value = {
      ...value,
      entities: value.entities.map((entity) => entity.id === target.id
        ? { ...entity, effects: [activateEffect(TIMED_EFFECT, 1, { entityId: source.id, currentRound: value.round })] }
        : entity),
    };

    value = nextTurn(value);
    value = nextTurn(value);
    expect(value.entities.find((entity) => entity.id === target.id)?.effects).toHaveLength(1);

    value = nextTurn(value);
    expect(value.activeEntityId).toBe(source.id);
    expect(value.entities.find((entity) => entity.id === target.id)?.effects).toHaveLength(0);
  });

  it("counts multi-round effects by source turns", () => {
    let value = beginCombat(encounter());
    const source = value.entities[0];
    const target = value.entities[1];
    value = {
      ...value,
      entities: value.entities.map((entity) => entity.id === target.id
        ? { ...entity, effects: [activateEffect(TIMED_EFFECT, 2, { entityId: source.id, currentRound: value.round })] }
        : entity),
    };

    value = nextTurn(nextTurn(nextTurn(value)));
    expect(value.entities.find((entity) => entity.id === target.id)?.effects[0]?.duration).toBe(1);

    value = nextTurn(nextTurn(nextTurn(value)));
    expect(value.entities.find((entity) => entity.id === target.id)?.effects).toHaveLength(0);
  });
});
