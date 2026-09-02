import { describe, expect, it } from "vitest";
import { createEntity, createRosterMemberFromEntity, instantiateRosterMember, uid } from "./factories";

describe("uid", () => {
  it("creates prefixed, compact UUID-shaped identifiers", () => {
    expect(uid("entity")).toMatch(/^entity_[a-f0-9]{32}$/);
  });

  it("does not reuse identifiers", () => {
    expect(uid()).not.toBe(uid());
  });
});

describe("roster templates", () => {
  it("creates a clean reusable template from encounter state", () => {
    const member = createRosterMemberFromEntity(createEntity({ currentHP: 3, maxHP: 20, tempHP: 5, isDying: true, lethalOverflow: 7 }));
    expect(member.currentHP).toBe(20);
    expect(member.tempHP).toBe(0);
    expect(member.lethalOverflow).toBe(0);
    expect(member.isDying).toBe(false);
  });

  it("creates independent full-health encounter instances", () => {
    const member = createRosterMemberFromEntity(createEntity({ name: "Thorin", maxHP: 45 }));
    const first = instantiateRosterMember(member);
    const second = instantiateRosterMember(member);
    first.currentHP = 12;
    expect(second.currentHP).toBe(45);
    expect(member.currentHP).toBe(45);
    expect(first.id).not.toBe(second.id);
  });
});
