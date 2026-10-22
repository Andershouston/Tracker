import { useMemo, useState } from "react";
import { DropdownMenu, Popover } from "radix-ui";
import type { BestiaryEntry } from "../domain/bestiary";
import { parseChallengeRating } from "../domain/bestiary";
import type { CreatureTemplate, RulesetId } from "../domain/types";
import { Button } from "./shared/Button";
import { EmptyState } from "./shared/EmptyState";
import { Modal } from "./shared/Modal";
import { SelectField } from "./shared/SelectField";

type CrFilter = "all" | "0-1" | "2-4" | "5-10" | "11+";

function matchesCr(entry: BestiaryEntry, filter: CrFilter) {
  if (filter === "all") return true;
  const cr = parseChallengeRating(entry.challengeRating);
  if (!Number.isFinite(cr)) return false;
  if (filter === "0-1") return cr <= 1;
  if (filter === "2-4") return cr >= 2 && cr <= 4;
  if (filter === "5-10") return cr >= 5 && cr <= 10;
  return cr >= 11;
}

function CreaturePreview({ entry }: { entry: BestiaryEntry }) {
  const { creature } = entry;
  const block = creature.statBlock;
  return <div className="bestiary-preview">
    <header><div><strong>{creature.name}</strong><small>{block?.identity || "Creature"}</small></div><span className={`edition-badge edition-badge--${entry.edition.toLowerCase()}`}>{entry.edition}</span></header>
    <div className="bestiary-preview__vitals"><span><small>AC</small><strong>{creature.armorClass}</strong></span><span><small>HP</small><strong>{creature.hitPoints.average}</strong></span><span><small>CR</small><strong>{entry.challengeRating}</strong></span></div>
    {block?.speed && <p><strong>Speed</strong> {block.speed}</p>}
    {block?.abilities && <div className="bestiary-preview__abilities">{Object.entries(block.abilities).map(([ability, value]) => <span key={ability}><small>{ability.toUpperCase()}</small><strong>{value?.score ?? "—"}</strong><em>{value?.modifier ?? ""}</em></span>)}</div>}
    {block?.details.map((detail) => <p key={detail.label}><strong>{detail.label}</strong> {detail.value}</p>)}
    {block?.sections.map((section) => <section key={section.title}><h4>{section.title}</h4>{section.entries.map((item) => <p key={item.name}><strong>{item.name}.</strong> {item.description}</p>)}</section>)}
    {!block && <p className="bestiary-preview__empty">No extended stat block has been saved for this creature.</p>}
  </div>;
}

export function BestiaryPanel({ entries, encounterRuleset, onAdd, onEdit, onDuplicate, onRemove }: { entries: BestiaryEntry[]; encounterRuleset: RulesetId; onAdd: (entry: BestiaryEntry) => void; onEdit: (entry: BestiaryEntry) => void; onDuplicate: (entry: BestiaryEntry) => void; onRemove: (entry: BestiaryEntry) => void }) {
  const [query, setQuery] = useState("");
  const [ruleset, setRuleset] = useState<"all" | RulesetId | "homebrew">(encounterRuleset);
  const [cr, setCr] = useState<CrFilter>("all");
  const [type, setType] = useState("all");
  const types = useMemo(() => [...new Set(entries.map((entry) => entry.creatureType))].sort(), [entries]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      if (ruleset === "homebrew" ? entry.edition !== "HB" : ruleset !== "all" && entry.rulesetId !== ruleset) return false;
      if (!matchesCr(entry, cr) || (type !== "all" && entry.creatureType !== type)) return false;
      if (!needle) return true;
      return `${entry.creature.name} ${entry.challengeRating} ${entry.creatureType} ${JSON.stringify(entry.creature.statBlock ?? {})}`.toLocaleLowerCase().includes(needle);
    });
  }, [entries, query, ruleset, cr, type]);

  return <div className="bestiary-panel">
    <div className="bestiary-heading"><div><strong>Bestiary</strong><small>Add creatures to this encounter</small></div></div>
    <div className="bestiary-tools">
      <label className="bestiary-search"><img src="/icons/ui/reference-search.svg" alt="" /><span className="sr-only">Search bestiary</span><input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search creatures..." /></label>
      <div className="bestiary-filters">
        <SelectField ariaLabel="Ruleset" value={ruleset} onValueChange={(value) => setRuleset(value as typeof ruleset)} options={[{ value: "all", label: "All rulesets" }, { value: "dnd5e-2014-srd-5.1", label: "2014" }, { value: "dnd5e-2024-srd-5.2.1", label: "2024" }, { value: "homebrew", label: "Homebrew" }]} />
        <SelectField ariaLabel="Challenge rating" value={cr} onValueChange={(value) => setCr(value as CrFilter)} options={[{ value: "all", label: "Any CR" }, { value: "0-1", label: "CR 0–1" }, { value: "2-4", label: "CR 2–4" }, { value: "5-10", label: "CR 5–10" }, { value: "11+", label: "CR 11+" }]} />
        <SelectField ariaLabel="Creature type" value={type} onValueChange={setType} options={[{ value: "all", label: "All types" }, ...types.map((value) => ({ value, label: value }))]} />
      </div>
    </div>
    <div className="bestiary-list">{!entries.length ? <EmptyState title="Your bestiary is empty">Save a creature from its stat block or install a content pack with creatures.</EmptyState> : !visible.length ? <EmptyState title="No matching creatures">Try another search or filter.</EmptyState> : visible.map((entry) => <article className="bestiary-row" key={entry.key}>
      <button type="button" className="bestiary-row__add" onClick={() => onAdd(entry)} aria-label={`Add ${entry.creature.name} to encounter`}>
        <span className="bestiary-row__name">{entry.creature.name}</span><span className={`edition-badge edition-badge--${entry.edition.toLowerCase()}`}>{entry.edition}</span><span className="bestiary-row__cr"><small>CR</small>{entry.challengeRating}</span>
      </button>
      <Popover.Root><Popover.Trigger className="bestiary-row__preview" aria-label={`Preview ${entry.creature.name}`}><img src="/icons/ui/stat-block.svg" alt="" /></Popover.Trigger><Popover.Portal><Popover.Content className="bestiary-preview-popover" align="start" side="right" sideOffset={8} collisionPadding={12}><CreaturePreview entry={entry} /><Popover.Arrow className="popover-arrow" /></Popover.Content></Popover.Portal></Popover.Root>
      <DropdownMenu.Root><DropdownMenu.Trigger className="bestiary-row__options" aria-label={`More options for ${entry.creature.name}`}><img src="/icons/ui/more.svg" alt="" /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="entity-menu" align="end" sideOffset={6} collisionPadding={8}><DropdownMenu.Item onSelect={() => onEdit(entry)}>Edit creature</DropdownMenu.Item><DropdownMenu.Item onSelect={() => onDuplicate(entry)}>Duplicate as homebrew</DropdownMenu.Item><DropdownMenu.Item className="entity-menu__remove" onSelect={() => onRemove(entry)}>Remove from bestiary</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
    </article>)}</div>
  </div>;
}

export function BestiaryEditor({ entry, onSave, onClose }: { entry: BestiaryEntry; onSave: (entry: BestiaryEntry, creature: CreatureTemplate) => void; onClose: () => void }) {
  const [name, setName] = useState(entry.creature.name);
  const [rulesetId, setRulesetId] = useState(entry.rulesetId);
  const [armorClass, setArmorClass] = useState(String(entry.creature.armorClass));
  const [hitPoints, setHitPoints] = useState(String(entry.creature.hitPoints.average));
  const [initiative, setInitiative] = useState(String(entry.creature.initiativeModifier));
  const [cr, setCr] = useState(entry.challengeRating === "—" ? "" : entry.challengeRating);
  const [json, setJson] = useState(entry.creature.statBlock ? JSON.stringify(entry.creature.statBlock, null, 2) : "");
  const [error, setError] = useState("");
  const save = () => {
    let statBlock = entry.creature.statBlock;
    try { statBlock = json.trim() ? JSON.parse(json) : undefined; } catch { setError("The stat block JSON is not valid."); return; }
    if (!name.trim()) { setError("Enter a creature name."); return; }
    const nextDetails = [...(statBlock?.details ?? [])].filter((detail) => !/^(challenge|cr)$/i.test(detail.label));
    if (cr.trim()) nextDetails.push({ label: "Challenge", value: cr.trim() });
    onSave(entry, {
      ...entry.creature,
      name: name.trim(),
      armorClass: Number(armorClass) || 0,
      hitPoints: { ...entry.creature.hitPoints, average: Math.max(0, Number(hitPoints) || 0) },
      initiativeModifier: Number(initiative) || 0,
      rulesetCompatibility: [rulesetId],
      statBlock: statBlock ? { ...statBlock, name: name.trim(), details: nextDetails } : undefined,
    });
  };
  return <Modal title="Edit bestiary creature" className="modal--bestiary-editor" onClose={onClose} footer={<><Button tone="quiet" onClick={onClose}>Cancel</Button><Button tone="primary" onClick={save}>Save creature</Button></>}>
    <div className="form-stack bestiary-editor">
      <label className="field field--full"><span>Name</span><input autoFocus value={name} onFocus={(event) => event.currentTarget.select()} onInput={(event) => setName(event.currentTarget.value)} /></label>
      <label className="field"><span>Ruleset</span><SelectField ariaLabel="Creature ruleset" value={rulesetId} onValueChange={setRulesetId} options={[{ value: "dnd5e-2014-srd-5.1", label: "D&D 2014" }, { value: "dnd5e-2024-srd-5.2.1", label: "D&D 2024" }]} /></label>
      <label className="field"><span>Challenge rating</span><input value={cr} onInput={(event) => setCr(event.currentTarget.value)} placeholder="1/4" /></label>
      <label className="field"><span>Armor class</span><input type="number" value={armorClass} onFocus={(event) => event.currentTarget.select()} onInput={(event) => setArmorClass(event.currentTarget.value)} /></label>
      <label className="field"><span>Average HP</span><input type="number" value={hitPoints} onFocus={(event) => event.currentTarget.select()} onInput={(event) => setHitPoints(event.currentTarget.value)} /></label>
      <label className="field"><span>Initiative modifier</span><input type="number" value={initiative} onFocus={(event) => event.currentTarget.select()} onInput={(event) => setInitiative(event.currentTarget.value)} /></label>
      <label className="field field--full"><span>Full stat block JSON</span><textarea rows={12} value={json} onInput={(event) => { setJson(event.currentTarget.value); setError(""); }} placeholder="Optional structured monster stat block" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  </Modal>;
}
