import { describe, expect, it } from "vitest";
import { durationToRounds, parseRecentEffects } from "./EffectPicker";

describe("custom effect duration conversion", () => {
  it("stores rounds directly", () => expect(durationToRounds("3", "rounds")).toBe(3));
  it("converts minutes to ten rounds", () => expect(durationToRounds("2", "minutes")).toBe(20));
  it("converts hours to six hundred rounds", () => expect(durationToRounds("2", "hours")).toBe(1200));
  it("keeps an empty duration indefinite", () => expect(durationToRounds("", "rounds")).toBeNull());
});

describe("recent effect storage", () => {
  it("keeps a complete one-off effect definition", () => {
    const definition = { id: "custom-soulfire", name: "Soulfire", description: "Burns brightly.", category: "buff" as const, duration: { default: 50, tickAt: "turn-start" as const } };
    expect(parseRecentEffects(JSON.stringify([{ id: definition.id, definition }]))).toEqual([{ id: definition.id, definition }]);
  });

  it("continues to read legacy id-only recents", () => {
    expect(parseRecentEffects(JSON.stringify(["prone"]))).toEqual([{ id: "prone" }]);
  });
});
