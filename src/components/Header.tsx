import type { AppPanel, Encounter } from "../domain/types";
import { DropdownMenu } from "radix-ui";
import { Button } from "./shared/Button";

export function Header({ encounter, saveStatus, onRename, onNew, onLoad, onSave, onPanel, onExport, onExportAll, onImport, onDelete, onShortcuts, onEndCombat, onRemoveDead, onClearEffects, onResetHP }: {
  encounter: Encounter;
  saveStatus: "saved" | "saving" | "error";
  onRename: () => void;
  onNew: () => void;
  onLoad: () => void;
  onSave: () => void;
  onPanel: (panel: AppPanel) => void;
  onExport: () => void;
  onExportAll: () => void;
  onImport: () => void;
  onDelete: () => void;
  onShortcuts: () => void;
  onEndCombat: () => void;
  onRemoveDead: () => void;
  onClearEffects: () => void;
  onResetHP: () => void;
}) {
  const rulesetYear = encounter.rulesetId.includes("2014") ? "2014" : "2024";
  const saveLabel = saveStatus === "saving" ? "Saving encounter" : saveStatus === "error" ? "Save failed" : "Save encounter";

  return <header className="app-header">
    <button className="encounter-title" title={`${encounter.name} · ${rulesetYear} rules · Rename encounter`} onClick={onRename}><strong>{encounter.name}</strong><span className="encounter-title__edit" aria-hidden="true"><img src="/icons/ui/edit.svg" alt="" /></span></button>
    <span className="header-spacer" />
    <span className={`save-state sr-only save-state--${saveStatus}`} aria-live="polite">{saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Saved"}</span>
    <nav className="header-actions" aria-label="Application">
      <div className="header-action-group header-file-actions">
        <Button compact tone="quiet" aria-label="New encounter" onClick={onNew}><img className="button__icon" src="/icons/ui/new.svg" alt="" /><span>New</span></Button>
        <Button compact tone="quiet" aria-label="Load encounter" onClick={onLoad}><img className="button__icon" src="/icons/ui/load.svg" alt="" /><span>Load</span></Button>
        <Button compact tone="quiet" aria-label={saveLabel} onClick={onSave}><img className="button__icon" src="/icons/ui/save.svg" alt="" /><span>Save</span></Button>
      </div>
      <span className="header-separator" aria-hidden="true" />
      <div className="header-action-group header-control-actions">
        <Button compact tone="quiet" aria-label="Open library" onClick={() => onPanel("library")}><img className="button__icon" src="/icons/ui/library.svg" alt="" /><span>Library</span></Button>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild><button type="button" className="header-menu__trigger">DM <img src="/icons/ui/chevron-down.svg" alt="" /></button></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="header-menu__content" align="end" sideOffset={12} collisionPadding={8}>
            <DropdownMenu.Label className="header-menu__label mobile-menu-label">File</DropdownMenu.Label>
            <DropdownMenu.Item className="mobile-menu-action" onSelect={onNew}>New encounter</DropdownMenu.Item>
            <DropdownMenu.Item className="mobile-menu-action" onSelect={onLoad}>Load encounter</DropdownMenu.Item>
            <DropdownMenu.Item className="mobile-menu-action" onSelect={onSave}>Save locally</DropdownMenu.Item>
            <DropdownMenu.Label className="header-menu__label">Panels</DropdownMenu.Label>
            <DropdownMenu.Item onSelect={() => onPanel("roster")}>Party roster</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onShortcuts}>Keyboard shortcuts</DropdownMenu.Item>
            <DropdownMenu.Label className="header-menu__label">Encounter</DropdownMenu.Label>
            {encounter.mode === "active" && <DropdownMenu.Item onSelect={onEndCombat}>End combat</DropdownMenu.Item>}
            <DropdownMenu.Item onSelect={onExport}>Export encounter</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onImport}>Import encounter or backup</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onExportAll}>Export all data</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onRemoveDead}>Remove all dead</DropdownMenu.Item>
            <DropdownMenu.Label className="header-menu__label">Danger zone</DropdownMenu.Label>
            <DropdownMenu.Item className="danger-link" onSelect={onClearEffects}>Clear all effects</DropdownMenu.Item>
            <DropdownMenu.Item className="danger-link" onSelect={onResetHP}>Reset all HP</DropdownMenu.Item>
            <DropdownMenu.Item className="danger-link" onSelect={onDelete}>Delete encounter</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </nav>
  </header>;
}
