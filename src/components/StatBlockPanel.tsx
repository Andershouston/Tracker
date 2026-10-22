import { useEffect, useRef, useState, type ReactNode } from "react";
import { uid } from "../domain/factories";
import { parseMonsterStatBlock, statBlockAsJson } from "../domain/stat-block";
import type { AbilityKey, EncounterEntity, MonsterStatBlock } from "../domain/types";
import { Button } from "./shared/Button";

const ABILITIES: Array<{ key: AbilityKey; label: string }> = [
  { key: "str", label: "STR" }, { key: "dex", label: "DEX" }, { key: "con", label: "CON" },
  { key: "int", label: "INT" }, { key: "wis", label: "WIS" }, { key: "cha", label: "CHA" },
];

const EDITABLE_SECTIONS = [
  { key: "traits", title: "Traits" },
  { key: "actions", title: "Actions" },
  { key: "bonusActions", title: "Bonus Actions" },
  { key: "reactions", title: "Reactions" },
  { key: "legendaryActions", title: "Legendary Actions" },
  { key: "mythicActions", title: "Mythic Actions" },
] as const;
type EditableSectionKey = typeof EDITABLE_SECTIONS[number]["key"];
type SectionDrafts = Record<EditableSectionKey, string>;
type DetailDraft = { id: string; label: string; value: string };
const DETAIL_LABELS = [
  "Saving Throws", "Skills", "Gear", "Damage Vulnerabilities", "Damage Resistances",
  "Damage Immunities", "Condition Immunities", "Senses", "Languages", "Challenge",
  "Proficiency Bonus", "Habitat", "Treasure", "Source",
];
const sectionsForEntity = (entity: EncounterEntity) => entity.type === "Ally"
  ? EDITABLE_SECTIONS.filter(({ key }) => key !== "legendaryActions" && key !== "mythicActions")
  : EDITABLE_SECTIONS;

const STARTER = `Ash Raider
Small Fey, Neutral
AC 14 Initiative +2 (12)
HP 18 (4d6 + 4)
Speed 30 ft.
STR 10 +0 +0 DEX 15 +2 +2 CON 12 +1 +1 INT 9 -1 -1 WIS 11 +0 +0 CHA 8 -1 -1
Skills Stealth +4
Senses Darkvision 60 ft., Passive Perception 10
Languages Common
CR 1/2 (XP 100; PB +2)
Actions
Ash Blade. Melee Attack Roll: +4, reach 5 ft. Hit: 6 (1d8 + 2) Slashing damage.
Bonus Actions
Fade. The raider takes the Hide action.`;

const abilityModifier = (score: number) => {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : String(modifier);
};
const leadingNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const hitPointsLabel = (maximum: number, imported?: string) => {
  const formula = imported?.match(/^\s*\d+\s*(.*)$/)?.[1]?.trim();
  return formula ? `${maximum} ${formula}` : String(maximum);
};
const sectionText = (section?: MonsterStatBlock["sections"][number]) => section?.entries
  .map((entry) => entry.name ? `${entry.name}. ${entry.description}` : entry.description)
  .join("\n") ?? "";
const draftsFromBlock = (block?: MonsterStatBlock): SectionDrafts => Object.fromEntries(EDITABLE_SECTIONS.map(({ key, title }) => [key, sectionText(block?.sections.find((section) => section.title.toLocaleLowerCase() === title.toLocaleLowerCase()))])) as SectionDrafts;
const sectionEntries = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
  const match = line.match(/^([^.!?]{1,80})\.\s+(.+)$/);
  return match ? { name: match[1].trim(), description: match[2].trim() } : { name: "", description: line };
});
const populatedLineCount = (value: string) => value.split(/\r?\n/).filter((line) => line.trim()).length;
const detailDraftsFromBlock = (block?: MonsterStatBlock): DetailDraft[] => block?.details.map((detail) => ({ ...detail, id: uid("stat-detail") })) ?? [];
const cleanDetails = (details: DetailDraft[]) => details
  .map(({ label, value }) => ({ label: label.trim(), value: value.trim() }))
  .filter(({ label, value }) => label && value);

function ImportEditor({ block, entity, onSave, onCancel, onRemove }: {
  block?: MonsterStatBlock;
  entity: EncounterEntity;
  onSave: (block: MonsterStatBlock, armorClass: number, maxHP: number) => void;
  onCancel?: () => void;
  onRemove?: () => void;
}) {
  const editableSections = sectionsForEntity(entity);
  const [source, setSource] = useState(() => block ? statBlockAsJson(block) : "");
  const [error, setError] = useState("");
  const [armorClass, setArmorClass] = useState(String(entity.armorClass));
  const [maxHP, setMaxHP] = useState(String(entity.maxHP));
  const [speed, setSpeed] = useState(block?.speed ?? "");
  const [abilityScores, setAbilityScores] = useState<Record<AbilityKey, string>>(() => Object.fromEntries(ABILITIES.map(({ key }) => [key, String(block?.abilities?.[key]?.score ?? 10)])) as Record<AbilityKey, string>);
  const [detailDrafts, setDetailDrafts] = useState<DetailDraft[]>(() => detailDraftsFromBlock(block));
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(block?.speed || block?.details.length));
  const [sectionDrafts, setSectionDrafts] = useState<SectionDrafts>(() => draftsFromBlock(block));
  const [sectionDirty, setSectionDirty] = useState<Record<EditableSectionKey, boolean>>(() => Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, false])) as Record<EditableSectionKey, boolean>);
  const [openSections, setOpenSections] = useState<Record<EditableSectionKey, boolean>>(() => Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, Boolean(draftsFromBlock(block)[key])])) as Record<EditableSectionKey, boolean>);
  const [importOpen, setImportOpen] = useState(false);
  const [structuredDirty, setStructuredDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setSource(block ? statBlockAsJson(block) : "");
    setArmorClass(String(entity.armorClass));
    setMaxHP(String(entity.maxHP));
    setSpeed(block?.speed ?? "");
    setAbilityScores(Object.fromEntries(ABILITIES.map(({ key }) => [key, String(block?.abilities?.[key]?.score ?? 10)])) as Record<AbilityKey, string>);
    setDetailDrafts(detailDraftsFromBlock(block));
    setDetailsDirty(false);
    setDetailsOpen(Boolean(block?.speed || block?.details.length));
    setSectionDrafts(draftsFromBlock(block));
    setSectionDirty(Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, false])) as Record<EditableSectionKey, boolean>);
    setOpenSections(Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, Boolean(draftsFromBlock(block)[key])])) as Record<EditableSectionKey, boolean>);
    setStructuredDirty(false);
    setError("");
  }, [block, entity.id, entity.armorClass, entity.maxHP]);
  const save = () => {
    try {
      const parsed = source.trim() ? parseMonsterStatBlock(source) : { name: entity.name, details: [], sections: [] };
      const nextArmorClass = structuredDirty ? leadingNumber(armorClass, entity.armorClass) : leadingNumber(parsed.armorClass, entity.armorClass);
      const nextMaxHP = structuredDirty ? leadingNumber(maxHP, entity.maxHP) : leadingNumber(parsed.hitPoints, entity.maxHP);
      const abilities = Object.fromEntries(ABILITIES.map(({ key }) => {
        const imported = parsed.abilities?.[key];
        const score = structuredDirty ? leadingNumber(abilityScores[key], 10) : imported?.score ?? leadingNumber(abilityScores[key], 10);
        return [key, { score, modifier: abilityModifier(score), save: imported?.save }];
      })) as MonsterStatBlock["abilities"];
      const editableTitles = new Set(EDITABLE_SECTIONS.map(({ title }) => title.toLocaleLowerCase()));
      const sections = [
        ...editableSections.flatMap(({ key, title }) => {
          const draftEntries = sectionEntries(sectionDrafts[key]);
          const importedEntries = parsed.sections.find((section) => section.title.toLocaleLowerCase() === title.toLocaleLowerCase())?.entries ?? [];
          const entries = sectionDirty[key] || draftEntries.length ? draftEntries : importedEntries;
          return entries.length ? [{ title, entries }] : [];
        }),
        ...parsed.sections.filter((section) => !editableTitles.has(section.title.toLocaleLowerCase())),
      ];
      const structuredDetails = cleanDetails(detailDrafts);
      const details = detailsDirty || structuredDetails.length ? structuredDetails : parsed.details;
      const nextSpeed = detailsDirty || speed.trim() ? speed.trim() || undefined : parsed.speed;
      onSave({ ...parsed, name: parsed.name || entity.name, armorClass: String(nextArmorClass), hitPoints: hitPointsLabel(nextMaxHP, parsed.hitPoints), speed: nextSpeed, abilities, details, sections }, nextArmorClass, nextMaxHP);
      setError("");
    }
    catch (problem) { setError(problem instanceof Error ? problem.message : "The stat block could not be read."); }
  };
  const populateFromSource = (nextSource = source) => {
    try {
      const parsed = parseMonsterStatBlock(nextSource);
      setArmorClass(String(leadingNumber(parsed.armorClass, entity.armorClass)));
      setMaxHP(String(leadingNumber(parsed.hitPoints, entity.maxHP)));
      setSpeed(parsed.speed ?? "");
      setAbilityScores(Object.fromEntries(ABILITIES.map(({ key }) => [key, String(parsed.abilities?.[key]?.score ?? 10)])) as Record<AbilityKey, string>);
      setDetailDrafts(detailDraftsFromBlock(parsed));
      setDetailsDirty(false);
      setDetailsOpen(Boolean(parsed.speed || parsed.details.length));
      const drafts = draftsFromBlock(parsed);
      setSectionDrafts(drafts);
      setSectionDirty(Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, false])) as Record<EditableSectionKey, boolean>);
      setOpenSections(Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, Boolean(drafts[key])])) as Record<EditableSectionKey, boolean>);
      setStructuredDirty(false);
      setError("");
    }
    catch (problem) { setError(problem instanceof Error ? problem.message : "The stat block could not be read."); }
  };
  const loadFile = async (file?: File) => {
    if (!file) return;
    try { const text = await file.text(); setSource(text); populateFromSource(text); }
    catch { setError("That file could not be opened. Try a JSON or plain-text file."); }
  };
  return <div className="stat-block-importer">
    <div className="stat-block-editor-scroll">
      {!block && <div className="stat-block-importer__intro"><strong>Build this creature’s stat block</strong><p>Enter each part below, or import an existing stat block to populate the fields.</p></div>}
      <div className="stat-block-required">
        <label><span>Armor Class</span><input autoFocus={!block} type="number" min="0" step="1" value={armorClass} onFocus={(event) => event.currentTarget.select()} onInput={(event) => { setArmorClass(event.currentTarget.value); setStructuredDirty(true); }} /></label>
        <label><span>Maximum HP</span><input type="number" min="0" step="1" value={maxHP} onFocus={(event) => event.currentTarget.select()} onInput={(event) => { setMaxHP(event.currentTarget.value); setStructuredDirty(true); }} /></label>
      </div>
      <fieldset className="stat-block-ability-fields"><legend>Ability scores</legend><div>{ABILITIES.map(({ key, label }) => <label key={key}><span>{label}</span><input type="number" min="0" max="30" step="1" value={abilityScores[key]} onFocus={(event) => event.currentTarget.select()} onInput={(event) => { const value = event.currentTarget.value; setAbilityScores((current) => ({ ...current, [key]: value })); setStructuredDirty(true); }} /></label>)}</div></fieldset>
      <details className="stat-block-details-editor" open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
        <summary><span>Details</span><small>{detailDrafts.length ? `${detailDrafts.length} ${detailDrafts.length === 1 ? "entry" : "entries"}` : speed.trim() ? "Speed only" : "Empty"}</small><img src={detailsOpen ? "/icons/reference/chevron-expanded.svg" : "/icons/reference/chevron.svg"} alt="" /></summary>
        <div className="stat-block-details-editor__body">
          <label className="stat-block-speed"><span>Speed</span><input value={speed} onFocus={(event) => event.currentTarget.select()} onInput={(event) => { setSpeed(event.currentTarget.value); setDetailsDirty(true); }} placeholder="30 ft., climb 20 ft." /></label>
          <div className="stat-block-detail-rows">
            {detailDrafts.map((detail, index) => <div className="stat-block-detail-row" key={detail.id}>
              <label><span className="sr-only">Detail label</span><input list="stat-block-detail-labels" value={detail.label} onFocus={(event) => event.currentTarget.select()} onInput={(event) => { const label = event.currentTarget.value; setDetailDrafts((current) => current.map((candidate) => candidate.id === detail.id ? { ...candidate, label } : candidate)); setDetailsDirty(true); }} placeholder="Label" aria-label={`Detail ${index + 1} label`} /></label>
              <label><span className="sr-only">Detail value</span><input value={detail.value} onFocus={(event) => event.currentTarget.select()} onInput={(event) => { const value = event.currentTarget.value; setDetailDrafts((current) => current.map((candidate) => candidate.id === detail.id ? { ...candidate, value } : candidate)); setDetailsDirty(true); }} placeholder="Value" aria-label={`${detail.label || `Detail ${index + 1}`} value`} /></label>
              <button type="button" onClick={() => { setDetailDrafts((current) => current.filter((candidate) => candidate.id !== detail.id)); setDetailsDirty(true); }} aria-label={`Remove ${detail.label || `detail ${index + 1}`}`} title="Remove detail"><img src="/icons/ui/note-delete.svg" alt="" /></button>
            </div>)}
          </div>
          <datalist id="stat-block-detail-labels">{DETAIL_LABELS.map((label) => <option key={label} value={label} />)}</datalist>
          <button type="button" className="stat-block-add-detail" onClick={() => { setDetailDrafts((current) => [...current, { id: uid("stat-detail"), label: "", value: "" }]); setDetailsDirty(true); }}> <img src="/icons/ui/add.svg" alt="" />Add detail</button>
        </div>
      </details>
      <div className="stat-block-section-fields">
        {editableSections.map(({ key, title }) => {
          const count = populatedLineCount(sectionDrafts[key]);
          return <details key={key} open={openSections[key]} onToggle={(event) => { const open = event.currentTarget.open; setOpenSections((current) => ({ ...current, [key]: open })); }}>
            <summary><span>{title}</span><small>{count ? `${count} ${count === 1 ? "entry" : "entries"}` : "Empty"}</small><img src={openSections[key] ? "/icons/reference/chevron-expanded.svg" : "/icons/reference/chevron.svg"} alt="" /></summary>
            <label><span className="sr-only">{title}</span><textarea value={sectionDrafts[key]} onInput={(event) => { const value = event.currentTarget.value; setSectionDrafts((current) => ({ ...current, [key]: value })); setSectionDirty((current) => ({ ...current, [key]: true })); }} placeholder={`One ${title.toLocaleLowerCase().replace(/s$/, "")} per line. Use “Name. Description”.`} /></label>
          </details>;
        })}
      </div>
      <details className="stat-block-import" open={importOpen} onToggle={(event) => setImportOpen(event.currentTarget.open)}>
        <summary><span>Import text or JSON</span><small>Paste or load a file</small><img src={importOpen ? "/icons/reference/chevron-expanded.svg" : "/icons/reference/chevron.svg"} alt="" /></summary>
        <div>
          <label className="stat-block-source"><span>Source stat block</span><textarea value={source} onInput={(event) => { setSource(event.currentTarget.value); setError(""); }} placeholder={STARTER} aria-invalid={Boolean(error)} aria-describedby={error ? "stat-block-error" : undefined} /></label>
          {error && <p className="stat-block-error" id="stat-block-error" role="alert">{error}</p>}
          <div className="stat-block-importer__file"><input ref={fileInput} className="sr-only" type="file" accept=".json,.txt,application/json,text/plain" onChange={(event) => { void loadFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /><Button compact tone="quiet" onClick={() => fileInput.current?.click()}>Load file</Button><small>.json or .txt</small><span /><Button compact tone="quiet" onClick={() => populateFromSource()}>Populate fields</Button></div>
        </div>
      </details>
    </div>
    <div className="stat-block-importer__actions">
      {onRemove && <button type="button" className="stat-block-remove" onClick={onRemove}>Remove stat block</button>}
      <span />
      {onCancel && <Button compact tone="quiet" onClick={onCancel}>Cancel</Button>}
      <Button compact tone="primary" onClick={save}>{block ? "Update" : "Save stat block"}</Button>
    </div>
  </div>;
}

interface StatBlockPanelProps {
  entity: EncounterEntity;
  onChange: (block: MonsterStatBlock | undefined, armorClass?: number, maxHP?: number) => boolean | void;
  tabs?: ReactNode;
  panelId?: string;
  linkedCount?: number;
  linkCandidate?: EncounterEntity;
  onLink?: () => void;
  onUnlink?: () => void;
}

export function StatBlockPanel({ entity, onChange, tabs, panelId, linkedCount = 1, linkCandidate, onLink, onUnlink }: StatBlockPanelProps) {
  const [editing, setEditing] = useState(!entity.statBlock);
  useEffect(() => { setEditing(!entity.statBlock); }, [entity.id, entity.statBlock]);
  const block = entity.statBlock;
  const status = linkedCount > 1 ? `Shared stat block · ${linkedCount} enemies` : tabs ? "Entity details" : "Stat block";

  if (!block || editing) return <div className="stat-block-panel">
    <div className="stat-block-heading"><div><strong>{entity.name}</strong><small>{status}</small></div></div>
    {tabs}
    <div className="stat-block-tabpanel" id={panelId} role={panelId ? "tabpanel" : undefined} aria-labelledby={panelId?.replace(/-panel$/, "-tab")}>
      {linkCandidate && onLink && <div className="stat-block-link-offer"><div><strong>Matching stat block found</strong><p>Use the shared stat block from {linkCandidate.name}. You can unlink it later.</p></div><Button compact tone="quiet" onClick={() => { onLink(); setEditing(false); }}>Link stat block</Button></div>}
      <ImportEditor
        block={block}
        entity={entity}
        onSave={(next, armorClass, maxHP) => { if (onChange(next, armorClass, maxHP) !== false) setEditing(false); }}
        onCancel={block ? () => setEditing(false) : undefined}
        onRemove={block ? () => { if (onChange(undefined) !== false) setEditing(true); } : undefined}
      />
    </div>
  </div>;

  const abilities = ABILITIES.filter(({ key }) => block.abilities?.[key]);
  const visibleSectionTitles = new Set(sectionsForEntity(entity).map(({ title }) => title.toLocaleLowerCase()));
  return <div className="stat-block-panel">
    <div className="stat-block-heading"><div><strong>{entity.name}</strong><small>{status}</small></div><div className="stat-block-heading__actions">{linkedCount > 1 && onUnlink && <Button compact tone="quiet" onClick={onUnlink}>Unlink</Button>}{linkCandidate && onLink && linkedCount === 1 && <Button compact tone="quiet" onClick={onLink}>Link</Button>}<Button compact tone="quiet" onClick={() => setEditing(true)}>Edit</Button></div></div>
    {tabs}
    <div className="stat-block-tabpanel" id={panelId} role={panelId ? "tabpanel" : undefined} aria-labelledby={panelId?.replace(/-panel$/, "-tab")}>
      <div className="stat-block-scroll">
        <div className="stat-block-core">
          <div><span>AC</span><strong>{entity.armorClass}</strong></div>
          {block.initiative && <div><span>Initiative</span><strong>{block.initiative}</strong></div>}
          <div><span>HP</span><strong>{hitPointsLabel(entity.maxHP, block.hitPoints)}</strong></div>
          {block.speed && <div><span>Speed</span><strong>{block.speed}</strong></div>}
        </div>
        {abilities.length > 0 && <div className="stat-block-abilities" aria-label="Ability scores">{abilities.map(({ key, label }) => {
          const ability = block.abilities![key]!;
          return <div key={key}><span>{label}</span><strong>{ability.score}</strong><small>{ability.modifier}{ability.save && ability.save !== ability.modifier ? ` · ${ability.save} save` : ""}</small></div>;
        })}</div>}
        {block.details.length > 0 && <dl className="stat-block-details">{block.details.map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>}
        {block.sections.filter((section) => entity.type !== "Ally" || visibleSectionTitles.has(section.title.toLocaleLowerCase()) || !["legendary actions", "mythic actions"].includes(section.title.toLocaleLowerCase())).map((section, sectionIndex) => <section className="stat-block-section" key={`${section.title}-${sectionIndex}`}><h3>{section.title}</h3>{section.entries.map((entry, entryIndex) => <p key={`${entry.name}-${entryIndex}`}>{entry.name && <strong>{entry.name}. </strong>}{entry.description}</p>)}</section>)}
      </div>
    </div>
  </div>;
}
