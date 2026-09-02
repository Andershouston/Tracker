import { describe, expect, it } from "vitest";
import { createEntity } from "./factories";
import { configureEntityHP, damageEntity, healEntity, recordDeathSave } from "./hit-points";

describe("hit point rules", () => {
  it("uses temporary hit points before current hit points", () => {
    const entity = createEntity({ currentHP: 10, maxHP: 10, tempHP: 5 });
    const result = damageEntity(entity, 7).entity;
    expect(result.tempHP).toBe(0);
    expect(result.currentHP).toBe(8);
  });

  it("enters dying at zero hit points", () => {
    const result = damageEntity(createEntity({ currentHP: 6, maxHP: 10 }), 6).entity;
    expect(result.currentHP).toBe(0);
    expect(result.lethalOverflow).toBe(0);
    expect(result.isDying).toBe(true);
    expect(result.isDead).toBe(false);
  });

  it("accumulates lethal overflow across hits", () => {
    const first = damageEntity(createEntity({ currentHP: 10, maxHP: 10 }), 15).entity;
    expect(first.currentHP).toBe(0);
    expect(first.lethalOverflow).toBe(5);
    expect(first.isDying).toBe(true);

    const second = damageEntity(first, 5).entity;
    expect(second.lethalOverflow).toBe(10);
    expect(second.isDead).toBe(true);
    expect(second.isDying).toBe(false);
  });

  it("adds one death-save failure when an already-dying entity takes damage", () => {
    const dying = damageEntity(createEntity({ currentHP: 10, maxHP: 10 }), 15).entity;
    const result = damageEntity(dying, 2).entity;
    expect(result.deathSaveFailures).toBe(1);
    expect(result.lethalOverflow).toBe(7);
  });

  it("dies when damage produces a third death-save failure", () => {
    const dying = createEntity({ currentHP: 0, maxHP: 20, isDying: true, deathSaveFailures: 2 });
    const result = damageEntity(dying, 1).entity;
    expect(result.deathSaveFailures).toBe(3);
    expect(result.isDead).toBe(true);
    expect(result.isDying).toBe(false);
  });

  it("heals a dying entity from displayed zero and clears overflow", () => {
    const entity = damageEntity(createEntity({ currentHP: 10, maxHP: 10 }), 15).entity;
    const result = healEntity(entity, 4).entity;
    expect(result.currentHP).toBe(4);
    expect(result.lethalOverflow).toBe(0);
    expect(result.isDying).toBe(false);
    expect(result.deathSaveSuccesses).toBe(3);
  });

  it("does not overheal current HP but permits temp HP beyond maximum", () => {
    const healed = healEntity(createEntity({ currentHP: 8, maxHP: 10 }), 20).entity;
    expect(healed.currentHP).toBe(10);
    expect(configureEntityHP(createEntity({ maxHP: 10, tempHP: 25 }), undefined, 10).tempHP).toBe(25);
  });

  it("clamps current when maximum is lowered", () => {
    const result = configureEntityHP(createEntity({ currentHP: 16, maxHP: 40 }), undefined, 14);
    expect(result.currentHP).toBe(14);
    expect(result.maxHP).toBe(14);
  });

  it("treats maximum HP zero as dead without saves", () => {
    const result = configureEntityHP(createEntity({ currentHP: 10, maxHP: 10 }), undefined, 0);
    expect(result.currentHP).toBe(0);
    expect(result.maxHP).toBe(0);
    expect(result.isDead).toBe(true);
    expect(result.isDying).toBe(false);
  });

  it("maps a negative configured current value to overflow and instant death", () => {
    const dying = configureEntityHP(createEntity({ currentHP: 10, maxHP: 10 }), -5);
    expect(dying.currentHP).toBe(0);
    expect(dying.lethalOverflow).toBe(5);
    expect(dying.isDying).toBe(true);

    const dead = configureEntityHP(createEntity({ currentHP: 10, maxHP: 10 }), -10);
    expect(dead.isDead).toBe(true);
  });

  it("rejects direct current values above maximum and negative maximums", () => {
    expect(() => configureEntityHP(createEntity({ maxHP: 10 }), 11)).toThrow("Current HP");
    expect(() => configureEntityHP(createEntity({ maxHP: 10 }), undefined, -1)).toThrow("Maximum HP");
  });

  it("stabilizes after three death save successes", () => {
    const entity = createEntity({ currentHP: 0, isDying: true, deathSaveSuccesses: 2 });
    const result = recordDeathSave(entity, "success").entity;
    expect(result.isDying).toBe(false);
    expect(result.isUnconscious).toBe(true);
  });

  it("records the next death save rather than toggling an individual pip", () => {
    const entity = createEntity({ currentHP: 0, isDying: true, deathSaveFailures: 1 });
    const result = recordDeathSave(entity, "failure").entity;
    expect(result.deathSaveFailures).toBe(2);
  });
});
