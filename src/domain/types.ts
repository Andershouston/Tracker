export type RulesetId = "dnd5e-2014-srd-5.1" | "dnd5e-2024-srd-5.2.1";
export type EntityType = "PC" | "Ally" | "Enemy" | "Neutral";
export type EncounterMode = "staging" | "active";
export type EffectCategory = "neutral" | "beneficial" | "buff" | "debuff" | "detrimental";
export type EffectTick = "turn-start" | "turn-end" | "manual";

export interface Attribution {
  text: string;
  url?: string;
}

export interface ContentReference {
  packId: string;
  entryId: string;
  sourceVersion: string;
  rulesetId: RulesetId;
}

export interface AutomationAction {
  trigger: EffectTick;
  action: {
    type: "damage" | "heal" | "remove-effect" | "log";
    amount?: string;
    damageType?: string;
    message?: string;
  };
}

export interface EffectDefinition {
  id: string;
  name: string;
  description: string;
  category: EffectCategory;
  rulesetCompatibility?: RulesetId[];
  presentation?: { color?: string; icon?: string };
  duration?: { default: number | null; tickAt: EffectTick };
  automation?: AutomationAction[];
}

export interface ActiveEffect {
  id: string;
  definitionId: string;
  name: string;
  description: string;
  category: EffectCategory;
  duration: number | null;
  tickAt: EffectTick;
  sourceEntityId?: string;
  lastTickRound?: number;
  presentation?: EffectDefinition["presentation"];
  sourceRef?: ContentReference;
}

export interface EntityNote {
  id: string;
  timestamp: number;
  text: string;
}

export interface CreatureTemplate {
  id: string;
  name: string;
  armorClass: number;
  hitPoints: { average: number; formula?: string };
  initiativeModifier: number;
  rulesetCompatibility?: RulesetId[];
  sourceRef?: ContentReference;
}

export interface SpellTemplate {
  id: string;
  name: string;
  level: number;
  description: string;
  duration?: string;
  concentration?: boolean;
  rulesetCompatibility?: RulesetId[];
  sourceRef?: ContentReference;
}

export interface EncounterEntity {
  id: string;
  sourceRef?: ContentReference;
  importedSnapshot?: CreatureTemplate;
  name: string;
  type: EntityType;
  initiative: number | null;
  initiativeModifier: number;
  hasRolledInitiative: boolean;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  lethalOverflow: number;
  armorClass: number;
  effects: ActiveEffect[];
  notes: EntityNote[];
  isPersistent: boolean;
  isDead: boolean;
  isUnconscious: boolean;
  isDying: boolean;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  reactionUsed: boolean;
  isDelayed: boolean;
  conditionsTickedRound?: number | null;
  rosterId?: string | null;
}

export type CombatLogType = "system" | "damage" | "healing" | "death" | "condition" | "manual" | "intermission";

export interface CombatLogEntry {
  id: string;
  round: number;
  turn: number;
  type: CombatLogType;
  message: string;
  timestamp: number;
}

export interface Encounter {
  id: string;
  name: string;
  rulesetId: RulesetId;
  round: number;
  activeEntityId: string | null;
  mode: EncounterMode;
  entities: EncounterEntity[];
  log: CombatLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RosterMember extends EncounterEntity {
  rosterId: string;
  archived?: boolean;
}

export interface SessionNote {
  id: string;
  timestamp: number;
  text: string;
}

export type AppPanel =
  | "log"
  | "notes"
  | "roster"
  | "library"
  | "conditions"
  | "reference-movement"
  | "reference-actions"
  | "reference-bonus"
  | "reference-reactions";

export interface ContentPackDocument {
  schemaVersion: number;
  pack: {
    id: string;
    name: string;
    sourceVersion: string;
    rulesetCompatibility: RulesetId[];
    requiredAttribution: Attribution[];
  };
  content: {
    conditions: EffectDefinition[];
    creatures: CreatureTemplate[];
    spells: SpellTemplate[];
  };
}

export interface AppSettings {
  activeEncounterId: string | null;
  activePanel: AppPanel | null;
  persistenceRequested: boolean;
}

export interface AppSnapshot {
  encounters: Encounter[];
  roster: RosterMember[];
  contentPacks: ContentPackDocument[];
  sessionNotes: SessionNote[];
  settings: AppSettings;
}
