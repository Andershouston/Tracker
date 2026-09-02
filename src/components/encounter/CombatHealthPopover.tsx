import { useState } from "react";
import { Popover } from "radix-ui";
import type { EncounterEntity } from "../../domain/types";

type HealthAction = "damage" | "heal" | "temp" | "set";

export function healthActionForKey(key: string): Exclude<HealthAction, "set"> | null {
  const normalized = key.toLocaleLowerCase();
  if (normalized === "enter" || normalized === "d") return "damage";
  if (normalized === "h") return "heal";
  if (normalized === "t") return "temp";
  return null;
}

interface CombatHealthPopoverProps {
  entity: EncounterEntity;
  onAction: (action: HealthAction, amount: number) => void;
  onClose: () => void;
}

export function CombatHealthPopover({ entity, onAction, onClose }: CombatHealthPopoverProps) {
  const [value, setValue] = useState("");
  const amount = /^\d+$/.test(value) ? Number(value) : null;
  const valid = amount !== null && Number.isSafeInteger(amount);
  const canChange = valid && amount > 0;
  const canSet = valid && amount <= entity.maxHP;
  const error = value && !valid
    ? "Enter a whole number."
    : valid && amount > entity.maxHP
      ? `Set cannot exceed ${entity.maxHP} maximum HP.`
      : "";

  const act = (action: HealthAction) => {
    if (amount === null) return;
    onAction(action, amount);
    onClose();
  };

  return <Popover.Portal><Popover.Content className="combat-hp-popover" align="end" sideOffset={4} collisionPadding={8} aria-label={`Adjust health for ${entity.name}`}>
    <label className="combat-hp-popover__input">
      <img src="/icons/ui/health-value.svg" alt="" />
      <span className="sr-only">Amount</span>
      <input
        autoFocus
        inputMode="numeric"
        type="number"
        min="0"
        step="1"
        placeholder="0"
        value={value}
        aria-invalid={Boolean(error)}
        onInput={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          const action = healthActionForKey(event.key);
          if (!action) return;
          event.preventDefault();
          if ((action === "temp" && valid) || (action !== "temp" && canChange)) act(action);
        }}
      />
    </label>
    <button type="button" className="combat-hp-popover__action combat-hp-popover__action--damage" disabled={!canChange} title="Apply damage (D or Enter)" aria-label={`Apply ${amount ?? 0} damage`} onClick={() => act("damage")}><img src="/icons/ui/health-damage.svg" alt="" /></button>
    <button type="button" className="combat-hp-popover__action combat-hp-popover__action--heal" disabled={!canChange} title="Heal (H)" aria-label={`Heal ${amount ?? 0} hit points`} onClick={() => act("heal")}><img src="/icons/ui/health-heal.svg" alt="" /></button>
    <button type="button" className="combat-hp-popover__action combat-hp-popover__action--temp" disabled={!valid} title="Set temporary HP (T)" aria-label={`Set temporary HP to ${amount ?? 0}`} onClick={() => act("temp")}><img src="/icons/ui/health-temp.svg" alt="" /></button>
    <button type="button" className="combat-hp-popover__set" disabled={!canSet} onClick={() => act("set")}>Set</button>
    {error && <span className="combat-hp-popover__error" role="status">{error}</span>}
  </Popover.Content></Popover.Portal>;
}
