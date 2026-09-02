import { useEffect, useRef, useState, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { QUICK_REFERENCES, type QuickReferenceSection } from "../content/quick-reference";
import type { AppPanel, CombatLogEntry, ContentPackDocument, EffectDefinition, EncounterEntity, RosterMember, SessionNote } from "../domain/types";
import { ContentLibrary } from "./ContentLibrary";
import { Button } from "./shared/Button";
import { EmptyState } from "./shared/EmptyState";
import { RosterCardContent } from "./RosterCardContent";

function NoteComposer({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const submit = () => { if (!text.trim()) return; onAdd(text.trim()); setText(""); };
  return <div className="note-composer"><textarea value={text} placeholder={placeholder} onInput={(event) => setText(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); } }} /><div className="note-composer__actions"><Button compact tone="quiet" onClick={() => setText("")}>Cancel</Button><Button compact onClick={submit} disabled={!text.trim()}>Add</Button></div></div>;
}

function logEntryTone(entry: CombatLogEntry) {
  if (entry.type === "damage") return "damage";
  if (entry.type === "healing") return "heal";
  if (entry.type === "condition") return "condition";
  if (entry.type === "death") return /died|dead|instant/i.test(entry.message) ? "danger" : "detriment";
  if (/temporary hp/i.test(entry.message)) return "temp-hp";
  if (/delayed|reset|removed/i.test(entry.message)) return "subtle";
  return "default";
}

function LogPanel({ entries }: { entries: CombatLogEntry[] }) {
  const timeline = useRef<HTMLDivElement>(null);
  useEffect(() => { const node = timeline.current; if (node) node.scrollTop = node.scrollHeight; }, [entries.length]);
  const content: ReactNode[] = [];
  let group: ReactNode[] = [];
  let groupKey = "";
  let priorRound: number | null = null;
  const flushGroup = () => {
    if (!group.length) return;
    content.push(<div className="timeline-group" key={`group-${groupKey}`}>{group}</div>);
    group = [];
    groupKey = "";
  };
  entries.forEach((entry) => {
    if (entry.type === "intermission") {
      flushGroup();
      priorRound = entry.round;
      content.push(<div className="timeline-divider timeline-divider--intermission" key={entry.id}><span>—</span><strong>Intermission</strong><span>—</span></div>);
      return;
    }
    const heading = priorRound !== entry.round;
    priorRound = entry.round;
    if (heading) {
      flushGroup();
      content.push(<div className="timeline-divider" key={`round-${entry.id}`}><span>—</span><strong>Round</strong><b>{entry.round}</b><span>—</span></div>);
    }
    if (!groupKey) groupKey = entry.id;
    group.push(<div className={`timeline-entry timeline-entry--${logEntryTone(entry)}`} key={entry.id}><span>R{entry.round}</span><p>{entry.message}</p></div>);
  });
  flushGroup();
  return <><div className="log-panel__heading"><strong>Combat Log</strong></div><div className="timeline" ref={timeline}>{!entries.length ? <EmptyState title="No combat events yet">Start combat to record encounter events.</EmptyState> : content}</div></>;
}

function NotesPanel({ notes, entity, onAdd, onUpdate, onRemove }: { notes: SessionNote[]; entity: EncounterEntity | null; onAdd: (text: string) => void; onUpdate: (id: string, text: string) => void; onRemove: (id: string, text: string) => void }) {
  const list = entity ? entity.notes : notes;
  return <><div className="notes-heading"><strong>{entity ? entity.name : "Session notes"}</strong></div><div className="notes-list">{!list.length ? <EmptyState title="No notes yet">Add reminders, rulings, or story details here.</EmptyState> : list.map((note) => <NoteEntry key={note.id} note={note} onUpdate={onUpdate} onRemove={onRemove} />)}</div><NoteComposer placeholder="Add note…" onAdd={onAdd} /></>;
}

function NoteEntry({ note, onUpdate, onRemove }: { note: SessionNote; onUpdate: (id: string, text: string) => void; onRemove: (id: string, text: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const date = new Date(note.timestamp);
  const dateLabel = new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }).format(date);
  const timeLabel = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).format(date).replace(" ", "").toLowerCase();
  const save = () => { const next = text.trim(); if (next) onUpdate(note.id, next); else setText(note.text); setEditing(false); };
  const cancel = () => { setText(note.text); setEditing(false); };
  return <article className="note-entry"><header className="note-entry__meta"><time dateTime={date.toISOString()}><strong>{dateLabel}</strong><span>»</span><em>{timeLabel}</em></time><div className="note-entry__actions"><button aria-label="Edit note" aria-pressed={editing} onClick={() => editing ? cancel() : setEditing(true)}><img src="/icons/ui/note-edit.svg" alt="" /></button><button aria-label="Delete note" onClick={() => onRemove(note.id, note.text)}><img src="/icons/ui/note-delete.svg" alt="" /></button></div></header><div className={`note-entry__content${editing ? " is-editing" : ""}`}>{editing ? <><textarea autoFocus value={text} onInput={(event) => setText(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); cancel(); } if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); save(); } }} /><div className="note-entry__edit-actions"><Button compact tone="quiet" onClick={cancel}>Discard edits</Button><Button compact onClick={save} disabled={!text.trim()}>Save</Button></div></> : <p>{note.text}</p>}</div></article>;
}

const referenceKeyByPanel = {
  "reference-movement": "movement",
  "reference-actions": "actions",
  "reference-bonus": "bonus",
  "reference-reactions": "reactions",
} as const;

function ReferencePanel({ panel, effects }: { panel: Extract<AppPanel, `reference-${string}`> | "conditions"; effects: EffectDefinition[] }) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const section: QuickReferenceSection = panel === "conditions" ? {
    title: "Conditions",
    qualifier: "Rules reference",
    introduction: "Conditions alter a creature's capabilities in a variety of ways. Search the installed content for a quick reminder.",
    entries: effects.map((effect) => ({ id: effect.id, title: effect.name, summary: effect.category.replace(/^./, (letter) => letter.toUpperCase()), description: effect.description })),
  } : QUICK_REFERENCES[referenceKeyByPanel[panel]];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const entries = normalizedQuery ? section.entries.filter((entry) => `${entry.title} ${entry.summary} ${entry.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)) : section.entries;
  const icon = panel === "conditions" ? "/icons/ui/rail-conditions.svg" : panel === "reference-movement" ? "/icons/ui/rail-movement.svg" : panel === "reference-actions" ? "/icons/ui/rail-actions.svg" : panel === "reference-bonus" ? "/icons/ui/rail-bonus.svg" : "/icons/ui/rail-reactions.svg";

  return <div className="reference-panel">
    <div className="reference-heading"><strong>Reference</strong></div>
    <label className="reference-search"><img src="/icons/ui/reference-search.svg" alt="" /><span className="sr-only">Search reference</span><input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search for..." /></label>
    <div className="reference-content">
      <div className="reference-section-title"><strong>{section.title}</strong><span>—</span><em>{section.qualifier}</em></div>
      <p className="reference-introduction">{section.introduction}</p>
      {!entries.length ? <EmptyState title="No matching reference">Try another term.</EmptyState> : entries.map((entry, index) => {
        const expanded = expandedId === entry.id || (!normalizedQuery && expandedId === null && index === 0 && Boolean(entry.description));
        return <article className={`reference-entry${expanded ? " is-expanded" : ""}`} key={entry.id}>
          <span className="reference-entry__icon"><img src={panel === "reference-movement" ? "/icons/ui/reference-item.svg" : icon} alt="" /></span>
          <button type="button" className="reference-entry__body" aria-expanded={entry.description ? expanded : undefined} onClick={() => entry.description && setExpandedId(expanded ? "__none__" : entry.id)}>
            <span className="reference-entry__title"><strong>{entry.title}</strong>{entry.description && <img src="/icons/ui/reference-chevron.svg" alt="" />}</span>
            <small>{entry.summary}</small>
            {expanded && entry.description && <p>{entry.description}</p>}
          </button>
        </article>;
      })}
    </div>
  </div>;
}

function RosterPanel({ roster, encounterEntityIds, onToggle, onEdit, onArchive, onRemove, onCreate }: { roster: RosterMember[]; encounterEntityIds: Set<string>; onToggle: (member: RosterMember) => void; onEdit: (member: RosterMember) => void; onArchive: (member: RosterMember, archived: boolean) => void; onRemove: (member: RosterMember) => void; onCreate: () => void }) {
  const [query, setQuery] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchingRoster = normalizedQuery ? roster.filter((member) => `${member.name} ${member.type}`.toLocaleLowerCase().includes(normalizedQuery)) : roster;
  const archived = matchingRoster.filter((member) => member.archived);
  const currentRoster = matchingRoster.filter((member) => !member.archived);
  const active = currentRoster.filter((member) => encounterEntityIds.has(member.rosterId));
  const available = currentRoster.filter((member) => !encounterEntityIds.has(member.rosterId));
  const rows = (members: RosterMember[], group: "active" | "available" | "archive") => members.map((member) => {
    const activeRow = group === "active";
    const archivedRow = group === "archive";
    return <article key={member.rosterId} className={`roster-card roster-card--${member.type.toLowerCase()}${activeRow ? " is-selected" : ""}`}>
    <button type="button" className="roster-card__toggle" aria-pressed={activeRow || undefined} aria-label={archivedRow ? `Restore ${member.name} to the roster` : `${activeRow ? "Remove" : "Add"} ${member.name} ${activeRow ? "from" : "to"} encounter`} onClick={() => archivedRow ? onArchive(member, false) : onToggle(member)}>
      <RosterCardContent member={member} />
    </button>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="roster-card__options" aria-label={`More options for ${member.name}`}><img src="/icons/ui/more.svg" alt="" /></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="roster-menu" align="end" sideOffset={6} collisionPadding={8}>
        <DropdownMenu.Item onSelect={() => onEdit(member)}>Edit entity</DropdownMenu.Item>
        {archivedRow ? <DropdownMenu.Item onSelect={() => onArchive(member, false)}>Restore to roster</DropdownMenu.Item> : <><DropdownMenu.Item onSelect={() => onToggle(member)}>{activeRow ? "Remove from encounter" : "Add to encounter"}</DropdownMenu.Item><DropdownMenu.Item onSelect={() => onArchive(member, true)}>Archive character</DropdownMenu.Item></>}
        <DropdownMenu.Item className="danger-link" onSelect={() => onRemove(member)}>Remove from roster</DropdownMenu.Item>
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
  </article>;
  });
  return <div className="roster-panel">
    <div className="roster-heading"><strong>Roster</strong></div>
    <label className="roster-search"><img src="/icons/ui/reference-search.svg" alt="" /><span className="sr-only">Search roster</span><input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search for..." /></label>
    <div className="roster-list">{!roster.length ? <EmptyState title="Your roster is empty">Save recurring characters here to add them to any encounter.</EmptyState> : !matchingRoster.length ? <EmptyState title="No matching characters">Try another name or entity type.</EmptyState> : <>{active.length > 0 && <section className="roster-section"><h3>Active</h3><div>{rows(active, "active")}</div></section>}{available.length > 0 && <section className="roster-section"><h3>Available</h3><div>{rows(available, "available")}</div></section>}<section className={`roster-section roster-section--archive${archiveOpen || normalizedQuery ? " is-open" : ""}`}><button type="button" className="roster-archive-toggle" aria-expanded={archiveOpen || Boolean(normalizedQuery)} onClick={() => setArchiveOpen((open) => !open)}><span>Archive</span><img src="/icons/ui/chevron-down.svg" alt="" /></button>{(archiveOpen || normalizedQuery) && (archived.length ? <div>{rows(archived, "archive")}</div> : <p>No archived characters.</p>)}</section></>}</div>
    <div className="roster-footer"><Button onClick={onCreate}>Add new character</Button></div>
  </div>;
}

export function AsidePanel({ panel, onClose, log, sessionNotes, selectedEntity, roster, encounterEntityIds, packs, effects, onAddNote, onUpdateNote, onRemoveNote, onRosterToggle, onRosterEdit, onRosterArchive, onRosterRemove, onRosterCreate, onPackInstall, onPackRemove }: {
  panel: AppPanel;
  onClose: () => void;
  log: CombatLogEntry[];
  sessionNotes: SessionNote[];
  selectedEntity: EncounterEntity | null;
  roster: RosterMember[];
  encounterEntityIds: Set<string>;
  packs: ContentPackDocument[];
  effects: EffectDefinition[];
  onAddNote: (text: string) => void;
  onUpdateNote: (id: string, text: string) => void;
  onRemoveNote: (id: string, text: string) => void;
  onRosterToggle: (member: RosterMember) => void;
  onRosterEdit: (member: RosterMember) => void;
  onRosterArchive: (member: RosterMember, archived: boolean) => void;
  onRosterRemove: (member: RosterMember) => void;
  onRosterCreate: () => void;
  onPackInstall: (pack: ContentPackDocument) => void;
  onPackRemove: (packId: string) => void;
}) {
  const isReference = panel === "conditions" || panel.startsWith("reference-");
  return <aside className={`aside-panel aside-panel--${isReference ? "reference" : panel}`}><button className="aside-close" aria-label="Close panel" onClick={onClose}><img src="/icons/ui/log-close.svg" alt="" /></button>{panel === "log" && <LogPanel entries={log} />}{panel === "notes" && <NotesPanel notes={sessionNotes} entity={selectedEntity} onAdd={onAddNote} onUpdate={onUpdateNote} onRemove={onRemoveNote} />}{panel === "roster" && <RosterPanel roster={roster} encounterEntityIds={encounterEntityIds} onToggle={onRosterToggle} onEdit={onRosterEdit} onArchive={onRosterArchive} onRemove={onRosterRemove} onCreate={onRosterCreate} />}{panel === "library" && <ContentLibrary packs={packs} onInstall={onPackInstall} onRemove={onPackRemove} />}{isReference && <ReferencePanel key={panel} panel={panel as Extract<AppPanel, `reference-${string}`> | "conditions"} effects={effects} />}</aside>;
}
