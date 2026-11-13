import { useId, useMemo, useState } from "react";
import { matchingEntityNameSuggestions, type EntityNameSuggestion } from "../../domain/entity-name-suggestions";

interface CreatureNameAutocompleteProps {
  value: string;
  suggestions: EntityNameSuggestion[];
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: EntityNameSuggestion) => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

const sourceLabel = { roster: "Roster", bestiary: "Bestiary", encounter: "Encounter" } as const;
const typeIcon = { PC: "/icons/ui/player.svg", Enemy: "/icons/ui/enemy.svg", Ally: "/icons/ui/ally.svg", Neutral: "/icons/ui/npc.svg" } as const;

function suggestionType(suggestion: EntityNameSuggestion) {
  return suggestion.source === "roster" ? suggestion.member.type : suggestion.source === "encounter" ? suggestion.sourceEntity.type : "Enemy";
}

export function CreatureNameAutocomplete({ value, suggestions: candidates, className, autoFocus, placeholder, ariaLabel = "Entity name", onChange, onSelect, onEnter, onEscape }: CreatureNameAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(() => matchingEntityNameSuggestions(value, candidates), [candidates, value]);
  const visible = open && suggestions.length > 0;
  const choose = (suggestion: EntityNameSuggestion) => { setOpen(false); onSelect(suggestion); };

  return <div className="creature-name-autocomplete">
    <input
      autoFocus={autoFocus}
      className={className}
      role="combobox"
      aria-label={ariaLabel}
      aria-autocomplete="list"
      aria-expanded={visible}
      aria-controls={visible ? listId : undefined}
      aria-activedescendant={visible ? `${listId}-${suggestions[activeIndex]?.id.replaceAll(":", "-")}` : undefined}
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
    {visible && <div className="creature-suggestions" id={listId} role="listbox" aria-label="Matching roster and bestiary entries">
      {suggestions.map((suggestion, index) => {
        const type = suggestionType(suggestion);
        return <button
          key={suggestion.id}
          id={`${listId}-${suggestion.id.replaceAll(":", "-")}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(suggestion)}
        >
          <span className={`creature-suggestions__icon creature-suggestions__icon--${type.toLocaleLowerCase()}`}><img src={typeIcon[type]} alt="" /></span>
          <span><strong>{suggestion.name}<em>{sourceLabel[suggestion.source]}</em></strong><small>{suggestion.detail}</small></span>
        </button>})}
    </div>}
  </div>;
}
