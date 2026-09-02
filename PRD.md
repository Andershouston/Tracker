# Initiative Tracker — Product Requirements Document

> **Document status:** Living product and implementation reference
> **Last consolidated:** 2026-08-11
> **Product:** Initiative Tracker
> **Repository:** `/Users/anders/Documents/dmtools`

## 1. Purpose of this document

This PRD consolidates the product brief, the original HTML tracker, the current React/Radix rebuild, the Figma flows, the implementation review, and the later annotations and corrections supplied during UX review.

Use it to:

- understand what the product is and how it is structured;
- reference UX flows by a stable identifier;
- distinguish settled requirements from working decisions and open questions;
- track differences between the desired product and the current implementation;
- plan implementation work without losing earlier behavioral requirements;
- prevent an older mockup or implementation detail from silently overriding a newer decision.

This document replaces the earlier `PRD.md` as the primary requirements reference. `PRODUCT.md` remains the shorter durable product brief.

### 1.1 Requirement status labels

| Status | Meaning |
|---|---|
| **Decided** | Product behavior is settled and may be implemented without another UX decision. |
| **Working** | Direction is agreed, but a final Figma flow or edge-case decision may still refine it. |
| **Open** | A product or UX decision is still required. A builder must not invent the answer. |
| **Implemented** | Present in the current rebuild. This does not automatically mean it matches the desired UX. |
| **Mismatch** | Current output differs from a decided requirement or authoritative design. |
| **Future** | Desired architectural capacity, but not part of the immediate fidelity pass. |

## 2. Sources of truth and precedence

When references disagree, use this order:

1. The most recent explicit user decision or annotation recorded in this PRD.
2. The most recent scoped Figma flow for the relevant feature.
3. Earlier Figma components and screens.
4. The original interaction behavior in `legacy.html`.
5. The current implementation in `src/`.

The current implementation is evidence of what exists, not automatic authority for what should exist.

### 2.1 Primary references

- Product brief: `PRODUCT.md`
- Original behavioral reference: `legacy.html`
- Original component reference: `components.html`
- Current implementation: `src/`
- Example content pack: `content-packs/example-pack.json`
- Figma file: [Initiative Tracker GCdupe](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-)

### 2.2 Scoped Figma references

| Area | Authoritative node | Notes |
|---|---|---|
| Overall tracker reference | [`2095:14501`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2095-14501) | Broad application comparison reference. |
| Add Entity flow | [`2068:4274`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2068-4274) | Previously referenced as flow F0-6. Later annotations refine commit/new-row behavior. |
| Compact roster-selection card | [`2039:1987`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2039-1987) | Used only inside New Encounter roster selection. It has no `…` menu and is not a normal committed encounter row. |
| New Encounter without roster entities (1A) | [`4014:22630`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=4014-22630) | Defines encounter creation when the roster is empty. |
| New Encounter with roster entities (1B.1) | [`4014:25534`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=4014-25534) | Defines the roster-aware modal. |
| Select roster entities during creation (1B.2) | [`4014:27608`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=4014-27608) | Defines selection and deselection behavior. |
| Staging entity menu | [`4014:31447`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=4014-31447) | Defines the compact staging row and staging-safe action menu. |
| Staging HP editing | [`4021:68889`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=4021-68889) | Defines the anchored Current/Maximum HP popover. |
| Combat damage and HP control | [`2088:33840`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2088-33840) | Defines the anchored amount control and Damage, Heal, Temporary HP, and Set operations. |
| Application header | [`2111:21071`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2111-21071) | Defines the 47px application header, encounter-name interaction, action grouping, and responsive simple variant. |
| Entity-bar component anatomy | [`2123:31470`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2123-31470) | Detailed shared component reference for entity-bar geometry, icons, and padding. |
| Roster membership action | [`2037:5129`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2037-5129) | Defines add/remove roster action icons. Icons communicate the action: plain circle adds; struck circle removes. |
| Dying entity bar | [`2137:35748`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2137-35748) | Defines the expanded dying row, Dying badge, death-save counters, health treatment, and action placement. |
| Death-save counter | [`2137:28371`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2137-28371) | Defines each success/failure counter as one 78×24px control; pips display progress and are not independent controls. |
| Bottom management toolbar | [`2106:19857`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2106-19857) | Defines Staging, Combat, and Edit-mode toolbar variants. |
| Combat log panel | [`2123:31505`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2123-31505) | Defines the 297px read-only combat log, header, dividers, event colors, and grouped chronology. |
| Combat log entry | [`2053:2250`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2053-2250) | Defines first-line timestamp alignment and the 14px entry geometry used inside 8px-spaced event groups. |
| Player and session notes | [`2112:22270`](https://www.figma.com/design/gzV4tfHAFtlFlaZYKZeAye/Initiative-Tracker--GCdupe-?node-id=2112-22270) | Defines viewing/adding notes, inline note editing, icon actions, and the note-content delete confirmation. Surrounding page framing is not authoritative for the notes implementation. |

## 3. Product overview

Initiative Tracker is a lightweight, local-first D&D 5e encounter workspace for Dungeon Masters. It supports encounter setup, initiative, turn progression, health, death state, effects, reactions, notes, logs, reusable roster members, and user-supplied ruleset-aware content.

The application is delivered as a public static web page. It requires no account and no hosted application database. Encounter and library data remain on the user’s device unless the user explicitly exports a JSON file.

### 3.1 Primary user

- A Dungeon Master preparing or running D&D 5e encounters.
- Often manages many entities while attention is split between rules, players, narration, and the tracker.
- Needs high information density, fast repeated actions, strong error prevention, and easy recovery.
- Primarily uses a desktop browser, with tablet and narrow-screen support required.

### 3.2 Product goals

1. Make the active turn and consequential combat state immediately understandable.
2. Make repeated encounter-management actions fast enough for live tabletop use.
3. Preserve a compact, scan-friendly turn order even with many entities.
4. Keep data local, portable, and understandable.
5. Support both D&D 2014 and D&D 2024 rulesets.
6. Allow users to extend conditions, creatures, spells, and related content with their own JSON packs.
7. Preserve the strongest behavior from the original tracker while retaining the rebuild’s safer architecture.

### 3.3 Non-goals for the current project

- User accounts, cloud sync, or multi-user sessions.
- A player-facing or role-based view.
- Map, token, or virtual tabletop integration.
- Spell-slot, inventory, CR, or XP tracking.
- Automatically maintained campaign-state HP in the reusable roster.
- Automatically distributing copyrighted content packs.
- Redesigning future content-field migration beyond maintaining a versioned schema boundary.

## 4. Product principles

- **Operate, do not browse:** this is a live-use tool. Scanability and direct action outrank decoration.
- **Compact by default:** rows show what must be scanned; secondary actions stay in contextual menus or focused popovers.
- **State controls capability:** staging, editing, and active combat expose different actions.
- **Combat actions describe events:** damage, healing, effects, and death-state changes are distinct from administrative corrections.
- **Templates become instances:** roster and compendium entries are reusable sources; encounter entities own their live state.
- **Explicit commitment:** incomplete drafts and uncommitted popover edits are never persisted.
- **Reversible where practical:** destructive actions require confirmation or an agreed undo path.
- **Newer scoped designs win:** a later flow may refine an older component without redefining unrelated contexts.

## 5. Current application architecture

### 5.1 Delivery and runtime

- React 19 with TypeScript.
- Radix Primitives provide dialogs, popovers, dropdown menus, selects, checkboxes, and toggle groups; component styling remains Figma-specific.
- Radix Colors dark scales are imported as CSS variables and mapped through the application's semantic design tokens.
- Vite build and development server.
- Static production output in `dist/`.
- Hostable on any static HTTPS host.
- Previously loaded application shell is available offline through the included web manifest/service-worker setup.
- No backend service is required for core use.

### 5.2 Client layers

| Layer | Current responsibility |
|---|---|
| `src/app/App.tsx` | Application orchestration, panels, dialogs, autosave, imports, and flow wiring. |
| `src/components/` | Header, management bar, panels, shared controls, entity rows, editors, health, and effects UI composed from Radix primitives where an interaction primitive exists. |
| `src/domain/` | Typed rules for initiative, turn flow, HP, effects, logging, IDs, and factories. |
| `src/data/` | IndexedDB persistence, backups, JSON reading, and legacy migration. |
| `src/content/` | Built-in content, content-pack normalization, and validation. |
| `src/domain/rulesets/` | Encounter-pinned 2014/2024 ruleset definitions. |
| `src/styles/app.css` | Radix Colors imports, semantic application tokens, Figma-specific layout, responsive behavior, and primitive styling. |

### 5.3 Persistence

**Implemented architecture:**

- Primary persistence is IndexedDB database `dmtools`, currently schema version 1.
- Stores: encounters, roster members, content packs, session notes, settings, and metadata.
- Meaningful state changes autosave after a short debounce.
- Manual Save remains available for explicit reassurance.
- Browser persistent-storage permission is requested where available.
- A legacy `localStorage.dmtools_state` payload is migrated when IndexedDB has no existing snapshot.
- Clearing browser site data can remove all local data; full JSON backup remains required for durable recovery.

### 5.4 Import and export

- Encounter export/import uses a versioned `dmtools-encounter` JSON document, currently schema version 2.
- Full backup/restore uses a versioned `dmtools-backup` JSON document, currently schema version 2.
- Content packs use schema version 1.
- Full backup restore replaces local encounters, roster members, notes, settings, and content packs and therefore requires confirmation.
- Imported encounters receive new encounter/entity IDs and enter staging.

### 5.5 Architectural constraints

- Preserve IndexedDB, autosave, backup/export, legacy migration, and tested domain logic.
- Keep encounter/ruleset data serializable and versioned.
- Keep UI capability rules centralized by encounter state; do not scatter mode checks through unrelated controls.
- Creature and roster entries must be snapshotted into encounters so future source edits cannot silently change an existing encounter.
- Add an app-data migration whenever a required domain field changes persisted entity state.

## 6. Core domain model

### 6.1 Encounter

An encounter contains:

- identity, name, created/updated timestamps;
- a pinned ruleset ID;
- `staging` or `active` mode;
- round and active entity ID;
- ordered encounter entities;
- combat log entries.

### 6.2 Encounter entity

An encounter entity is an independent instance with:

- name and type: PC, Ally, Enemy, or Neutral/NPC;
- initiative score, modifier, and rolled state;
- Armor Class;
- Current HP, Maximum HP, and Temporary HP;
- effects and entity notes;
- roster/source references where applicable;
- dead, dying, unconscious, reaction, delay, and death-save state.

### 6.3 Roster member

**Decided:** the roster is a set of reusable templates, not automatically synchronized campaign state.

- Adding a roster member creates an independent encounter entity.
- The encounter instance receives baseline identity, AC, initiative modifier, Maximum HP, and related configuration.
- New encounter instances default to `currentHP = maxHP` and `tempHP = 0`.
- Damage, healing, effects, initiative, and notes in an encounter do not automatically write back to the roster.
- A future explicit “Update roster from encounter” action may be considered, but is out of scope now.

### 6.4 Content source snapshot

Imported creatures may retain a source reference and a snapshot of their source template. An encounter must continue to function if the originating content pack is later edited or removed.

## 7. Rulesets and user content

### 7.1 Rulesets

- Supported encounter rulesets:
  - D&D 2014 · SRD 5.1
  - D&D 2024 · SRD 5.2.1
- A ruleset is selected when creating an encounter and pinned to that encounter.
- Changing rulesets later is a migration, not a casual preference toggle.
- Ruleset compatibility filters imported content available to the encounter.

### 7.2 Content packs

Users may install their own JSON documents containing conditions/effects, creatures, spells, and related content.

Required pack metadata is intentionally limited to:

1. `sourceVersion`
2. `rulesetCompatibility`
3. `requiredAttribution`

There is no official/homebrew distinction. Whoever compiles or shares a pack is responsible for its contents and for supplying any required attribution.

### 7.3 Current and future content behavior

- Conditions from compatible packs can currently be used by the effect picker.
- Creature and spell structures exist in the schema, but complete UI flows for consuming them are future work.
- Future field/schema migrations may be necessary as richer creature and spell content is introduced.
- A generalized future content-field migration system is out of scope for the current fidelity work.

## 8. Application states and shared layout

### 8.1 Application shell

The application uses four persistent regions:

1. Header: encounter identity, New, Load, Save, Log, Notes, Library, and DM menu.
2. Main workspace: ordered encounter entities.
3. Contextual aside: log, notes, roster, or content library.
4. Management bar: mode-specific encounter controls.

The implemented header follows Figma `2111:21071`:

- 47px high with a 30px encounter-name control;
- encounter name truncates safely and reveals its edit affordance on hover/focus;
- no visible ruleset-year badge is shown in the header;
- New, Load, and Save form the file-action group; Log, Notes, and Library form the panel-action group;
- the DM menu remains the overflow location for encounter and destructive operations;
- medium widths use the Figma icon-only file-action variant, while narrow widths move file actions into the DM menu without making them unreachable.

Shared form and action controls use real Radix primitives with application-specific styling:

- focus is represented by a contained, token-driven ring rather than a browser-default outline that changes the control's apparent geometry;
- Select triggers use the designed compact chevron instead of the native oversized disclosure arrow;
- SVGs render inside fixed icon boxes so their intrinsic viewboxes do not introduce inconsistent scale, padding, or alignment;
- these visual refinements must preserve Radix keyboard behavior, focus management, labels, and accessible state.

### 8.2 Encounter states

| State | Purpose | Capability rule |
|---|---|---|
| **Staging** | Build and configure the encounter before combat. | No damage/healing events or effect management. Configuration edits are allowed. |
| **Active combat** | Run turns and rounds. | Combat actions, HP events, effects, reactions, death state, and logging are available. |
| **Combat editing** | Correct entity configuration without ending combat. | Administrative corrections are allowed; the active turn and combat mode remain intact. |

Combat editing is currently represented by UI state rather than a third persisted `EncounterMode` value.

## 9. UX flow catalog

These identifiers are stable references for future discussion and implementation.

### F01 — Launch, migration, and autosave

**Status:** Implemented architecture; fidelity not design-sensitive.

1. Open IndexedDB and load the current application snapshot.
2. If no snapshot exists, attempt legacy `localStorage.dmtools_state` migration.
3. If neither exists, create a seed/new snapshot.
4. Request persistent browser storage where available.
5. Autosave meaningful state changes and surface Saving, Saved, or Save failed status.
6. If storage cannot be opened, show a recoverable fallback and recommend export/backup.

### F02 — Create a new encounter

**Status:** Implemented and browser-verified. Creation flows 1A, 1B.1, and 1B.2 are authoritative.

#### F02.1 — No roster entities exist

1. Open a 451px New Encounter modal with no visible dismiss `×`.
2. Show Encounter Name and Ruleset.
3. Default the ruleset to the current product default while allowing D&D 2014 or D&D 2024.
4. Keep Create encounter disabled until the name contains non-whitespace text.
5. Cancel closes without creating an encounter.
6. Create encounter creates an empty staging encounter and closes the modal.

#### F02.2a — Roster entities are available

1. Expand the modal to the roster-aware state, approximately 470px high.
2. Add a constrained, scrollable “Add from Roster” section.
3. Render each roster member as the compact 32px roster-selection card: type, name, AC, and HP. The card has no `…` options menu.
4. The compact card belongs only to this selection context.

#### F02.2b — Select and deselect roster entities

1. Clicking an unselected roster card selects it.
2. Selection replaces the type glyph with a color-matched checkmark.
3. Hovering an unselected card uses a subtle type-colored treatment.
4. Hovering a selected card replaces the checkmark with `×`, communicating removal.
5. Clicking a selected card deselects it.
6. Selected members become ordinary encounter instances after creation and use normal staging rows.
7. New roster-derived instances begin at full Current/Maximum HP and do not carry prior encounter damage.

Roster entities are not linked to a ruleset, so encounter creation does not hide, disable, migrate, or warn about them based on the encounter's selected ruleset.

### F03 — Load, rename, switch, and delete encounters

**Status:** Core implemented; management fidelity remains in backlog.

- Load lists saved encounters with name, ruleset, entity count, and staging/round state.
- Selecting an encounter changes the active encounter without deleting the prior one.
- Rename edits encounter identity only.
- Delete requires confirmation and leaves the user with another or newly created encounter.
- The desired inline deletion/provenance controls within the load list remain to be reviewed.

### F04 — Save, import, export, and restore

**Status:** Implemented architecture.

- Save writes local IndexedDB state and provides feedback.
- Export encounter downloads a versioned JSON snapshot.
- Export all downloads a complete local backup.
- Import routes recognized encounter, backup, or content-pack documents.
- Full restore previews its replacement scope and requires confirmation.
- Invalid or unrecognized JSON produces a clear, non-destructive error.

### F05 — Roster management

**Status:** Implemented, including isolated roster-template semantics.

- View active and available roster members.
- Create and delete reusable roster templates.
- Add an available member to the current encounter.
- Remove an encounter instance without deleting its roster template.
- Adding from the roster always creates a fresh encounter snapshot at full HP.
- Encounter edits never automatically alter the roster template.

### F06 — Add an entity (legacy reference F0-6)

**Status:** Implemented and browser-verified.

1. The full-width control is labelled **New Entity**.
2. With no draft present, New Entity inserts a transient draft row.
3. Draft actions remain **Add to Roster**, **Add Entity**, and **Cancel**.
4. The checkmark action is labelled **Add Entity** and commits the current valid entity. It does not create another draft.
5. Cancel discards the draft without persistence.
6. If New Entity is selected while a named draft exists, commit that entity and append a fresh draft.
7. If New Entity is selected while an unnamed draft exists, discard it and replace it with a fresh draft.
8. A draft must never enter autosave or survive reload before it is committed.
9. Repeated entry should retain the last selected entity type where practical.
10. Duplicate names receive `(2)`, `(3)`, and so on for encounter readability.

### F07 — Review and manage staging entities

**Status:** Implemented and browser-verified. Figma `4014:31447` is authoritative.

Each committed staging entity uses a compact 38–40px row containing:

- drag/reorder handle;
- entity-type indicator;
- initiative/roll value;
- entity name;
- Armor Class;
- Current and Maximum HP;
- notes affordance;
- `…` options menu.

Effects and effect badges never appear in staging. The row remains compact; available actions do not increase its height.

The staging `…` menu contains:

- **Options**
  - Edit entity
  - Add to Roster
  - Duplicate
- **Danger zone**
  - Remove entity

“Danger zone” is the correct spelling; the older Figma typo “Daner zone” must not be reproduced.

Staging does not offer Adjust Health, Add Effect, damage, healing, or other combat actions in this menu.

### F08 — Edit HP during staging

**Status:** Implemented and browser-verified. Figma `4021:68889` is authoritative.

1. Click the Current/Maximum HP region of a staging row.
2. Apply an engaged treatment to the HP region.
3. Open a compact anchored popover, approximately 314×48px.
4. Show separate **Current** and **Maximum** fields plus **Set**.
5. Blank fields mean “preserve the existing value.”
6. Set is unavailable until at least one valid change is present.
7. Typing does not mutate the entity or autosave intermediate values.
8. Set commits all valid changes, updates the row, and closes the popover.
9. Clicking outside closes the popover and discards all edits.
10. Escape performs the same discard-and-close behavior for keyboard users.
11. Staging HP changes are configuration, not damage/healing events, and create no combat-log event.
12. Directly entering Current above the resulting Maximum is invalid. If Maximum itself is lowered below the preserved or entered Current value, Current clamps to the new Maximum.
13. A negative Current entry is a valid state-setting correction: the row displays zero and derives dying, lethal-overflow, or instant-death state using F13.

### F09 — Edit entity configuration

**Status:** Implemented baseline; final detailed Figma flow is still needed for visual refinement.

- Edit Entity expands the selected row in place rather than navigating away.
- The compact row remains as the editor header and preserves spatial context.
- Explicit Save commits changes; Cancel discards them.
- Only one entity can be edited at a time.
- Opening another entity closes a clean editor or warns about unsaved changes.
- Staging can edit name, type, initiative modifier/score, AC, Current HP, Maximum HP, notes, and roster membership where applicable.
- HP quick editing remains available through F08; it does not require the full editor.
- Active-combat editing corrects entity configuration without changing the active turn or ending combat.
- Damage, healing, effects, death saves, reactions, Dodge, Ready, and Delay remain purpose-built combat interactions rather than general form edits.

### F10 — Roll, sort, and begin combat

**Status:** Figma `2106:19857` variants implemented and browser-verified; missing-initiative behavior remains open.

- The management bar is 52px high with 10px horizontal and 11px vertical padding.
- **Staging:** Roster, separator, Round 0; Sort, Roll, separator, dominant Begin combat.
- **Active combat:** current Round, separator, Prev and Next; Sort, Roll, separator, bronze Edit entities.
- **Combat editing:** Roster, separator, current Round; Sort, Roll, separator, blue Return to combat.
- Roster is a contained secondary utility action with icon and label.
- Sort is a lightweight direct action with icon and label in all three variants.
- Roll is a lightweight dropdown with roll icon, label, and chevron in all three variants.
- Begin combat is the dominant primary action with icon and label.
- End combat is available in the DM encounter menu rather than adding a non-Figma action to the toolbar.
- Ending a round early remains available through the documented `E` keyboard shortcut; normal Next progression increments the round when wrapping.
- Sort orders descending by initiative, using modifier as the first tiebreaker.
- Manual drag may resolve remaining ties.
- Auto-sort never occurs without an explicit DM action.

**Open:** whether Begin combat blocks, warns, auto-rolls, or permits entities with missing initiative.

### F11 — Run active combat

**Status:** Core domain implemented; final active-row visual specification remains open.

- Begin combat sets round 1 and selects the first entity.
- Next advances the active entity and increments the round when wrapping.
- Previous moves backward without creating an invalid round.
- End round skips remaining entities and begins the next round.
- Delay moves the active entity to the end of the current order.
- The active row remains unmistakable and scrolls into view after turn transitions.
- Adding an entity mid-combat does not silently reorder the encounter.
- Returning to staging preserves entities, initiative, HP, effects, and log unless another action explicitly resets them.

### F12 — Active entity actions

**Status:** Context-menu model decided; exact menu inventory and row anatomy remain open.

- The `…` menu is context-sensitive to encounter state.
- Combat actions appear when the menu is opened, not as a permanent action tray.
- Dodge, Ready/Hold, Delay, Reaction Used, health, effects, death-state operations, notes, duplicate, and removal remain distinct actions.
- The 66px effect-oriented representation is not a universal entity row.
- Row height is driven by information that must remain visible, such as active effects, not by the number of available commands.

### F13 — Combat HP, dying, healing, and death

**Status:** Implemented with focused domain tests and browser-verified combat controls; critical-hit behavior while dying remains open as O-07.

#### HP invariants

- Current HP and Maximum HP are whole numbers.
- Temporary HP is a separate non-negative whole number and may exceed Maximum HP.
- Current HP displayed to the user never exceeds Maximum HP.
- Overhealing is lost.
- Lowering Maximum below Current clamps Current to the new Maximum.
- Maximum HP below zero is invalid.
- Maximum HP equal to zero represents a dead entity without death saves.
- Blank staging HP fields preserve their prior value.
- Directly entering Current above Maximum is invalid; lowering Maximum below Current instead clamps Current to the new Maximum.
- Directly entering Current below zero is allowed as a corrective state assignment and uses the same displayed-zero, lethal-overflow, and instant-death mapping as damage.
- Decimal or non-numeric HP input is rejected or prevented with inline feedback.

#### Damage and lethal overflow

- Temporary HP absorbs damage before Current HP.
- Displayed Current HP stops at zero.
- A raw result below zero places the entity into death-save state and records lethal overflow below zero.
- When the raw result reaches `−Maximum HP`, the entity is instantly dead.
- Example: `10/10`, take 15 damage → displayed `0/10`, dying, 5 overflow. Take another 5 before resolution → overflow reaches 10 and the entity becomes instantly dead.
- If an entity that is already dying takes damage, the hit both increases lethal overflow and marks one death-save failure.
- A third death-save failure marks the entity dead even if lethal overflow has not reached Maximum HP.

#### Healing from zero

- Healing begins from displayed zero, not from the hidden negative overflow.
- Healing for `N` restores up to `N` Current HP, capped at Maximum HP.
- Healing clears lethal overflow and resolves the dying state as three successful death saves.
- Healing and damage during active combat create appropriate combat-log events.
- Direct configuration corrections do not masquerade as healing or damage.

#### Death-save controls

- The UI exposes one 78×24px Success counter and one 78×24px Failure counter while dying, following Figma `2137:28371`.
- Each counter is a single click target. Clicking anywhere in it increments that result by one.
- The three pips inside each counter are progress indicators and are not individually selectable or reversible controls.
- Three failures mark the entity dead.
- Three successes stabilize the entity at 0 HP and reset both death-save counts.
- A stable entity remains unconscious and does not immediately regain 1 HP. Under both the 2014 and 2024 rules, an unhealed stable creature regains 1 HP after `1d4` hours; a natural 20 death save is the distinct case that immediately restores 1 HP.
- Manual stabilization and revival remain available where the current state permits them.
- A normal damaging hit while dying marks one failure. The number of failures produced by a critical hit remains an open rules detail.

#### Combat health interaction

- The combat HP control follows Figma `2088:33840` and is anchored to the selected entity row rather than opening a general modal.
- It contains one amount field followed by icon actions for Damage, Heal, and Temporary HP, plus a labelled Set action.
- Damage and Heal apply the entered amount as a combat event. Temporary HP sets the entity's separate Temporary HP value. Set directly corrects Current HP.
- Damage and Heal require an amount greater than zero. Temporary HP may be set to zero. Set accepts zero through Maximum HP and reports invalid values inline.
- Outside click and Escape close the control and discard its uncommitted amount.
- The control is implemented with the Figma-provided icons and geometry. Its row anchoring, narrow-screen fit, and lack of horizontal overflow have been verified in the browser at desktop and 390px widths.

### F14 — Effects and reactions

**Status:** Core implemented; catalog and active-row fidelity remain in backlog.

- Effects may be built in or supplied by compatible content packs.
- Effects can have category, description, optional duration, tick timing, source reference, presentation, and optional automation.
- Duration may tick at turn start, turn end, or manually according to definition.
- Expired effects are removed and logged.
- Reaction Used is a fast product-specific state, not something the DM must rediscover in a generic effect catalog.
- Dodge and Ready/Hold apply distinct effects; Delay changes turn order and is not the same action.
- No effects are displayed or managed during staging.

### F15 — Notes and combat log

**Status:** Combat-log chronology and notes component `2112:22270` are implemented and browser-verified; respectful log auto-follow behavior still needs refinement.

- Session notes persist across encounters.
- Entity notes belong to an encounter entity.
- Notes can be added, edited, and deleted with appropriate confirmation for deletion.
- A visible note affordance indicates when an entity has notes.
- Notes use a 39px uppercase subject header, chronological date/time dividers, multiline 11px bodies, and exact 20px edit/delete icon actions.
- Editing occurs inline in the note body. Escape discards an edit; the edit action or Command/Control+Enter commits it.
- The fixed composer uses a 64px multiline field with Cancel and Add actions. Blank notes cannot be committed.
- Delete confirmation is a 360×174px dialog that previews the note in quotation marks, clamps the preview to two lines, and exposes Cancel and Delete Entry.
- Combat log records system, damage, healing, death, condition, and intermission events. Historical/imported manual event records remain renderable, but the Figma log is read-only and has no manual-entry composer.
- Entries retain round, turn, timestamp, and type.
- The visible entry prefix is the event round (`R1`, `R2`, and so on), not a turn index.
- Round and Intermission boundaries use full-width 23px dividers.
- Consecutive events are rendered in groups with 8px between entries and 4px vertical group padding. Individual entries are 14px text rows with 6px horizontal padding and no vertical padding.
- A wrapped or explicitly multi-line message preserves its line breaks. Its `R#` marker aligns to the first line, and the next event begins after the group’s 8px gap.
- Event colors distinguish default/system, subtle, Temporary HP, healing, damage, condition, detriment/dying, and danger/death states.
- The panel is 297px wide with a 39px header and a quiet 22px close control.
- The live log should follow new entries unless the user has intentionally scrolled away. The current implementation follows the newest event unconditionally, so scroll-intent preservation remains outstanding.

### F16 — Content library

**Status:** Conditions implemented; creature/spell consumption is future work.

- Import, validate, install, replace, export, and remove content packs.
- Show pack name, source version, compatibility, attribution, and content counts.
- Removal does not delete encounter snapshots already derived from the pack.
- Invalid documents surface specific validation errors.
- Future creature and spell database flows must filter by encounter ruleset and snapshot selected content into the encounter.

### F17 — Keyboard and responsive operation

**Status:** Partially implemented; full requirement remains open.

- All core workflows must be keyboard reachable with visible focus.
- Escape closes/discards transient dialogs, popovers, and clean editors as appropriate.
- Modal focus must be trapped and restored to the invoking control.
- Drag reordering requires a keyboard-accessible alternative.
- Reduced-motion preferences are respected.
- At narrow widths, New, Load, Save, Begin combat, End/Return to staging, entity notes, and core turn controls must remain reachable.
- The staging HP popover and inline editor must adapt without obscuring their entity or overflowing the viewport.

## 10. Detailed interaction decisions

### 10.1 Entity representations are contextual

| Representation | Context | Purpose |
|---|---|---|
| Draft creation row | Adding a new encounter entity | Enter type, initiative modifier, name, AC, HP, roster choice, and commit/cancel. |
| Compact roster-selection card | New Encounter modal only | Select a reusable roster template for import. |
| Committed staging row | Encounter setup | Scan and configure the encounter without combat actions or effects. |
| Inline expanded editor | Staging or corrective combat editing | Explicitly edit entity configuration. |
| Active-combat row | Active encounter | Surface the live state needed to run turns; exact anatomy remains open. |
| Effect/death-state expansion | Active combat when required | Show effects, death saves, or other consequential live state. |

The compact roster-selection card must never replace an ordinary committed staging entity row.

### 10.2 Contextual action architecture

Use one shared entity-row foundation where practical, but derive capabilities from encounter and entity state:

`entity + encounter state + entity state → visible information and allowed menu actions`

Capability definitions should be centralized and testable. Staging-safe actions must not accidentally expose health events or effects simply because a shared menu item exists elsewhere.

### 10.3 Commit and cancellation rules

- Draft creation data is transient until Add Entity.
- Staging HP popover data is transient until Set.
- Inline entity edits are transient until Save.
- Clicking outside the HP popover discards it.
- Cancel/Escape discards the relevant transient state.
- Autosave observes committed application state only.

### 10.4 Roster/source isolation

- Roster and content entries are templates.
- Encounter entities are instances.
- Removing an encounter instance does not remove its template.
- Removing a template does not mutate existing encounter instances.
- Existing encounter instances remain stable when a content pack changes.

## 11. Current implementation mismatches and change backlog

Priority meanings:

- **P0:** data loss or rules-state corruption.
- **P1:** blocks or materially harms a core staging/live-combat flow.
- **P2:** significant fidelity, efficiency, safety, or accessibility issue.
- **P3:** polish, extension, or lower-frequency improvement.

For ongoing management, refer to work by its `B-xx` ID and product questions by their `O-xx` ID. When a decision is resolved, update its governing flow first, move the outcome into the decision log, and then replace or close the corresponding open item. Implementation status should describe the repository, not the design’s completion.

### 11.1 Decided work

| ID | Priority | Area | Prior mismatch | Required result | Status |
|---|---:|---|---|---|---|
| B-01 | P1 | New Encounter | Uses helper copy and checkbox-style roster rows in the current modal. | Implement F02 using Creation flows 1A, 1B.1, and 1B.2 with compact selectable roster cards. | Implemented—verified |
| B-02 | P1 | Staging rows | Uses the compact roster-selection card as the committed staging representation and omits staging initiative/current-max anatomy. | Restore the committed 38–40px staging row from F07. | Implemented—verified |
| B-03 | P1 | Staging actions | `…` expands a full-width tray with Adjust health, Add effect, and peer buttons. | Replace with the anchored F07 menu and its staging-safe capabilities. | Implemented—verified |
| B-04 | P1 | Staging HP | Opens the general Health modal and exposes combat operations. | Implement the F08 Current/Maximum popover with Set/discard behavior. | Implemented—verified |
| B-05 | P1 | Roster semantics | Persistent encounter edits may be written back into the roster automatically. | Treat roster entries as templates; copy to encounter and never auto-write live state back. | Implemented—tested |
| B-06 | P1 | HP/death domain | Current model cannot persist accumulated lethal overflow and treats damage while dying as a simple automatic failure. | Add versioned lethal-overflow state and implement F13, including Maximum HP zero. | Implemented—tested; O-07 open |
| B-07 | P2 | Entity editing | General Edit opens a modal. | Implement the F09 inline expanded-row editor with explicit Save/Cancel. | Baseline implemented—needs final Figma |
| B-08 | P2 | Management bar | Sort/Roll lack the complete icon hierarchy and compete visually with Begin combat. | Implement all three `2106:19857` toolbar variants and preserve End combat through the DM menu. | Implemented—verified |
| B-09 | P2 | Add Entity | Current logic is close to the clarified flow. | Verify labels, draft persistence, named/unnamed New Entity behavior, and repeated-entry type retention against F06. | Implemented—verified |
| B-10 | P2 | Load encounter | Current load modal has reduced encounter management/provenance compared with the original flow. | Restore useful metadata and safe encounter deletion without overloading the modal. | Defined from legacy—needs design pass |
| B-11 | P2 | Combat log | Prior presentation had weak chronology, cramped wrapped rows, turn-index prefixes, and a non-Figma composer. | Match F15 and preserve user scroll intent during future live-follow refinement. | Visual design implemented—verified; scroll intent outstanding |
| B-12 | P2 | Effect removal | Removal can be too easy to trigger and descriptions rely heavily on native title tooltips. | Separate inspection from removal and provide safer recovery/confirmation appropriate to frequency. | Defined from review—needs design pass |
| B-13 | P2 | Keyboard/modal behavior | Focus trapping, restoration, Escape behavior, and drag alternatives are incomplete. | Meet F17 accessibility requirements. | Defined—not implemented |
| B-14 | P2 | Responsive reachability | Critical actions can become hidden or horizontally awkward at narrow widths. | Keep all core setup and combat actions reachable at mobile/tablet widths. | Defined—responsive design open |
| B-15 | P3 | Creature/spell sources | Pack schema stores creatures/spells but the tracker cannot pull them into encounters. | Add compatible search/import flows using source references and encounter snapshots. | Future |
| B-16 | P2 | Header fidelity | Header grouping, ruleset badge, encounter-name interaction, icon sizing, and responsive collapse differed from the component spec. | Match Figma `2111:21071` while retaining semantic labels and save-status announcements. | Implemented—verified |
| B-17 | P1 | Death-save controls | Individual pips were independent toggle targets and the dying-row anatomy differed from Figma. | Use the F13 whole-counter increment model and `2137:35748` dying-row presentation. | Implemented—tested and verified |

### 11.2 Open decisions

| ID | Area | Decision still required | Blocking |
|---|---|---|---|
| O-01 | Active-combat row | Which information is always visible: HP bar, Current/Maximum, temp HP, effects, death saves, reaction state, and active-turn affordances. | Final active-row fidelity work |
| O-02 | Non-staging menus | Exact action sets for active combat, combat editing, dead/dying entities, and entities already in the roster. | Contextual menu implementation |
| O-05 | Missing initiative | Block Begin combat, warn, auto-roll missing values, or allow them. | F10 completion |
| O-06 | Destructive recovery | Decide confirmation versus undo for frequent Remove entity/effect actions and less-frequent End combat/Delete actions. | Safety consistency |
| O-07 | Critical damage while dying | Decide whether a critical hit marks one death-save failure or more than one. Normal damaging hits mark one failure and also increase lethal overflow. | Final F13 rules behavior |
| O-08 | Responsive composition | Final narrow-screen layout for dense rows, management controls, contextual panels, menus, and popovers. | F17 completion |

### 11.3 Resolved review findings

The following review findings no longer require a product decision:

- Compact card `2039:1987` is exclusively a New Encounter roster-selection card.
- Effects do not appear in staging.
- Staging actions are in a contextual menu, not a persistent action tray.
- Staging has no Adjust Health or Add Effect action.
- Staging HP uses Current/Maximum rather than introducing a separate Starting HP field.
- New roster/compendium instances default to full HP and do not inherit prior encounter damage.
- New Encounter roster-selection cards do not have an options menu.
- Encounter and roster entities are not linked to a ruleset; ruleset compatibility is content-pack metadata rather than entity state.
- A normal damaging hit while dying marks one death-save failure and continues to accumulate lethal overflow.
- Combat health uses the anchored Figma `2088:33840` control rather than a general modal; responsive anchoring and discard behavior are implemented.
- The Add Entity check commits; the full-width New Entity control starts the next draft.
- “Danger zone” is the correct menu label.
- The management bar uses icon-and-label hierarchy with Begin combat as the primary progression action.
- Death-save pips communicate progress only; the whole Success or Failure counter records the next result.
- Stabilization leaves the entity unconscious at 0 HP; it does not immediately restore 1 HP.
- Header `2111:21071`, management toolbar `2106:19857`, and combat log `2123:31505` are implemented visual sources of truth.
- The combat log is a read-only event record. Notes belong in the Notes panel rather than a combat-log composer.

### 11.4 Improvements already present in the rebuild

These architectural or behavioral improvements should be preserved:

- IndexedDB persistence and storage error handling.
- Legacy localStorage migration.
- Autosave status and manual Save feedback.
- Versioned encounter and full-backup JSON.
- Confirmation before full-backup replacement.
- Ruleset IDs and encounter pinning.
- Validated, attributable, ruleset-compatible content packs.
- Typed/tested turn, initiative, HP, and content logic.
- Active-row auto-scroll after turn transitions.
- Distinct Dodge, Ready, Delay, and Reaction Used wiring.
- Editable notes and confirmed note deletion.
- Shortcut reference modal.
- Reduced-motion support and improved semantic buttons/labels.

## 12. Recommended implementation sequence

### Phase 1 — Correct staging and encounter creation

**Status:** Complete and verified in the browser.

1. B-01 New Encounter modal and roster selection — complete.
2. B-02 committed staging rows — complete.
3. B-03 contextual staging menu — complete.
4. B-04 staging HP popover — complete.
5. B-09 Add Entity verification — complete.
6. B-08 management-bar hierarchy — complete.

### Phase 2 — Correct data and combat rules

1. B-05 roster template isolation — complete and tested.
2. B-06 lethal overflow, Maximum HP zero, healing, and persisted-data migration — complete and tested.
3. Resolve the critical-hit portion of O-07; normal damage while dying is implemented and tested.

### Phase 3 — Complete editing and active combat

1. Review the implemented B-07 baseline against a final F09 visual flow.
2. Resolve O-01 active-row anatomy.
3. Resolve O-02 state-specific menus.
4. Resolve O-05 missing initiative.
5. Verify turn continuity, effects, reactions, and remaining death-state controls. The anchored combat-health interaction, whole-counter death-save interaction, and combat-log visual chronology are complete and browser verified.

### Phase 4 — Safety, accessibility, and responsive operation

1. Resolve O-06 destructive recovery.
2. Implement B-10, B-12, B-13, and B-14; complete B-11 scroll-intent preservation.
3. Verify keyboard-only and narrow-screen completion of every core flow.

### Phase 5 — Content expansion

1. Implement B-15 creature and spell discovery/import.
2. Use content-pack ruleset compatibility for library filtering without attaching a ruleset to encounter or roster entities.
3. Add versioned schema migrations only when concrete new content fields require them.

## 13. Acceptance criteria

### 13.1 Product-level

- The tracker runs from a public static HTTPS page with no account or server database.
- Core use continues after the application shell has previously loaded offline.
- Data is stored locally, autosaved, and exportable.
- A full backup can restore all user-owned local data with explicit confirmation.
- Encounters remain pinned to either D&D 2014 or D&D 2024.
- Compatible user JSON content can be installed without an official/homebrew classification.

### 13.2 UX-level

- A DM can create an encounter, optionally add roster members, add repeated enemies, roll/sort initiative, and begin combat without leaving the primary workspace.
- No incomplete entity or popover draft enters persistence.
- Staging rows remain compact and contain no effects or combat-health actions.
- Context menus expose only actions allowed in the current state.
- Current turn and consequential death/effect state remain unmistakable.
- Death-save Success and Failure counters increment as whole controls; individual pips are not focusable actions.
- A stabilized entity remains unconscious at 0 HP until healed or until a rules-driven recovery restores HP.
- Combat-log round/intermission grouping remains readable when entries wrap to multiple lines.
- Core workflows remain reachable by keyboard and at supported narrow widths.
- Destructive operations provide the agreed confirmation or undo behavior.

### 13.3 Engineering-level

- `npm test` passes.
- `npm run build` passes.
- The current automated suite contains 25 passing tests after the death-save increment regression coverage was added.
- New HP/death semantics have focused unit tests, including overflow across multiple hits, healing from zero, Maximum HP zero, clamping, temp HP, and persisted migration.
- Roster tests prove that encounter changes do not mutate templates.
- Content-pack tests cover metadata, compatibility, attribution, malformed JSON, and source snapshots.
- Flow-critical components expose semantic labels and visible focus.

## 14. Decision log

| Date consolidated | Decision |
|---|---|
| 2026-08-11 | Creation flows 1A (`4014:22630`), 1B.1 (`4014:25534`), and 1B.2 (`4014:27608`) replace the moved New Encounter reference `4014:30745`. |
| 2026-08-11 | New Encounter roster flow is represented as F02.2a availability and F02.2b selection/deselection, not a separate top-level flow. |
| 2026-08-11 | Compact card `2039:1987` belongs only to roster selection in New Encounter. |
| 2026-08-11 | Committed staging rows use the normal compact encounter-row anatomy. |
| 2026-08-11 | Staging contains no effects or effect management. |
| 2026-08-11 | Staging menus expose Edit entity, Add to Roster, Duplicate, and Remove entity only. |
| 2026-08-11 | The Add Entity check commits; the full-width control is New Entity and controls creation of the next draft. |
| 2026-08-11 | Roster members are templates; encounter entities are independent instances. |
| 2026-08-11 | The product uses Current/Maximum HP and does not add a separate Starting HP field. |
| 2026-08-11 | Staging HP uses the anchored popover in `4021:68889`; outside click/Escape discards, Set commits. |
| 2026-08-11 | Current HP clamps to Maximum; lowering Maximum clamps Current; Maximum zero means dead without saves. |
| 2026-08-11 | Negative raw HP produces a displayed zero plus lethal overflow; reaching `−Maximum HP` causes instant death. |
| 2026-08-11 | Healing from zero ignores lethal overflow, restores from zero, and resolves the dying state as three successful saves. |
| 2026-08-11 | Temporary HP remains separate and may exceed Maximum HP. |
| 2026-08-11 | Content-pack metadata excludes official/homebrew status. Pack authors supply attribution. |
| 2026-08-11 | Implementation pass completed B-01 through B-06 and B-08 through B-09; B-07 has an implemented inline-editor baseline pending final Figma refinement. |
| 2026-08-11 | New Encounter roster cards have no `…` menu, and roster/encounter entities are not linked to a ruleset. |
| 2026-08-11 | A normal damaging hit while dying adds one death-save failure while lethal overflow continues to accumulate; only critical-hit failure count remains open. |
| 2026-08-11 | Combat HP interaction follows Figma `2088:33840`: one amount field with Damage, Heal, Temporary HP, and Set actions. |
| 2026-08-11 | The combat HP modal was replaced by the anchored Figma control, including exact supplied icons, inline validation, outside-click/Escape discard, and verified 390px responsive fit. |
| 2026-08-11 | The presentation layer migrated from Preact/custom interaction scaffolding to React 19 and actual Radix Dialog, Popover, Dropdown Menu, Select, Checkbox, and Toggle Group primitives. Radix Colors now supplies the source scales while Figma remains the visual authority. |
| 2026-08-11 | Shared Radix controls were visually normalized: form focus uses a contained token-driven ring, Select uses the designed compact chevron, and fixed icon boxes prevent SVG viewbox and padding drift without replacing Radix interaction semantics. |
| 2026-08-11 | Header component `2111:21071` is implemented: 47px geometry, grouped file/panel actions, hover/focus rename affordance, no visible ruleset badge, exact icon sizing, and responsive simple/mobile variants. |
| 2026-08-11 | Entity-bar icon geometry was normalized against `2123:31470`. Roster membership icons now describe the available action: the plain icon adds to the roster and the struck icon removes from it. |
| 2026-08-11 | Death-save interaction follows `2137:28371`: Success and Failure are whole 78×24px increment controls, while their three pips are non-interactive progress indicators. A regression test covers sequential increment behavior. |
| 2026-08-11 | Stabilization follows both the 2014 and 2024 D&D rules: the entity is stable and unconscious at 0 HP, save counts reset, and stabilization does not immediately restore 1 HP. |
| 2026-08-11 | Management toolbar `2106:19857` defines separate Staging, Combat, and Combat-editing layouts. End combat moved to the DM encounter menu; early End round remains available with `E`. |
| 2026-08-11 | Combat log `2123:31505` is a read-only 297px event record with `R#` prefixes, full-width Round/Intermission dividers, category colors, and a quiet 22px close control. |
| 2026-08-11 | Combat-log entries follow `2053:2250`: events are grouped by chronology with 8px sibling gaps and 4px group padding; individual 14px rows have horizontal padding only, preserve line breaks, and align timestamps to the first message line. |
| 2026-08-11 | Player/session notes follow `2112:22270`: dated note sections use exact edit/delete icons, editing is inline, the bottom composer supports multiline notes, and deletion uses a two-line content-preview confirmation. Surrounding page framing was intentionally ignored. |

## 15. Glossary

| Term | Definition |
|---|---|
| **Roster template** | A reusable baseline character/entity saved outside a specific encounter. |
| **Encounter instance** | An independent copy of a roster or content entry with encounter-owned live state. |
| **Staging** | Pre-combat encounter setup and configuration. |
| **Active combat** | Turn/round execution with combat actions and logging. |
| **Combat editing** | Temporary corrective configuration while combat remains active. |
| **Current HP** | The entity’s live/configured HP, displayed no lower than zero and no higher than Maximum. |
| **Maximum HP** | The upper bound for Current HP; zero represents dead without saves. |
| **Lethal overflow** | Damage below displayed zero tracked toward the `−Maximum HP` instant-death threshold. |
| **Temporary HP** | A separate damage buffer that may exceed Maximum HP. |
| **Effect** | A condition, status, action state, or other time-bound/indefinite modifier attached to an entity. |
| **Content pack** | A user-supplied, versioned JSON document containing ruleset-compatible conditions, creatures, and/or spells. |
