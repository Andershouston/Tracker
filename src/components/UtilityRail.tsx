import type { AppPanel } from "../domain/types";

const isReferencePanel = (panel: AppPanel | null) => panel === "reference" || panel === "conditions" || Boolean(panel?.startsWith("reference-"));

function RailButton({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick: () => void }) {
  return <button type="button" className={`utility-rail__item${active ? " is-active" : ""}`} aria-label={label} aria-pressed={active} title={label} onClick={onClick}><img src={icon} alt="" /></button>;
}

export function UtilityRail({ panel, lastPanel, onSelect }: { panel: AppPanel | null; lastPanel: AppPanel; onSelect: (panel: AppPanel | null) => void }) {
  const select = (next: AppPanel) => onSelect(panel === next ? null : next);
  const reopenPanel = isReferencePanel(lastPanel) ? "reference" : lastPanel;
  return <nav className="utility-rail" aria-label="Encounter utilities">
    <RailButton label={panel ? "Close utility panel" : "Reopen utility panel"} icon="/icons/ui/rail-panel.svg" onClick={() => onSelect(panel ? null : reopenPanel)} />
    <span className="utility-rail__divider" />
    <RailButton label="Combat log" icon="/icons/ui/rail-log.svg" active={panel === "log"} onClick={() => select("log")} />
    <RailButton label="Session notes" icon="/icons/ui/rail-notes.svg" active={panel === "notes"} onClick={() => select("notes")} />
    <span className="utility-rail__divider" />
    <RailButton label="Rules reference" icon="/icons/ui/rail-movement.svg" active={isReferencePanel(panel)} onClick={() => onSelect(isReferencePanel(panel) ? null : "reference")} />
  </nav>;
}
