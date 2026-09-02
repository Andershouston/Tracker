import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import type { EncounterEntity, EntityType } from "../../domain/types";

interface InlineEntityEditorProps {
  entity: EncounterEntity;
  onChange: (entity: EncounterEntity) => void;
  onComplete: (entity: EncounterEntity) => void;
  onCancel: () => void;
}

const typeOptions: Array<{ type: EntityType; label: string; icon: string }> = [
  { type: "PC", label: "Player", icon: "/icons/ui/player.svg" },
  { type: "Enemy", label: "Enemy", icon: "/icons/ui/enemy.svg" },
  { type: "Ally", label: "Ally", icon: "/icons/ui/ally.svg" },
  { type: "Neutral", label: "NPC", icon: "/icons/ui/entity-default.svg" },
];

export function InlineEntityEditor({ entity, onChange, onComplete, onCancel }: InlineEntityEditorProps) {
  const [draft, setDraft] = useState<EncounterEntity>(entity);
  const [name, setName] = useState(entity.name);
  const [initiativeModifier, setInitiativeModifier] = useState(String(entity.initiativeModifier || ""));
  const [armorClass, setArmorClass] = useState(String(entity.armorClass));
  const [maxHP, setMaxHP] = useState(String(entity.maxHP));
  const selected = typeOptions.find((option) => option.type === draft.type) ?? typeOptions[1];

  const value = (overrides: Partial<EncounterEntity> = {}): EncounterEntity => {
    const hp = Math.max(0, Math.floor(Number(maxHP) || 0));
    return {
      ...draft,
      name,
      initiativeModifier: Number(initiativeModifier) || 0,
      armorClass: Math.max(0, Number(armorClass) || 10),
      maxHP: hp,
      currentHP: hp,
      ...overrides,
    };
  };
  const publish = (next: EncounterEntity) => { setDraft(next); onChange(next); };
  const finish = () => {
    if (!name.trim()) return;
    onComplete({ ...value(), name: name.trim() });
  };

  return <article className="inline-entity-editor">
    <span className="inline-entity-editor__drag"><img src="/icons/ui/drag-muted.svg" alt="" /></span>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="inline-type-picker" aria-label={`Entity type: ${selected.label}`}><img src={selected.icon} alt="" /></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="inline-type-menu" align="start" sideOffset={7} collisionPadding={8}>
        <DropdownMenu.Label className="inline-type-menu__label">Entity type</DropdownMenu.Label>{typeOptions.map((option) => <DropdownMenu.Item key={option.type} className={`inline-type-option inline-type-option--${option.type.toLowerCase()}`} onSelect={() => publish(value({ type: option.type }))}><img src={option.icon} alt="" />{option.label}</DropdownMenu.Item>)}
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    <label className="inline-field inline-field--initiative" title="Initiative modifier"><img src="/icons/ui/initiative-modifier.svg" alt="" /><input type="number" aria-label="Initiative modifier" placeholder="0" value={initiativeModifier} onInput={(event) => { setInitiativeModifier(event.currentTarget.value); onChange(value({ initiativeModifier: event.currentTarget.valueAsNumber || 0 })); }} /></label>
    <input autoFocus className="inline-field inline-field--name" aria-label="Entity name" placeholder="Entity name" value={name} onInput={(event) => { setName(event.currentTarget.value); onChange(value({ name: event.currentTarget.value })); }} onKeyDown={(event) => { if (event.key === "Enter") finish(); if (event.key === "Escape") onCancel(); }} />
    <label className="inline-field inline-field--ac" title="Armor Class"><img src="/icons/ui/field-shield.svg" alt="" /><input type="number" min="0" aria-label="Armor Class" value={armorClass} onInput={(event) => { setArmorClass(event.currentTarget.value); onChange(value({ armorClass: event.currentTarget.valueAsNumber || 10 })); }} /></label>
    <label className="inline-field inline-field--hp" title="Maximum Hit Points"><img src="/icons/ui/field-heart.svg" alt="" /><input type="number" min="0" step="1" aria-label="Maximum Hit Points" value={maxHP} onInput={(event) => { setMaxHP(event.currentTarget.value); const hp = Math.max(0, Math.floor(event.currentTarget.valueAsNumber || 0)); onChange(value({ maxHP: hp, currentHP: hp })); }} onKeyDown={(event) => { if (event.key === "Enter") finish(); }} /></label>
    <div className="inline-entity-editor__actions">
      <button type="button" className="party-status-button" aria-label={draft.isPersistent ? "Remove from party roster" : "Add to party roster"} aria-pressed={draft.isPersistent} title={draft.isPersistent ? "Remove from party roster" : "Add to party roster"} onClick={() => publish(value({ isPersistent: !draft.isPersistent }))}>
        <img className="party-status-icon party-status-icon--rest" src={draft.isPersistent ? "/icons/ui/party-status.svg" : "/icons/ui/party-status-in.svg"} alt="" />
        <img className="party-status-icon party-status-icon--active" src={draft.isPersistent ? "/icons/ui/party-status-out-active.svg" : "/icons/ui/party-status-in-active.svg"} alt="" />
      </button>
      <button type="button" className="inline-commit" disabled={!name.trim()} aria-label="Add entity" title="Add entity" onClick={finish}>✓</button>
      <button type="button" aria-label="Cancel entity" title="Cancel entity" onClick={onCancel}><img src="/icons/ui/close-small.svg" alt="" /></button>
    </div>
  </article>;
}
