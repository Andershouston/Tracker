import { useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import type { ContentPackDocument } from "../domain/types";
import { validateContentPack } from "../content/validation";
import { Button } from "./shared/Button";
import { EmptyState } from "./shared/EmptyState";

const starterPack: ContentPackDocument = {
  schemaVersion: 1,
  pack: {
    id: "my-content-pack",
    name: "My Content Pack",
    sourceVersion: "1.0.0",
    rulesetCompatibility: ["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"],
    requiredAttribution: [],
  },
  content: { conditions: [], creatures: [], spells: [] },
};

function downloadPack(pack: ContentPackDocument) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${pack.pack.id}-${pack.pack.sourceVersion}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function PackCard({ pack, onEdit, onRemove }: { pack: ContentPackDocument; onEdit: () => void; onRemove: () => void }) {
  const counts = [
    [pack.content.conditions.length, "effect", "effects"],
    [pack.content.creatures.length, "creature", "creatures"],
    [pack.content.spells.length, "spell", "spells"],
  ] as const;

  return <article className="pack-card">
    <header className="pack-card__header">
      <span className="pack-card__icon" aria-hidden="true"><img src="/icons/ui/library.svg" alt="" /></span>
      <div className="pack-card__identity"><strong>{pack.pack.name}</strong><small>{pack.pack.id} · {pack.pack.sourceVersion}</small></div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="pack-card__options" aria-label={`More options for ${pack.pack.name}`}><img src="/icons/ui/more.svg" alt="" /></DropdownMenu.Trigger>
        <DropdownMenu.Portal><DropdownMenu.Content className="pack-menu" align="end" sideOffset={6} collisionPadding={8}>
          <DropdownMenu.Item onSelect={() => downloadPack(pack)}>Export pack</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onEdit}>Edit JSON</DropdownMenu.Item>
          <DropdownMenu.Item className="danger-link" onSelect={onRemove}>Uninstall pack</DropdownMenu.Item>
        </DropdownMenu.Content></DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
    <div className="pack-card__details">
      <div className="pack-stats" aria-label="Pack content">{counts.map(([count, singular, plural]) => <span key={singular}>{count} {count === 1 ? singular : plural}</span>)}</div>
      <div className="ruleset-tags" aria-label="Ruleset compatibility">{pack.pack.rulesetCompatibility.map((id) => <span key={id}>{id.includes("2014") ? "2014" : "2024"}</span>)}</div>
      {pack.pack.requiredAttribution.length > 0 && <div className="attribution"><span className="sr-only">Required attribution</span>{pack.pack.requiredAttribution.map((item, index) => item.url ? <a key={`${index}-${item.text}`} href={item.url} target="_blank" rel="noreferrer">{item.text}</a> : <span key={`${index}-${item.text}`}>{item.text}</span>)}</div>}
    </div>
  </article>;
}

export function ContentLibrary({ packs, onInstall, onRemove }: { packs: ContentPackDocument[]; onInstall: (pack: ContentPackDocument) => void; onRemove: (packId: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [json, setJson] = useState(JSON.stringify(starterPack, null, 2));
  const [errors, setErrors] = useState<string[]>([]);

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      const result = validateContentPack(value);
      if (!result.valid || !result.document) setErrors(result.errors);
      else { onInstall(result.document); setErrors([]); }
    } catch { setErrors(["The selected file is not valid JSON."]); }
  };

  const saveJson = () => {
    try {
      const result = validateContentPack(JSON.parse(json));
      if (!result.valid || !result.document) return setErrors(result.errors);
      onInstall(result.document);
      setErrors([]);
      setEditing(false);
    } catch { setErrors(["The editor contains invalid JSON."]); }
  };

  return <div className="library-panel">
    <div className="library-heading"><strong>Content library</strong></div>
    <div className="library-actions"><Button compact onClick={() => fileInput.current?.click()}>Import</Button><Button compact tone="primary" onClick={() => { setJson(JSON.stringify(starterPack, null, 2)); setEditing(true); }}>New pack</Button></div>
    <input ref={fileInput} hidden type="file" accept="application/json,.json" onChange={(event) => importFile(event.currentTarget.files?.[0])} />
    {errors.length > 0 && <div className="validation-errors"><strong>Could not install pack</strong>{errors.map((error, index) => <span key={`${index}-${error}`}>{error}</span>)}</div>}
    {editing && <div className="json-editor"><textarea spellCheck={false} value={json} onInput={(event) => setJson(event.currentTarget.value)} /><div><Button compact tone="quiet" onClick={() => setEditing(false)}>Cancel</Button><Button compact tone="primary" onClick={saveJson}>Validate and install</Button></div></div>}
    {!packs.length ? <EmptyState title="No content packs installed">Import a JSON pack or create one in the editor. Built-in effects remain available separately.</EmptyState> : <div className="pack-list">{packs.map((pack) => <PackCard key={pack.pack.id} pack={pack} onEdit={() => { setJson(JSON.stringify(pack, null, 2)); setEditing(true); }} onRemove={() => onRemove(pack.pack.id)} />)}</div>}
  </div>;
}
