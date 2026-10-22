import { useId, useMemo, useState } from "react";
import { canonicalEntityName, matchingCreatureSuggestions } from "../../domain/stat-block-links";
import type { EncounterEntity } from "../../domain/types";

interface CreatureNameAutocompleteProps {
  value: string;
  entities: EncounterEntity[];
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  onChange: (value: string) => void;
  onSelect: (entity: EncounterEntity) => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

export function CreatureNameAutocomplete({ value, entities, className, autoFocus, placeholder, ariaLabel = "Entity name", onChange, onSelect, onEnter, onEscape }: CreatureNameAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(() => matchingCreatureSuggestions(value, entities), [entities, value]);
  const visible = open && suggestions.length > 0;
  const choose = (entity: EncounterEntity) => { setOpen(false); onSelect(entity); };

  return <div className="creature-name-autocomplete">
    <input
      autoFocus={autoFocus}
      className={className}
      role="combobox"
      aria-label={ariaLabel}
      aria-autocomplete="list"
      aria-expanded={visible}
      aria-controls={visible ? listId : undefined}
      aria-activedescendant={visible ? `${listId}-${suggestions[activeIndex]?.id}` : undefined}
      placeholder={placeholder}
      value={value}
      onFocus={() => setOpen(true)}
      onInput={(event) => { onChange(event.currentTarget.value); setOpen(true); setActiveIndex(0); }}
      onKeyDown={(event) => {
        if (visible && event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % suggestions.length); return; }
        if (visible && event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length); return; }
        if (event.key === "Enter") { event.preventDefault(); if (visible) choose(suggestions[activeIndex]); else onEnter?.(); return; }
        if (event.key === "Escape") { event.preventDefault(); if (visible) setOpen(false); else onEscape?.(); }
      }}
    />
    {visible && <div className="creature-suggestions" id={listId} role="listbox" aria-label="Matching creatures">
      {suggestions.map((entity, index) => <button
        key={entity.id}
        id={`${listId}-${entity.id}`}
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(entity)}
      >
        <span className="creature-suggestions__icon"><img src="/icons/ui/enemy.svg" alt="" /></span>
        <span><strong>{canonicalEntityName(entity.name)}</strong><small>Shared stat block · AC {entity.armorClass} · HP {entity.maxHP}</small></span>
      </button>)}
    </div>}
  </div>;
}
