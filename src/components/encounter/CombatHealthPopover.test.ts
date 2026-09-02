import { describe, expect, it } from "vitest";
import { healthActionForKey } from "./CombatHealthPopover";

describe("combat health hotkeys", () => {
  it.each([
    ["Enter", "damage"],
    ["d", "damage"],
    ["D", "damage"],
    ["h", "heal"],
    ["H", "heal"],
    ["t", "temp"],
    ["T", "temp"],
  ])("maps %s to %s", (key, action) => expect(healthActionForKey(key)).toBe(action));

  it("leaves Set button-only", () => expect(healthActionForKey("s")).toBeNull());
});
