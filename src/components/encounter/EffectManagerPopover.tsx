import { useState } from "react";
import { Popover } from "radix-ui";
import type { ActiveEffect, EffectTick } from "../../domain/types";
import { Button } from "../shared/Button";
import { SelectField } from "../shared/SelectField";

interface EffectManagerPopoverProps {
  effect: ActiveEffect;
  onUpdate: (changes: Partial<ActiveEffect>) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function EffectManagerPopover({ effect, onUpdate, onRemove, onClose }: EffectManagerPopoverProps) {
  const [duration, setDuration] = useState(effect.duration === null ? "" : String(effect.duration));

  const commitDuration = (next: string) => {
    setDuration(next);
    onUpdate({ duration: next === "" ? null : Math.max(1, Math.floor(Number(next) || 1)) });
  };

  return <Popover.Portal><Popover.Content className="effect-manager-popover" align="start" sideOffset={6} collisionPadding={8} onEscapeKeyDown={onClose}>
    <div className="effect-manager__header"><div><strong>{effect.name}</strong><small>{effect.description}</small></div><button type="button" aria-label="Close effect settings" onClick={onClose}><img src="/icons/ui/close-small.svg" alt="" /></button></div>
    <div className="effect-manager__controls">
      <label className="field"><span>Remaining rounds</span><div className="effect-manager__stepper"><button type="button" aria-label="Decrease duration" disabled={duration === "" || Number(duration) <= 1} onClick={() => commitDuration(String(Math.max(1, Number(duration) - 1)))}>−</button><input inputMode="numeric" min="1" value={duration} placeholder="∞" aria-label="Remaining rounds" onInput={(event) => setDuration(event.currentTarget.value)} onBlur={() => commitDuration(duration)} onKeyDown={(event) => { if (event.key === "Enter") commitDuration(duration); }} /><button type="button" aria-label="Increase duration" onClick={() => commitDuration(String(duration === "" ? 1 : Number(duration) + 1))}>+</button></div></label>
      <label className="field"><span>Ticks at</span><SelectField ariaLabel="Effect duration timing" value={effect.tickAt} onValueChange={(tickAt: EffectTick) => onUpdate({ tickAt })} options={[{ value: "turn-start", label: "Turn start" }, { value: "turn-end", label: "Turn end" }, { value: "manual", label: "Manual" }]} /></label>
    </div>
    <div className="effect-manager__actions"><Button compact tone="danger" onClick={() => { onRemove(); onClose(); }}>Remove effect</Button></div>
  </Popover.Content></Popover.Portal>;
}
