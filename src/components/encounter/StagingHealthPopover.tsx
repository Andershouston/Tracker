import { useMemo, useState } from "react";
import { Popover } from "radix-ui";
import type { EncounterEntity } from "../../domain/types";

interface StagingHealthPopoverProps {
  entity: EncounterEntity;
  onCommit: (currentHP: number | undefined, maxHP: number | undefined) => void;
  onClose: () => void;
}

function integer(value: string): number | undefined {
  return /^-?\d+$/.test(value.trim()) ? Number(value) : undefined;
}

export function StagingHealthPopover({ entity, onCommit, onClose }: StagingHealthPopoverProps) {
  const [current, setCurrent] = useState("");
  const [maximum, setMaximum] = useState("");

  const state = useMemo(() => {
    const hasCurrent = current.trim() !== "";
    const hasMaximum = maximum.trim() !== "";
    if (!hasCurrent && !hasMaximum) return { valid: false, error: "Enter Current HP or Maximum HP." };
    const currentValue = hasCurrent ? integer(current) : undefined;
    const maximumValue = hasMaximum ? integer(maximum) : undefined;
    if (hasCurrent && currentValue === undefined) return { valid: false, error: "Current HP must be a whole number." };
    if (hasMaximum && maximumValue === undefined) return { valid: false, error: "Maximum HP must be a whole number." };
    if (maximumValue !== undefined && maximumValue < 0) return { valid: false, error: "Maximum HP cannot be below zero." };
    const resultingMaximum = maximumValue ?? entity.maxHP;
    if (currentValue !== undefined && currentValue > resultingMaximum) return { valid: false, error: "Current HP cannot exceed Maximum HP." };
    return { valid: true, currentValue, maximumValue, error: "" };
  }, [current, maximum, entity.maxHP]);

  return <Popover.Portal><Popover.Content asChild align="end" sideOffset={4} collisionPadding={8}>
  <form
    className="staging-hp-popover"
    aria-label={`Edit hit points for ${entity.name}`}
    onSubmit={(event) => {
      event.preventDefault();
      if (!state.valid) return;
      onCommit(state.currentValue, state.maximumValue);
    }}
  >
    <label><img src="/icons/ui/heart.svg" alt="" /><input autoFocus inputMode="numeric" aria-label="Current HP" aria-invalid={current.trim() !== "" && !state.valid && state.error.startsWith("Current")} placeholder="Current" value={current} onInput={(event) => setCurrent(event.currentTarget.value)} /></label>
    <label><img src="/icons/ui/heart.svg" alt="" /><input inputMode="numeric" aria-label="Maximum HP" aria-invalid={maximum.trim() !== "" && !state.valid && state.error.startsWith("Maximum")} placeholder="Maximum" value={maximum} onInput={(event) => setMaximum(event.currentTarget.value)} /></label>
    <button type="submit" disabled={!state.valid}>Set</button>
    <span className="sr-only" role="status">{state.error}</span>
    {(current.trim() !== "" || maximum.trim() !== "") && !state.valid && <span className="staging-hp-popover__error" aria-hidden="true">{state.error}</span>}
  </form>
  </Popover.Content></Popover.Portal>;
}
