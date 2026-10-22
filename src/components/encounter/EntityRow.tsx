import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { DropdownMenu, Popover } from "radix-ui";
import { effectIconPath } from "../../content/builtin";
import type { ActiveEffect, EffectDefinition, EncounterEntity } from "../../domain/types";
import { CombatHealthPopover } from "./CombatHealthPopover";
import { EffectManagerPopover } from "./EffectManagerPopover";
import { EffectPicker } from "./EffectPicker";
import { InlineEntityEditRow } from "./InlineEntityEditRow";

type QuickEditField = "name" | "armorClass" | "currentHP" | "maxHP";

interface EntityRowProps {
  entity: EncounterEntity;
  inRoster: boolean;
  active: boolean;
  staging: boolean;
  editing: boolean;
  selected: boolean;
  onEdit: () => void;
  onSaveEdit: (entity: EncounterEntity) => void;
  onCancelEdit: () => void;
  onEditDirtyChange: (dirty: boolean) => void;
  onHealthAction: (action: "damage" | "heal" | "temp" | "set", amount: number) => void;
  onConfigureHealth: (currentHP: number | undefined, maxHP: number | undefined) => void;
  onInitiativeChange: (initiative: number | null) => void;
  onQuickUpdate: (changes: Partial<Pick<EncounterEntity, "name" | "armorClass">>) => void;
  effects: EffectDefinition[];
  onAddEffect: (definition: EffectDefinition, duration: number | null) => void;
  onUpdateEffect: (effectId: string, changes: Partial<ActiveEffect>) => void;
  onRemoveEffect: (effectId: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleRoster: () => void;
  onSaveToBestiary: () => void;
  onToggleSelection: () => void;
  onDelay: () => void;
  onHold: () => void;
  onDodge: () => void;
  onReaction: () => void;
  onDeathSave: (kind: "success" | "failure") => void;
  onStabilize: () => void;
  onRevive: () => void;
  onNotes: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}

export function EntityRow(props: EntityRowProps) {
  const { entity } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hpOpen, setHpOpen] = useState(false);
  const [effectOpen, setEffectOpen] = useState(false);
  const [managedEffectId, setManagedEffectId] = useState<string | null>(null);
  const [quickEdit, setQuickEdit] = useState<{ field: QuickEditField; value: string } | null>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!quickEdit) return;
    quickInputRef.current?.focus();
    quickInputRef.current?.select();
  }, [quickEdit?.field]);
  if (props.editing) return <InlineEntityEditRow entity={entity} onSave={props.onSaveEdit} onCancel={props.onCancelEdit} onDirtyChange={props.onEditDirtyChange} />;
  const openHealthFromMenu = () => {
    setMenuOpen(false);
    window.setTimeout(() => setHpOpen(true), 80);
  };
  const openEffectsFromMenu = () => {
    setMenuOpen(false);
    window.setTimeout(() => setEffectOpen(true), 80);
  };
  const hpPercent = entity.maxHP ? Math.max(0, Math.min(100, entity.currentHP / entity.maxHP * 100)) : 0;
  const displayedHP = entity.currentHP + entity.tempHP;
  const hpSeverity = hpPercent <= 25 ? "critical" : hpPercent <= 50 ? "wounded" : "healthy";
  const isDead = !props.staging && entity.isDead;
  const isDying = !props.staging && entity.isDying;
  const stateClass = isDead ? " is-dead" : isDying ? " is-dying" : entity.isUnconscious ? " is-unconscious" : "";
  const typeClass = ` entity-row--${entity.type.toLowerCase()}`;
  const aliveIcon = entity.type === "PC" ? "/icons/ui/player.svg" : entity.type === "Ally" ? "/icons/ui/ally.svg" : entity.type === "Enemy" ? "/icons/ui/enemy.svg" : "/icons/ui/npc.svg";
  const iconState = isDead ? "dead" : (isDying || entity.isUnconscious) ? "unconscious" : entity.reactionUsed ? "reaction-used" : "alive";
  const iconStateLabel = isDead ? "Dead" : isDying ? "Dying" : entity.isUnconscious ? "Stable" : entity.reactionUsed ? "Reaction used" : "Alive";
  const stateIcon = iconState === "alive" ? <img src={aliveIcon} alt="" /> : <span className={`entity-type__state-icon entity-type__state-icon--${iconState}`} aria-hidden="true" />;
  const inRoster = props.inRoster;
  const hasTabbedDetails = entity.type === "Ally" || entity.type === "Neutral";
  const detailsLabel = entity.type === "Enemy" ? "Stat block" : hasTabbedDetails ? "Notes and stat block" : "Notes";

  const beginQuickEdit = (field: QuickEditField, value: string | number) => setQuickEdit({ field, value: String(value) });
  const cancelQuickEdit = () => setQuickEdit(null);
  const commitQuickEdit = () => {
    if (!quickEdit) return;
    const { field, value } = quickEdit;
    setQuickEdit(null);
    if (field === "name") {
      const name = value.trim();
      if (name && name !== entity.name) props.onQuickUpdate({ name });
      return;
    }
    if (!/^\d+$/.test(value.trim())) return;
    const next = Number(value);
    if (field === "armorClass" && next !== entity.armorClass) props.onQuickUpdate({ armorClass: next });
    if (field === "currentHP" && next <= entity.maxHP && next !== entity.currentHP) props.onConfigureHealth(next, undefined);
    if (field === "maxHP" && next !== entity.maxHP) props.onConfigureHealth(undefined, next);
  };
  const quickEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelQuickEdit();
    } else if (event.key === "Enter") {
      event.preventDefault();
      commitQuickEdit();
    }
  };
  const quickInput = (field: QuickEditField, label: string, className: string) => <input
    ref={quickInputRef}
    className={className}
    inputMode={field === "name" ? undefined : "numeric"}
    aria-label={label}
    value={quickEdit?.value ?? ""}
    onFocus={(event) => event.currentTarget.select()}
    onChange={(event) => setQuickEdit({ field, value: event.currentTarget.value })}
    onKeyDown={quickEditKeyDown}
    onBlur={commitQuickEdit}
  />;

  const initiativeControl = props.staging
    ? <label className="initiative initiative--editable" title="Initiative">
        <img src="/icons/ui/initiative.svg" alt="" />
        <input
          type="number"
          step="1"
          inputMode="numeric"
          aria-label={`Initiative for ${entity.name}`}
          placeholder="—"
          value={entity.initiative ?? ""}
          onInput={(event) => {
            const initiative = event.currentTarget.valueAsNumber;
            props.onInitiativeChange(Number.isFinite(initiative) ? Math.trunc(initiative) : null);
          }}
        />
      </label>
    : <span className="initiative initiative--readonly" title="Initiative">
        <img src="/icons/ui/initiative.svg" alt="" />
        <span>{entity.initiative ?? "—"}</span>
      </span>;

  const healthControl = <button
    className={`health${hpOpen ? " is-engaged" : ""}`}
    onClick={() => {
      setMenuOpen(false);
      setHpOpen((open) => !open);
    }}
    title={props.staging ? "Edit current and maximum HP" : "Manage health"}
    aria-label={`${props.staging ? "Edit" : "Manage"} health for ${entity.name}: ${entity.tempHP > 0 ? `${displayedHP} effective hit points (${entity.currentHP} current plus ${entity.tempHP} temporary)` : `${entity.currentHP} hit points`} of ${entity.maxHP} maximum`}
    aria-expanded={hpOpen}
  >
    <span className={`health__current${entity.tempHP > 0 ? " has-temp" : ""}`} title={`Current HP: ${entity.currentHP}${entity.tempHP > 0 ? ` (${entity.tempHP} temp HP)` : ""}`}><img src="/icons/ui/heart.svg" alt="" />{displayedHP}</span>
    <i />
    <span className="health__max" title={`Maximum HP: ${entity.maxHP}`}>{entity.maxHP}</span>
  </button>;

  const stagingHealthControl = <span className="health health--staging-edit">
    {quickEdit?.field === "currentHP"
      ? <span className="health__current health__current--editing"><img src="/icons/ui/heart.svg" alt="" />{quickInput("currentHP", `Current HP for ${entity.name}`, "health__input")}</span>
      : <button className={`health__current${entity.tempHP > 0 ? " has-temp" : ""}`} title={`Current HP: ${entity.currentHP}${entity.tempHP > 0 ? ` (${entity.tempHP} temp HP)` : ""}`} aria-label={`Edit current HP for ${entity.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => beginQuickEdit("currentHP", entity.currentHP)}><img src="/icons/ui/heart.svg" alt="" />{displayedHP}</button>}
    <i />
    {quickEdit?.field === "maxHP"
      ? <span className="health__max health__max--editing">{quickInput("maxHP", `Maximum HP for ${entity.name}`, "health__input")}</span>
      : <button className="health__max" title={`Maximum HP: ${entity.maxHP}`} aria-label={`Edit maximum HP for ${entity.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => beginQuickEdit("maxHP", entity.maxHP)}>{entity.maxHP}</button>}
  </span>;

  return <article
    id={`entity-${entity.id}`}
    className={`entity-row${props.staging ? " entity-row--staging" : ""}${props.active ? " is-active" : ""}${props.selected ? " is-selected" : ""}${stateClass}${typeClass}`}
    draggable
    onDragStart={props.onDragStart}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => { event.preventDefault(); props.onDrop(); }}
  >
    <div className={`entity-row__main${props.staging ? " entity-row__main--staging" : ""}`}>
      <span className="drag-handle" title="Drag to reorder"><img src="/icons/ui/drag.svg" alt="" /></span>
      <div className="entity-row__content">
        <div className={`entity-row__stats${isDead ? " entity-row__stats--dead" : ""}${isDying ? " entity-row__stats--dying" : ""}`}>
          {props.staging || isDead
            ? props.staging
              ? <button className={`entity-type entity-type--${entity.type.toLowerCase()} entity-type--selectable`} title={`${props.selected ? "Deselect" : "Select"} ${entity.name}`} aria-label={`${props.selected ? "Deselect" : "Select"} ${entity.name}`} aria-pressed={props.selected} onClick={props.onToggleSelection}>{props.selected ? <span className="entity-type__selection-check" aria-hidden="true" /> : stateIcon}</button>
              : <span className={`entity-type entity-type--${entity.type.toLowerCase()}`} title={`${entity.type === "Neutral" ? "NPC" : entity.type} · ${iconStateLabel}`}>{stateIcon}</span>
            : <button className={`entity-type entity-type--${entity.type.toLowerCase()}`} title={`${entity.type} · ${iconStateLabel} · toggle reaction used`} onClick={props.onReaction}>{stateIcon}</button>}
          {initiativeControl}
          {props.staging
            ? quickEdit?.field === "name"
              ? quickInput("name", `Name for ${entity.name}`, "entity-name entity-name--input")
              : <button className="entity-name entity-name--editable" aria-label={`Edit name for ${entity.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => beginQuickEdit("name", entity.name)}>{entity.name}</button>
            : <span className="entity-name">{entity.name}</span>}
          {!isDead && !isDying && (props.staging
            ? quickEdit?.field === "armorClass"
              ? <label className="armor armor--editing"><img src="/icons/ui/shield.svg" alt="" />{quickInput("armorClass", `Armor Class for ${entity.name}`, "armor__input")}</label>
              : <button className="armor armor--editable" aria-label={`Edit Armor Class for ${entity.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => beginQuickEdit("armorClass", entity.armorClass)}><img src="/icons/ui/shield.svg" alt="" />{entity.armorClass}</button>
            : <span className="armor" title="Armor Class"><img src="/icons/ui/shield.svg" alt="" />{entity.armorClass}</span>)}
          {!isDead && props.staging && stagingHealthControl}
          {!isDead && !props.staging && <Popover.Root open={hpOpen} onOpenChange={(open) => { setHpOpen(open); if (open) setMenuOpen(false); }}>
              <Popover.Trigger asChild>{healthControl}</Popover.Trigger>
              {hpOpen && <CombatHealthPopover entity={entity} onClose={() => setHpOpen(false)} onAction={props.onHealthAction} />}
            </Popover.Root>}
        </div>
        {!props.staging && !isDead && <>
          <span className={`health__track health__track--${hpSeverity}`} aria-hidden="true"><span style={{ width: `${hpPercent}%` }} />{entity.tempHP > 0 && <i style={{ width: `${Math.min(100, entity.tempHP / Math.max(1, entity.maxHP) * 100)}%` }} />}</span>
          <div className="effect-bar">
            {props.active && !isDying && <div className="effect-actions">
              <button title="Hold action" aria-label={`Hold ${entity.name}'s action`} onClick={props.onHold}><img src="/icons/ui/hold.svg" alt="" /></button>
              <button title="Dodge" aria-label={`${entity.name} takes the Dodge action`} onClick={props.onDodge}><img src="/icons/ui/dodge.svg" alt="" /></button>
            </div>}
            {props.active && !isDying && <span className="effect-separator effect-separator--tall" aria-hidden="true" />}
            <Popover.Root open={effectOpen} onOpenChange={(open) => { setEffectOpen(open); if (open) { setMenuOpen(false); setHpOpen(false); setManagedEffectId(null); } }}>
              <Popover.Trigger asChild><button className={`effect-add${effectOpen ? " is-engaged" : ""}`} title="Add condition or effect" aria-label={`Add condition or effect to ${entity.name}`}><img src="/icons/ui/add.svg" alt="" /></button></Popover.Trigger>
              {effectOpen && <EffectPicker entityName={entity.name} effects={props.effects} activeDefinitionIds={new Set(entity.effects.map((effect) => effect.definitionId))} onAdd={props.onAddEffect} onClose={() => setEffectOpen(false)} />}
            </Popover.Root>
            <div className="effect-badges">
              {isDying && <span className="effect-badge effect-badge--detrimental"><span className="effect-badge__icon" style={{ maskImage: "url('/icons/conditions/Dying.svg')", WebkitMaskImage: "url('/icons/conditions/Dying.svg')" } as CSSProperties} aria-hidden="true" /><strong>Dying</strong><button className="effect-badge__remove" aria-label={`Stabilize ${entity.name}`} title="Stabilize" onClick={props.onStabilize}><span className="effect-badge__remove-icon" aria-hidden="true" /></button></span>}
              {entity.effects.map((effect) => {
                const icon = effect.presentation?.icon ?? effectIconPath(effect.definitionId);
                const badgeIcon = icon ? <span className="effect-badge__icon" style={{ maskImage: `url("${icon}")`, WebkitMaskImage: `url("${icon}")` } as CSSProperties} aria-hidden="true" /> : <i className="effect-badge__fallback" aria-hidden="true" />;
                if (effect.definitionId === "stabilized") return <span key={effect.id} className="effect-badge effect-badge--beneficial">
                  <span className="effect-badge__body" title={effect.description}>
                    {badgeIcon}<strong>{effect.name}</strong>
                  </span>
                </span>;
                return <Popover.Root key={effect.id} open={managedEffectId === effect.id} onOpenChange={(open) => { setManagedEffectId(open ? effect.id : null); if (open) setEffectOpen(false); }}>
                  <span className={`effect-badge effect-badge--${effect.category}`}>
                    <Popover.Trigger asChild><button className="effect-badge__body" title={`${effect.description}${effect.duration !== null ? ` · ${effect.duration} rounds` : " · Indefinite"}`} aria-label={`Manage ${effect.name}`}>
                      {badgeIcon}<strong>{effect.name}</strong>{effect.duration !== null && <small>{effect.duration}r</small>}
                    </button></Popover.Trigger>
                    <button className="effect-badge__remove" aria-label={`Remove ${effect.name}`} onClick={() => props.onRemoveEffect(effect.id)}><span className="effect-badge__remove-icon" aria-hidden="true" /></button>
                  </span>
                  {managedEffectId === effect.id && <EffectManagerPopover effect={effect} onUpdate={(changes) => props.onUpdateEffect(effect.id, changes)} onRemove={() => props.onRemoveEffect(effect.id)} onClose={() => setManagedEffectId(null)} />}
                </Popover.Root>;
              })}
            </div>
            {isDying && <><span className="effect-separator effect-separator--tall" aria-hidden="true" /><div className="death-saves">
              <button className="death-saves__counter death-saves__counter--success" onClick={() => props.onDeathSave("success")} aria-label={`Record death save success for ${entity.name}. ${entity.deathSaveSuccesses} of 3 recorded.`}>
                <img className="death-saves__kind-icon" src="/icons/ui/counter-health.svg" alt="" />
                <span className="death-saves__pips" aria-hidden="true">{[0,1,2].map((index) => <span className="death-saves__pip" key={`success-${index}`}><img src={entity.deathSaveSuccesses > index ? "/icons/ui/counter-check-success.svg" : "/icons/ui/counter-circle-success.svg"} alt="" /></span>)}</span>
              </button>
              <button className="death-saves__counter death-saves__counter--failure" onClick={() => props.onDeathSave("failure")} aria-label={`Record death save failure for ${entity.name}. ${entity.deathSaveFailures} of 3 recorded.`}>
                <span className="death-saves__pips" aria-hidden="true">{[0,1,2].map((index) => <span className="death-saves__pip" key={`failure-${index}`}><img src={entity.deathSaveFailures > index ? "/icons/ui/counter-check-failure.svg" : "/icons/ui/counter-circle-failure.svg"} alt="" /></span>)}</span>
                <img className="death-saves__kind-icon" src="/icons/ui/counter-skull.svg" alt="" />
              </button>
            </div></>}
          </div>
        </>}
      </div>
      <div className={`row-actions${props.staging ? " row-actions--staging" : ""}`}>
        {props.staging && <button className="party-status-button" title={inRoster ? "Remove from roster" : "Add to roster"} aria-label={`${inRoster ? "Remove" : "Add"} ${entity.name} ${inRoster ? "from" : "to"} the roster`} aria-pressed={inRoster} onClick={props.onToggleRoster}>
          <img className="party-status-icon party-status-icon--rest" src={inRoster ? "/icons/ui/party-status.svg" : "/icons/ui/party-status-in.svg"} alt="" />
          <img className="party-status-icon party-status-icon--active" src={inRoster ? "/icons/ui/party-status-out-active.svg" : "/icons/ui/party-status-in-active.svg"} alt="" />
        </button>}
        <button title={entity.type === "Enemy" ? (entity.statBlock ? "View stat block" : "Add stat block") : hasTabbedDetails ? `View ${detailsLabel.toLocaleLowerCase()}` : (entity.notes.length ? "View notes" : "Add note")} className={`entity-notes-button${entity.type === "Enemy" ? (entity.statBlock ? " has-notes" : "") : (entity.notes.length ? " has-notes" : "")}`} aria-label={`${detailsLabel} for ${entity.name}`} onClick={props.onNotes}>
          <img className="entity-notes-button__rest" src={entity.type === "Enemy" ? (entity.statBlock ? "/icons/ui/stat-block-has.svg" : "/icons/ui/stat-block.svg") : (entity.notes.length ? "/icons/ui/notes-has.svg" : "/icons/ui/notes.svg")} alt="" />
          <img className="entity-notes-button__active" src={entity.type === "Enemy" ? "/icons/ui/stat-block-active.svg" : (entity.notes.length ? "/icons/ui/notes-has-active.svg" : "/icons/ui/notes-active.svg")} alt="" />
        </button>
        <DropdownMenu.Root open={menuOpen} onOpenChange={(open) => { setMenuOpen(open); if (open) setHpOpen(false); }}>
          <DropdownMenu.Trigger asChild><button id={`entity-options-${entity.id}`} className={menuOpen ? "is-engaged" : ""} title="More actions" aria-label={`More actions for ${entity.name}`}><img src="/icons/ui/more.svg" alt="" /></button></DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="entity-menu" align="end" sideOffset={4} collisionPadding={8}>
              <DropdownMenu.Label className="entity-menu__label">Options</DropdownMenu.Label>
              <DropdownMenu.Item onSelect={props.onEdit}>Edit entity</DropdownMenu.Item>
              {props.staging ? <DropdownMenu.Item onSelect={props.onToggleRoster}>{inRoster ? "Remove from Roster" : "Add to Roster"}</DropdownMenu.Item> : <>
                {!isDead && <DropdownMenu.Item onSelect={(event) => event.preventDefault()} onClick={openHealthFromMenu}>Adjust health</DropdownMenu.Item>}
                {!isDead && <DropdownMenu.Item onSelect={(event) => event.preventDefault()} onClick={openEffectsFromMenu}>Add effect</DropdownMenu.Item>}
                <DropdownMenu.Item onSelect={props.onNotes}>{detailsLabel}</DropdownMenu.Item>
              </>}
              <DropdownMenu.Item onSelect={props.onDuplicate}>Duplicate</DropdownMenu.Item>
              {(entity.type === "Enemy" || entity.type === "Ally" || entity.type === "Neutral") && <DropdownMenu.Item onSelect={props.onSaveToBestiary}>{entity.sourceRef ? "Update bestiary entry" : "Save to bestiary"}</DropdownMenu.Item>}
              {!props.staging && <>
                <DropdownMenu.Label className="entity-menu__label">Actions</DropdownMenu.Label>
                {!entity.isDead && <DropdownMenu.Item onSelect={props.onDodge}>Dodge</DropdownMenu.Item>}
                {!entity.isDead && <DropdownMenu.Item onSelect={props.onHold}>Ready an action</DropdownMenu.Item>}
                {props.active && !entity.isDead && <DropdownMenu.Item onSelect={props.onDelay}>Delay turn</DropdownMenu.Item>}
                {!entity.isDead && <DropdownMenu.Item onSelect={props.onReaction}>{entity.reactionUsed ? "Restore reaction" : "Mark reaction used"}</DropdownMenu.Item>}
                {entity.isDying && <DropdownMenu.Item onSelect={props.onStabilize}>Stabilize</DropdownMenu.Item>}
                {entity.isDead && <DropdownMenu.Item onSelect={props.onRevive}>Revive</DropdownMenu.Item>}
              </>}
              <DropdownMenu.Label className="entity-menu__label entity-menu__danger">Danger zone</DropdownMenu.Label>
              <DropdownMenu.Item className="entity-menu__remove" onSelect={props.onRemove}>Remove entity</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  </article>;
}
