import type { EffectDefinition, RulesetId } from "../types";

export interface Ruleset {
  id: RulesetId;
  name: string;
  shortName: string;
  conditions: EffectDefinition[];
}
