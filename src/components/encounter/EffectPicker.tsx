import { useMemo, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { effectIconPath } from "../../content/builtin";
import type { EffectCategory, EffectDefinition } from "../../domain/types";
import { Button } from "../shared/Button";
import { SelectField } from "../shared/SelectField";

const RECENT_EFFECTS_KEY = "dmtools:recent-effects";
const RECENT_LIMIT = 4;
const EFFECT_CATEGORIES: EffectCategory[] = ["neutral", "buff", "debuff", "beneficial", "detrimental"];
type DurationUnit = "rounds" | "minutes" | "hours";
type RecentEffect = { id: string; definition?: EffectDefinition };

const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: "rounds", label: "Rounds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
];

const ROUNDS_PER_UNIT: Record<DurationUnit, number> = {
  rounds: 1,
  minutes: 10,
  hours: 600,
};

export function durationToRounds(value: string, unit: DurationUnit): number | null {
  if (value === "") return null;
  return Math.max(1, Math.floor(Number(value) || 0)) * ROUNDS_PER_UNIT[unit];
}

function isEffectDefinition(value: unknown): value is EffectDefinition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EffectDefinition>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && typeof candidate.description === "string"
    && EFFECT_CATEGORIES.includes(candidate.category as EffectCategory);
}

export function parseRecentEffects(value: string): RecentEffect[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): RecentEffect[] => {
      if (typeof item === "string") return [{ id: item }];
      if (!item || typeof item !== "object" || typeof (item as RecentEffect).id !== "string") return [];
      const definition = isEffectDefinition((item as RecentEffect).definition) ? (item as RecentEffect).definition : undefined;
      return [{ id: (item as RecentEffect).id, definition }];
    }).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function readRecentEffects(): RecentEffect[] {
  return parseRecentEffects(window.localStorage.getItem(RECENT_EFFECTS_KEY) ?? "[]");
}

function durationLabel(effect: EffectDefinition) {
  const duration = effect.duration?.default ?? null;
  return duration === null ? "∞" : `${duration}r`;
}

interface EffectPickerProps {
  entityName: string;
  effects: EffectDefinition[];
  activeDefinitionIds: ReadonlySet<string>;
  onAdd: (definition: EffectDefinition, duration: number | null) => void;
  onClose: () => void;
}

export function EffectPicker({ effects, activeDefinitionIds, onAdd, onClose }: EffectPickerProps) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState<EffectCategory>("neutral");
  const [customDuration, setCustomDuration] = useState("");
  const [customDurationUnit, setCustomDurationUnit] = useState<DurationUnit>("rounds");
  const [recentEffects, setRecentEffects] = useState(readRecentEffects);
  const searchRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const definitions = useMemo(() => Array.from(new Map([
    ...effects,
    ...recentEffects.flatMap((entry) => entry.definition ? [entry.definition] : []),
  ].map((effect) => [effect.id, effect])).values()), [effects, recentEffects]);
  const matches = useMemo(() => definitions.filter((effect) => `${effect.name} ${effect.description}`.toLocaleLowerCase().includes(normalizedQuery)), [definitions, normalizedQuery]);
  const recent = normalizedQuery ? [] : recentEffects.map((entry) => definitions.find((effect) => effect.id === entry.id)).filter((effect): effect is EffectDefinition => Boolean(effect));
  const recentSet = new Set(recent.map((effect) => effect.id));
  const results = normalizedQuery ? matches : matches.filter((effect) => !recentSet.has(effect.id));

  const remember = (definition: EffectDefinition) => {
    const next = [{ id: definition.id, definition }, ...recentEffects.filter((entry) => entry.id !== definition.id)].slice(0, RECENT_LIMIT);
    setRecentEffects(next);
    window.localStorage.setItem(RECENT_EFFECTS_KEY, JSON.stringify(next));
  };

  const apply = (definition: EffectDefinition) => {
    if (activeDefinitionIds.has(definition.id)) return;
    remember(definition);
    onAdd(definition, definition.duration?.default ?? null);
    onClose();
  };

  const customId = `custom-${customName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "effect"}`;
  const customAlreadyApplied = activeDefinitionIds.has(customId);
  const categories: { value: EffectCategory; label: string }[] = [
    { value: "neutral", label: "Neutral" },
    { value: "buff", label: "Buff" },
    { value: "debuff", label: "Debuff" },
    { value: "beneficial", label: "Beneficial" },
    { value: "detrimental", label: "Detrimental" },
  ];
  const createCustom = () => {
    if (!customName.trim() || customAlreadyApplied) return;
    const duration = durationToRounds(customDuration, customDurationUnit);
    const definition: EffectDefinition = {
      id: customId,
      name: customName.trim(),
      description: customDescription.trim() || "Custom effect.",
      category: customCategory,
      duration: { default: duration, tickAt: duration === null ? "manual" : "turn-start" },
    };
    remember(definition);
    onAdd(definition, duration);
    onClose();
  };

  const resultRow = (effect: EffectDefinition) => {
    const icon = effect.presentation?.icon ?? effectIconPath(effect.id);
    const applied = activeDefinitionIds.has(effect.id);
    return <button
      key={effect.id}
      type="button"
      className={`effect-result effect-result--${effect.category}`}
      disabled={applied}
      aria-label={`${effect.name}, ${durationLabel(effect)}${applied ? ", already applied" : ""}`}
      onClick={() => apply(effect)}
    >
      <span className="effect-result__icon">{icon ? <img src={icon} alt="" /> : <i aria-hidden="true" />}</span>
      <span className="effect-result__copy"><strong>{effect.name}</strong><small>{effect.description}</small></span>
      <span className="effect-result__meta">{applied ? "Applied" : durationLabel(effect)}</span>
    </button>;
  };

  return <Popover.Portal>
    <Popover.Content
      className={`effect-picker-popover${custom ? " is-custom" : ""}`}
      align="start"
      sideOffset={6}
      collisionPadding={8}
      onOpenAutoFocus={(event) => { event.preventDefault(); window.setTimeout(() => searchRef.current?.focus(), 0); }}
      onEscapeKeyDown={onClose}
    >
      <div className="effect-picker__header">
        {custom && <button type="button" className="effect-picker__back" aria-label="Back to effects" onClick={() => setCustom(false)}><img src="/icons/ui/previous.svg" alt="" /></button>}
        <div><strong>{custom ? "Custom effect" : "Add effect"}</strong>{!custom && <small>Select an effect to apply it immediately.</small>}</div>
        <button type="button" className="effect-picker__close" aria-label="Close effect picker" onClick={onClose}><img src="/icons/ui/close-small.svg" alt="" /></button>
      </div>

      {custom ? <form className="effect-picker__custom" onSubmit={(event) => { event.preventDefault(); createCustom(); }}>
        <div className="effect-picker__category-options" role="radiogroup" aria-label="Effect category">
          {categories.map((category) => <button
            key={category.value}
            type="button"
            role="radio"
            aria-checked={customCategory === category.value}
            aria-label={category.label}
            title={category.label}
            className={`effect-picker__category effect-picker__category--${category.value}`}
            onClick={() => setCustomCategory(category.value)}
          ><img src={`/icons/ui/effect-${category.value}.svg`} alt="" /></button>)}
        </div>
        <div className="effect-picker__custom-fields">
          <input ref={searchRef} value={customName} onInput={(event) => setCustomName(event.currentTarget.value)} placeholder="Effect name" aria-label="Effect name" />
          <input inputMode="numeric" min="1" value={customDuration} onInput={(event) => setCustomDuration(event.currentTarget.value)} placeholder="Duration" aria-label={`Duration in ${customDurationUnit}`} />
          <SelectField className="effect-picker__duration-select" value={customDurationUnit} options={DURATION_UNITS} onValueChange={setCustomDurationUnit} ariaLabel="Duration unit" />
        </div>
        <textarea rows={3} value={customDescription} onInput={(event) => setCustomDescription(event.currentTarget.value)} placeholder="Value" aria-label="Effect description" />
        {customAlreadyApplied && <p className="effect-picker__error" role="alert">An effect with this name is already applied.</p>}
        <div className="effect-picker__custom-actions"><Button type="button" compact onClick={() => setCustom(false)}>Cancel</Button><Button type="submit" compact tone="primary" disabled={!customName.trim() || customAlreadyApplied}>Add effect</Button></div>
      </form> : <>
        <div className="effect-picker__search"><input
          ref={searchRef}
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            const first = matches.find((effect) => !activeDefinitionIds.has(effect.id));
            if (first) { event.preventDefault(); apply(first); }
          }}
          placeholder="Search effects…"
          aria-label="Search effects"
        /></div>
        <div className="effect-picker__results">
          {recent.length > 0 && <section><h3>Recently used</h3>{recent.map(resultRow)}</section>}
          <section><h3>{normalizedQuery ? "Results" : "All effects"}</h3>{results.length ? results.map(resultRow) : <p className="effect-picker__empty">No matching effects.</p>}</section>
        </div>
        <button type="button" className="effect-picker__custom-trigger" onClick={() => setCustom(true)}><img src="/icons/ui/add.svg" alt="" /><span><strong>Create custom effect</strong><small>Add a one-off effect for this encounter.</small></span></button>
      </>}
    </Popover.Content>
  </Popover.Portal>;
}
