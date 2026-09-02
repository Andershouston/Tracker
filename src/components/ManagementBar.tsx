import type { Encounter, EncounterEntity } from "../domain/types";
import { DropdownMenu } from "radix-ui";
import { Button } from "./shared/Button";

export function ManagementBar({ encounter, combatEditing, onRoster, onSort, onRollAll, onRollType, onBegin, onPrevious, onNext, onEditMode, onResetInitiative }: {
  encounter: Encounter;
  combatEditing: boolean;
  onRoster: () => void;
  onSort: () => void;
  onRollAll: () => void;
  onRollType: (type: EncounterEntity["type"]) => void;
  onBegin: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onEditMode: () => void;
  onResetInitiative: () => void;
}) {
  const active = encounter.mode === "active";
  const hasEntities = encounter.entities.length > 0;
  const displayedRound = active ? encounter.round : 0;
  const rollMenu = <DropdownMenu.Root><DropdownMenu.Trigger className="button button--quiet button--compact management-action management-action--roll" disabled={!hasEntities}><img src="/icons/ui/roll.svg" alt="" /><span>Roll</span><img className="management-action__chevron" src="/icons/ui/chevron-down.svg" alt="" /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="roll-menu__content" align="end" side="top" sideOffset={8} collisionPadding={8}><DropdownMenu.Item onSelect={onRollAll}>All entities</DropdownMenu.Item><DropdownMenu.Item onSelect={() => onRollType("PC")}>Players</DropdownMenu.Item><DropdownMenu.Item onSelect={() => onRollType("Enemy")}>Enemies</DropdownMenu.Item><DropdownMenu.Item onSelect={() => onRollType("Ally")}>Allies</DropdownMenu.Item><DropdownMenu.Item onSelect={() => onRollType("Neutral")}>NPCs</DropdownMenu.Item><DropdownMenu.Separator className="roll-menu__separator" /><DropdownMenu.Item onSelect={onResetInitiative}>Reset initiative</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
  const tools = <div className="management-bar__tools"><Button compact tone="quiet" className="management-action" onClick={onSort} disabled={!hasEntities}><img src="/icons/ui/sort.svg" alt="" /><span>Sort</span></Button>{rollMenu}</div>;
  const state = <div className={`round-readout${combatEditing ? " round-readout--editing" : ""}`}><span>Round</span><strong>{displayedRound}</strong></div>;
  return <footer className="management-bar">
    <div className="management-bar__left">{active && !combatEditing ? <>{state}<span className="management-separator" /><div className="management-bar__turn-controls"><Button compact className="management-turn" onClick={onPrevious}><img src="/icons/ui/previous.svg" alt="" />Prev</Button><Button compact className="management-turn" onClick={onNext}>Next<img src="/icons/ui/next.svg" alt="" /></Button></div></> : <><Button compact className="management-action management-action--roster" onClick={onRoster}><img src="/icons/ui/roster.svg" alt="" /><span>Roster</span></Button><span className="management-separator" />{state}</>}</div>
    <div className="management-bar__right">{tools}<span className="management-separator" />{active ? combatEditing ? <Button compact className="management-action management-action--return" onClick={onEditMode}><img src="/icons/ui/combat-return.svg" alt="" />Return to combat</Button> : <Button compact className="management-action management-action--edit" onClick={onEditMode}><img src="/icons/ui/edit-entities.svg" alt="" />Edit entities</Button> : <Button compact tone="primary" className="management-action management-action--begin" disabled={!hasEntities || encounter.entities.some((entity) => !entity.name.trim() || entity.maxHP <= 0)} onClick={onBegin}><img src="/icons/ui/combat.svg" alt="" />Begin combat</Button>}</div>
  </footer>;
}
