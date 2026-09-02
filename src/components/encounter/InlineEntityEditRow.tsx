import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { configureEntityHP } from "../../domain/hit-points";
import type { EncounterEntity, EntityType } from "../../domain/types";

interface InlineEntityEditRowProps {
  entity: EncounterEntity;
  onSave: (entity: EncounterEntity) => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const typeOptions: Array<{ type: EntityType; label: string; icon: string }> = [
  { type: "PC", label: "Player", icon: "/icons/ui/player.svg" },
  { type: "Enemy", label: "Enemy", icon: "/icons/ui/enemy.svg" },
  { type: "Ally", label: "Ally", icon: "/icons/ui/ally.svg" },
  { type: "Neutral", label: "NPC", icon: "/icons/ui/entity-default.svg" },
];

const integer = (value: string) => /^[+-]?\d+$/.test(value) ? Number(value) : undefined;
const signed = (value: number) => value >= 0 ? `+${value}` : String(value);

export function InlineEntityEditRow({ entity, onSave, onCancel, onDirtyChange }: InlineEntityEditRowProps) {
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState<EntityType>(entity.type);
  const [modifier, setModifier] = useState(signed(entity.initiativeModifier));
  const [armorClass, setArmorClass] = useState(String(entity.armorClass));
  const [currentHP, setCurrentHP] = useState(String(entity.currentHP));
  const [maxHP, setMaxHP] = useState(String(entity.maxHP));

  const modifierValue = integer(modifier);
  const armorValue = integer(armorClass);
  const currentValue = integer(currentHP);
  const maximumValue = integer(maxHP);
  const currentError = currentValue === undefined
    ? "Enter current HP as a whole number."
    : currentValue < 0
      ? "Current HP cannot be below 0."
      : maximumValue !== undefined && currentValue > maximumValue
        ? "Current HP cannot exceed maximum HP."
        : undefined;
  const maximumError = maximumValue === undefined
    ? "Enter maximum HP as a whole number."
    : maximumValue < 0
      ? "Maximum HP cannot be below 0."
      : undefined;
  const valid = Boolean(name.trim())
    && modifierValue !== undefined
    && armorValue !== undefined && armorValue >= 0
    && !currentError
    && !maximumError;
  const selected = typeOptions.find((option) => option.type === type) ?? typeOptions[1];

  const markDirty = () => onDirtyChange(true);
  const save = () => {
    if (!valid || modifierValue === undefined || armorValue === undefined || currentValue === undefined || maximumValue === undefined) return;
    onSave(configureEntityHP({
      ...entity,
      name: name.trim(),
      type,
      initiativeModifier: modifierValue,
      armorClass: armorValue,
    }, currentValue, maximumValue));
  };

  return <form
    id={`entity-${entity.id}`}
    className="inline-entity-editor inline-entity-editor--editing"
    aria-label={`Edit ${entity.name}`}
    onSubmit={(event) => { event.preventDefault(); save(); }}
    onKeyDown={(event) => {
      if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
        event.preventDefault();
        save();
        return;
      }
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }}
  >
    <span className="inline-entity-editor__drag" aria-hidden="true"><img src="/icons/ui/drag-muted.svg" alt="" /></span>
    <div className="inline-entity-editor__contents">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={`inline-type-picker entity-type--${type.toLowerCase()}`} aria-label={`Entity type: ${selected.label}`} title="Entity type">
          <img src={selected.icon} alt="" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal><DropdownMenu.Content className="inline-type-menu" align="start" sideOffset={7} collisionPadding={8}>
          <DropdownMenu.Label className="inline-type-menu__label">Entity type</DropdownMenu.Label>
          {typeOptions.map((option) => <DropdownMenu.Item
            key={option.type}
            className={`inline-type-option inline-type-option--${option.type.toLowerCase()}`}
            onSelect={() => { setType(option.type); markDirty(); }}
          ><img src={option.icon} alt="" />{option.label}</DropdownMenu.Item>)}
        </DropdownMenu.Content></DropdownMenu.Portal>
      </DropdownMenu.Root>
      <label className="inline-field inline-field--initiative" title="Initiative modifier">
        <img src="/icons/ui/initiative-modifier.svg" alt="" />
        <input
          inputMode="numeric"
          aria-label="Initiative modifier"
          aria-invalid={modifierValue === undefined}
          value={modifier}
          onInput={(event) => { setModifier(event.currentTarget.value); markDirty(); }}
        />
      </label>
      <input
        autoFocus
        className="inline-field inline-field--name"
        aria-label="Entity name"
        aria-invalid={!name.trim()}
        value={name}
        onInput={(event) => { setName(event.currentTarget.value); markDirty(); }}
      />
      <label className="inline-field inline-field--ac" title="Armor Class">
        <img src="/icons/ui/field-shield.svg" alt="" />
        <input
          inputMode="numeric"
          min="0"
          aria-label="Armor Class"
          aria-invalid={armorValue === undefined || armorValue < 0}
          value={armorClass}
          onInput={(event) => { setArmorClass(event.currentTarget.value); markDirty(); }}
        />
      </label>
      <div className="inline-complete-health" title="Current and maximum hit points">
        <label className="inline-field inline-field--hp-current">
          <img src="/icons/ui/field-heart.svg" alt="" />
          <input
            inputMode="numeric"
            min="0"
            aria-label="Current HP"
            aria-invalid={Boolean(currentError)}
            aria-describedby={currentError ? `entity-${entity.id}-hp-error` : undefined}
            value={currentHP}
            onInput={(event) => { setCurrentHP(event.currentTarget.value); markDirty(); }}
          />
        </label>
        <i aria-hidden="true" />
        <input
          className="inline-field inline-field--hp-max"
          inputMode="numeric"
          min="0"
          aria-label="Maximum HP"
          aria-invalid={Boolean(maximumError)}
          aria-describedby={maximumError ? `entity-${entity.id}-hp-error` : undefined}
          value={maxHP}
          onInput={(event) => {
            const next = event.currentTarget.value;
            const nextMaximum = integer(next);
            setMaxHP(next);
            if (nextMaximum !== undefined && nextMaximum >= 0 && currentValue !== undefined && currentValue > nextMaximum) setCurrentHP(String(nextMaximum));
            markDirty();
          }}
        />
      </div>
    </div>
    <div className="inline-entity-editor__actions">
      <button type="submit" className="inline-commit" disabled={!valid} aria-label="Save entity changes" title="Save changes (Enter)">
        <img src="/icons/ui/check.svg" alt="" />
      </button>
      <button type="button" aria-label="Discard entity changes" title="Discard changes (Escape)" onClick={onCancel}>
        <img src="/icons/ui/close-small.svg" alt="" />
      </button>
    </div>
    {(currentError || maximumError) && <span id={`entity-${entity.id}-hp-error`} className="inline-entity-editor__error" role="alert">{currentError ?? maximumError}</span>}
  </form>;
}
