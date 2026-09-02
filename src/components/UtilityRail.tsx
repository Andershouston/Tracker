import type { AppPanel } from "../domain/types";

const referenceItems: { panel: AppPanel; label: string; icon: string }[] = [
  { panel: "reference-movement", label: "Movement reference", icon: "/icons/ui/rail-movement.svg" },
  { panel: "reference-actions", label: "Combat actions reference", icon: "/icons/ui/rail-actions.svg" },
  { panel: "reference-bonus", label: "Bonus actions reference", icon: "/icons/ui/rail-bonus.svg" },
  { panel: "reference-reactions", label: "Reactions reference", icon: "/icons/ui/rail-reactions.svg" },
];

function RailButton({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick: () => void }) {
  return <button type="button" className={`utility-rail__item${active ? " is-active" : ""}`} aria-label={label} aria-pressed={active} title={label} onClick={onClick}><img src={icon} alt="" /></button>;
}

export function UtilityRail({ panel, lastPanel, onSelect }: { panel: AppPanel | null; lastPanel: AppPanel; onSelect: (panel: AppPanel | null) => void }) {
  const select = (next: AppPanel) => onSelect(panel === next ? null : next);
  return <nav className="utility-rail" aria-label="Encounter utilities">
    <RailButton label={panel ? "Close utility panel" : "Reopen utility panel"} icon="/icons/ui/rail-panel.svg" onClick={() => onSelect(panel ? null : lastPanel)} />
    <span className="utility-rail__divider" />
    <RailButton label="Combat log" icon="/icons/ui/rail-log.svg" active={panel === "log"} onClick={() => select("log")} />
    <RailButton label="Session notes" icon="/icons/ui/rail-notes.svg" active={panel === "notes"} onClick={() => select("notes")} />
    <RailButton label="Conditions" icon="/icons/ui/rail-conditions.svg" active={panel === "conditions"} onClick={() => select("conditions")} />
    <span className="utility-rail__divider" />
    {referenceItems.map((item) => <RailButton key={item.panel} {...item} active={panel === item.panel} onClick={() => select(item.panel)} />)}
  </nav>;
}
