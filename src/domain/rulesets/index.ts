import type { Ruleset, } from "./types";
import type { RulesetId } from "../types";
import { BUILTIN_EFFECTS } from "../../content/builtin";

export const RULESETS: Record<RulesetId, Ruleset> = {
  "dnd5e-2014-srd-5.1": {
    id: "dnd5e-2014-srd-5.1",
    name: "D&D 2014 · SRD 5.1",
    shortName: "2014",
    conditions: BUILTIN_EFFECTS,
  },
  "dnd5e-2024-srd-5.2.1": {
    id: "dnd5e-2024-srd-5.2.1",
    name: "D&D 2024 · SRD 5.2.1",
    shortName: "2024",
    conditions: BUILTIN_EFFECTS,
  },
};

export const rulesetFor = (id: RulesetId) => RULESETS[id];
