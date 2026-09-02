import { useEffect, useRef } from "react";
import type { ActiveEffect, EffectDefinition, Encounter, EncounterEntity } from "../../domain/types";
import { EntityRow } from "./EntityRow";
import { InlineEntityEditor } from "./InlineEntityEditor";

interface TurnOrderProps {
  encounter: Encounter;
  rosterIds: ReadonlySet<string>;
  combatEditing: boolean;
  editingEntityId: string | null;
  onEdit: (entity: EncounterEntity) => void;
  onSaveEdit: (entity: EncounterEntity) => void;
  onCancelEdit: () => void;
  onEditDirtyChange: (dirty: boolean) => void;
  onHealthAction: (entity: EncounterEntity, action: "damage" | "heal" | "temp" | "set", amount: number) => void;
  onConfigureHealth: (entity: EncounterEntity, currentHP: number | undefined, maxHP: number | undefined) => void;
  onRoll: (entity: EncounterEntity) => void;
  effects: EffectDefinition[];
  onAddEffect: (entity: EncounterEntity, definition: EffectDefinition, duration: number | null) => void;
  onUpdateEffect: (entity: EncounterEntity, effectId: string, changes: Partial<ActiveEffect>) => void;
  onRemoveEffect: (entity: EncounterEntity, effectId: string) => void;
  onRemove: (entity: EncounterEntity) => void;
  onDuplicate: (entity: EncounterEntity) => void;
  onToggleRoster: (entity: EncounterEntity) => void;
  onDelay: () => void;
  onHold: (entity: EncounterEntity) => void;
  onDodge: (entity: EncounterEntity) => void;
  onReaction: (entity: EncounterEntity) => void;
  onDeathSave: (entity: EncounterEntity, kind: "success" | "failure") => void;
  onStabilize: (entity: EncounterEntity) => void;
  onRevive: (entity: EncounterEntity) => void;
  onNotes: (entity: EncounterEntity) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
  draftEntity: EncounterEntity | null;
  onDraftChange: (entity: EncounterEntity) => void;
  onDraftComplete: (entity: EncounterEntity) => void;
  onDraftCancel: () => void;
}

export function TurnOrder(props: TurnOrderProps) {
  const dragIndex = useRef<number | null>(null);
  const staging = props.encounter.mode === "staging" || props.combatEditing;

  useEffect(() => {
    if (props.encounter.mode !== "active" || props.combatEditing || !props.encounter.activeEntityId) return;
    document.getElementById(`entity-${props.encounter.activeEntityId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [props.encounter.activeEntityId, props.encounter.mode, props.combatEditing]);

  return <div className="turn-order">
    {props.encounter.entities.map((entity, index) => <EntityRow
      key={entity.id}
      entity={entity}
      inRoster={Boolean(entity.rosterId && props.rosterIds.has(entity.rosterId))}
      active={props.encounter.mode === "active" && !props.combatEditing && props.encounter.activeEntityId === entity.id}
      staging={staging}
      editing={props.editingEntityId === entity.id}
      onEdit={() => props.onEdit(entity)}
      onSaveEdit={props.onSaveEdit}
      onCancelEdit={props.onCancelEdit}
      onEditDirtyChange={props.onEditDirtyChange}
      onHealthAction={(action, amount) => props.onHealthAction(entity, action, amount)}
      onConfigureHealth={(currentHP, maxHP) => props.onConfigureHealth(entity, currentHP, maxHP)}
      onRoll={() => props.onRoll(entity)}
      effects={props.effects}
      onAddEffect={(definition, duration) => props.onAddEffect(entity, definition, duration)}
      onUpdateEffect={(effectId, changes) => props.onUpdateEffect(entity, effectId, changes)}
      onRemoveEffect={(effectId) => props.onRemoveEffect(entity, effectId)}
      onRemove={() => props.onRemove(entity)}
      onDuplicate={() => props.onDuplicate(entity)}
      onToggleRoster={() => props.onToggleRoster(entity)}
      onDelay={props.onDelay}
      onHold={() => props.onHold(entity)}
      onDodge={() => props.onDodge(entity)}
      onReaction={() => props.onReaction(entity)}
      onDeathSave={(kind) => props.onDeathSave(entity, kind)}
      onStabilize={() => props.onStabilize(entity)}
      onRevive={() => props.onRevive(entity)}
      onNotes={() => props.onNotes(entity)}
      onDragStart={() => { dragIndex.current = index; }}
      onDrop={() => { if (dragIndex.current !== null) props.onReorder(dragIndex.current, index); dragIndex.current = null; }}
    />)}
    {props.draftEntity && <InlineEntityEditor key={props.draftEntity.id} entity={props.draftEntity} onChange={props.onDraftChange} onComplete={props.onDraftComplete} onCancel={props.onDraftCancel} />}
    {staging && <button className="add-row" onClick={props.onAdd}><span className="add-row__icon"><img src="/icons/ui/add.svg" alt="" /></span><strong>New Entity</strong></button>}
  </div>;
}
