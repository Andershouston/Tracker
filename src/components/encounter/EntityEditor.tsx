import { useState } from "react";
import { ToggleGroup } from "radix-ui";
import { instantiateEntityNameSuggestion, type EntityNameSuggestion } from "../../domain/entity-name-suggestions";
import { createEntity, parseEntityType } from "../../domain/factories";
import { configureEntityHP } from "../../domain/hit-points";
import type { EncounterEntity, EntityType } from "../../domain/types";
import { Button } from "../shared/Button";
import { Modal } from "../shared/Modal";
import { CheckboxField } from "../shared/CheckboxField";
import { CreatureNameAutocomplete } from "./CreatureNameAutocomplete";

interface EntityEditorProps {
  entity?: EncounterEntity;
  title?: string;
  rosterOnly?: boolean;
  nameSuggestions?: EntityNameSuggestion[];
  existingEntities?: EncounterEntity[];
  onSave: (entity: EncounterEntity, statBlockSourceId?: string) => void;
  onClose: () => void;
}

export function EntityEditor({ entity, title, rosterOnly = false, nameSuggestions = [], existingEntities = [], onSave, onClose }: EntityEditorProps) {
  const [draft, setDraft] = useState<EncounterEntity>(() => ({
    ...(entity ? structuredClone(entity) : createEntity()),
    ...(rosterOnly ? { isPersistent: true } : {}),
  }));
  const [statBlockSourceId, setStatBlockSourceId] = useState<string>();
  const update = <K extends keyof EncounterEntity>(key: K, value: EncounterEntity[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const typeOptions: Array<{ type: EntityType; label: string; icon: string }> = [
    { type: "PC", label: "Player", icon: "/icons/ui/player.svg" },
    { type: "Enemy", label: "Enemy", icon: "/icons/ui/enemy.svg" },
    { type: "Neutral", label: "NPC", icon: "/icons/ui/npc.svg" },
    { type: "Ally", label: "Ally", icon: "/icons/ui/ally.svg" },
  ];
  const hpValid = draft.maxHP >= 0 && draft.currentHP <= draft.maxHP;
  const save = () => onSave(configureEntityHP({ ...draft, name: draft.name.trim(), isPersistent: rosterOnly || draft.isPersistent }, draft.currentHP, draft.maxHP), statBlockSourceId);
  const selectSuggestion = (suggestion: EntityNameSuggestion) => {
    const resolved = instantiateEntityNameSuggestion(suggestion, draft, existingEntities);
    setDraft(resolved.entity);
    setStatBlockSourceId(resolved.statBlockSourceId);
  };

  return (
    <Modal
      title={title ?? (entity ? "Edit Entity" : "Add Entity")}
      onClose={onClose}
      footer={<><Button tone="quiet" onClick={onClose}>Discard changes</Button><Button tone="primary" disabled={!draft.name.trim() || !hpValid} onClick={save}>{entity ? "Save entity" : rosterOnly ? "Add character" : "Add entity"}</Button></>}
    >
      <div className="form-stack">
        <fieldset className="segmented-field">
          <legend>Type</legend>
          <ToggleGroup.Root className="segmented" type="single" value={draft.type} onValueChange={(value) => { if (value) update("type", parseEntityType(value)); }}>
            {typeOptions.map((option) => <ToggleGroup.Item
              key={option.type}
              value={option.type}
              className={`segmented-type segmented-type--${option.type.toLowerCase()}`}
            ><img src={option.icon} alt="" />{option.label}</ToggleGroup.Item>)}
          </ToggleGroup.Root>
        </fieldset>
        {!entity && !rosterOnly
          ? <div className="field field--full"><span>Name</span><CreatureNameAutocomplete autoFocus value={draft.name} suggestions={nameSuggestions} onChange={(value) => { update("name", value); setStatBlockSourceId(undefined); }} onSelect={selectSuggestion} onEnter={save} placeholder="Goblin" /></div>
          : <label className="field field--full"><span>Name</span><input autoFocus value={draft.name} onInput={(event) => update("name", event.currentTarget.value)} placeholder="Goblin" /></label>}
        <div className="form-grid">
          <label className="field"><span>Maximum HP</span><input type="number" min="0" step="1" value={draft.maxHP} onInput={(event) => { const maxHP = Math.max(0, Math.floor(event.currentTarget.valueAsNumber || 0)); setDraft((current) => ({ ...current, maxHP, currentHP: current.currentHP > maxHP ? maxHP : current.currentHP })); }} /></label>
          <label className="field"><span>Current HP</span><input type="number" step="1" aria-invalid={!hpValid} value={draft.currentHP} onInput={(event) => update("currentHP", Math.floor(event.currentTarget.valueAsNumber || 0))} /></label>
          <label className="field"><span>Armor Class</span><input type="number" min="0" value={draft.armorClass} onInput={(event) => update("armorClass", Math.max(0, event.currentTarget.valueAsNumber || 0))} /></label>
          <label className="field"><span>Initiative modifier</span><input type="number" value={draft.initiativeModifier} onInput={(event) => update("initiativeModifier", event.currentTarget.valueAsNumber || 0)} /></label>
        </div>
        {!rosterOnly && <CheckboxField checked={draft.isPersistent} onCheckedChange={(checked) => update("isPersistent", checked)} label="Add to party roster" />}
      </div>
    </Modal>
  );
}
