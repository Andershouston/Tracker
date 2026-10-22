import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AsidePanel } from "../components/AsidePanel";
import { BestiaryEditor, BestiaryPanel } from "../components/BestiaryPanel";
import { Header } from "../components/Header";
import { ManagementBar } from "../components/ManagementBar";
import { UtilityRail } from "../components/UtilityRail";
import { EntityEditor } from "../components/encounter/EntityEditor";
import { TurnOrder } from "../components/encounter/TurnOrder";
import { Button } from "../components/shared/Button";
import { RosterCardContent } from "../components/RosterCardContent";
import { Modal } from "../components/shared/Modal";
import { SelectField } from "../components/shared/SelectField";
import { availableEffects } from "../content/normalize";
import { BUILTIN_EFFECTS } from "../content/builtin";
import { DND_2014_CONDITIONS_PACK } from "../content/dnd2014-conditions-pack";
import { INITIATIVE_TRACKER_EFFECTS_PACK } from "../content/initiative-tracker-effects-pack";
import { validateContentPack } from "../content/validation";
import { exportAll, exportBestiary, exportEncounter, exportRoster, readJsonFile } from "../data/backup";
import { loadSnapshot, requestPersistentStorage, saveSnapshot } from "../data/database";
import { importLegacyState } from "../data/legacy-import";
import { activateEffect } from "../domain/effects";
import { bestiaryLinkId, collectBestiaryEntries, creatureTemplateFromEntity, instantiateBestiaryEntry, type BestiaryEntry } from "../domain/bestiary";
import { nextDuplicateEntityName } from "../domain/entity-names";
import { createEncounter, createEntity, createRosterMemberFromEntity, createSeedSnapshot, instantiateRosterMember, uid } from "../domain/factories";
import { configureEntityHP, damageEntity, healEntity, normalizeEntityHealth, recordDeathSave, reviveEntity, setEntityHP, setTempHP, stabilizeEntity } from "../domain/hit-points";
import { resetInitiative, rollAll, setInitiative, sortInitiative } from "../domain/initiative";
import { withLog } from "../domain/logging";
import { syncLinkedRosterEntity } from "../domain/roster";
import { canonicalEntityName, linkedStatBlockEntities, matchingEnemyEntities, nextAvailableEntityName, suggestedIndependentName } from "../domain/stat-block-links";
import { beginCombat, delayTurn, endRound, nextTurn, previousTurn, removeEntity, returnToStaging } from "../domain/turn-flow";
import type { ActiveEffect, AppPanel, AppSnapshot, ContentPackDocument, CreatureTemplate, EffectDefinition, Encounter, EncounterEntity, MonsterStatBlock, RosterMember, RulesetId } from "../domain/types";
import { RULESETS } from "../domain/rulesets";

type Dialog = "new" | "load" | "rename" | "delete" | "shortcuts" | "export" | "import" | null;
type ImportKind = "encounter" | "roster" | "bestiary" | "backup";
type SaveStatus = "saved" | "saving" | "error";
type Confirmation = { title: string; message: string; actionLabel: string; action: () => void; className?: string; hideClose?: boolean };
type SharedStatBlockUpdate = {
  entityId: string;
  replacement?: EncounterEntity;
  statBlock: MonsterStatBlock | undefined;
  armorClass?: number;
  maxHP?: number;
  entityIds: string[];
  mode: "create" | "linked";
};

const STABILIZED_EFFECT = BUILTIN_EFFECTS.find((effect) => effect.id === "stabilized");

function syncStabilizedEffect(entity: EncounterEntity): EncounterEntity {
  const existing = entity.effects.find((effect) => effect.definitionId === "stabilized");
  const effects = entity.effects.filter((effect) => effect.definitionId !== "stabilized");
  if (!entity.isDead && entity.isUnconscious && !entity.isDying && STABILIZED_EFFECT) {
    return { ...entity, effects: [...effects, existing ?? activateEffect(STABILIZED_EFFECT, null)] };
  }
  return { ...entity, effects };
}

export function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [editor, setEditor] = useState<{ entity?: EncounterEntity; rosterOnly?: boolean } | null>(null);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingEntityDirty, setEditingEntityDirty] = useState(false);
  const [draftEntity, setDraftEntity] = useState<EncounterEntity | null>(null);
  const [lastDraftType, setLastDraftType] = useState<EncounterEntity["type"]>("Enemy");
  const [combatEditing, setCombatEditing] = useState(false);
  const [notesEntityId, setNotesEntityId] = useState<string | null>(null);
  const [lastPanel, setLastPanel] = useState<AppPanel>("notes");
  const [toast, setToast] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newRuleset, setNewRuleset] = useState<RulesetId>("dnd5e-2014-srd-5.1");
  const [newRosterIds, setNewRosterIds] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [sharedStatBlockUpdate, setSharedStatBlockUpdate] = useState<SharedStatBlockUpdate | null>(null);
  const [independentName, setIndependentName] = useState("");
  const [bestiaryEditor, setBestiaryEditor] = useState<BestiaryEntry | null>(null);
  const [importKind, setImportKind] = useState<ImportKind>("encounter");
  const importInput = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    void (async () => {
      const stored = await loadSnapshot();
      const legacy = stored ? null : importLegacyState();
      const initial = stored ?? legacy ?? createSeedSnapshot();
      initial.bestiary ??= [];
      if (!initial.contentPacks.some((pack) => pack.pack.id === DND_2014_CONDITIONS_PACK.pack.id)) {
        initial.contentPacks = [...initial.contentPacks, structuredClone(DND_2014_CONDITIONS_PACK)];
      }
      const installedEffectsPack = initial.contentPacks.find((pack) => pack.pack.id === INITIATIVE_TRACKER_EFFECTS_PACK.pack.id);
      if (installedEffectsPack?.pack.sourceVersion !== INITIATIVE_TRACKER_EFFECTS_PACK.pack.sourceVersion) {
        initial.contentPacks = [
          ...initial.contentPacks.filter((pack) => pack.pack.id !== INITIATIVE_TRACKER_EFFECTS_PACK.pack.id),
          structuredClone(INITIATIVE_TRACKER_EFFECTS_PACK),
        ];
      }
      initial.encounters = initial.encounters.map((item) => ({ ...item, entities: item.entities.map(syncStabilizedEffect) }));
      setSnapshot(initial);
      initialized.current = true;
      if (legacy) setToast("Existing local data was migrated into the new tracker.");
      if (!initial.settings.persistenceRequested) {
        const persisted = await requestPersistentStorage();
        setSnapshot((current) => current ? { ...current, settings: { ...current.settings, persistenceRequested: true } } : current);
        if (!persisted) console.info("Browser storage remains best-effort; exports are recommended.");
      }
    })().catch((error) => { console.error(error); setSnapshot(createSeedSnapshot()); setToast("Local data could not be opened; a temporary example was loaded."); });
  }, []);

  useEffect(() => {
    if (!snapshot || !initialized.current) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(() => {
      saveSnapshot(snapshot).then(() => setSaveStatus("saved")).catch((error) => { console.error(error); setSaveStatus("error"); });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [snapshot]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const activePanel = snapshot?.settings.activePanel;
    if (activePanel && activePanel !== "roster" && activePanel !== "bestiary" && activePanel !== "library") setLastPanel(activePanel);
  }, [snapshot?.settings.activePanel]);

  const encounter = useMemo(() => snapshot?.encounters.find((item) => item.id === snapshot.settings.activeEncounterId) ?? snapshot?.encounters[0] ?? null, [snapshot]);
  const selectedNotesEntity = encounter?.entities.find((entity) => entity.id === notesEntityId) ?? null;
  const selectedMatchingEnemies = selectedNotesEntity && encounter ? matchingEnemyEntities(selectedNotesEntity, encounter.entities) : [];
  const selectedLinkedEnemies = selectedNotesEntity && encounter ? linkedStatBlockEntities(selectedNotesEntity, encounter.entities) : [];
  const selectedStatBlockCandidate = selectedNotesEntity && selectedLinkedEnemies.length <= 1
    ? selectedMatchingEnemies.find((candidate) => candidate.id !== selectedNotesEntity.id && candidate.statBlock)
    : undefined;
  const effects = useMemo(() => encounter && snapshot ? availableEffects(snapshot.contentPacks, encounter.rulesetId) : [], [encounter?.rulesetId, snapshot?.contentPacks]);
  const bestiaryEntries = useMemo(() => snapshot ? collectBestiaryEntries(snapshot.bestiary, snapshot.contentPacks) : [], [snapshot?.bestiary, snapshot?.contentPacks]);

  const commit = useCallback((updater: (current: AppSnapshot) => AppSnapshot) => setSnapshot((current) => current ? updater(current) : current), []);
  const updateEncounter = useCallback((updater: (current: Encounter) => Encounter) => {
    if (!encounter) return;
    commit((current) => ({ ...current, encounters: current.encounters.map((item) => item.id === encounter.id ? updater(item) : item) }));
  }, [commit, encounter?.id]);

  const showToast = (message: string) => setToast(message);

  const toggleRosterPanel = () => {
    setNotesEntityId(null);
    commit((current) => {
      const isOpen = current.settings.rosterOpen ?? current.settings.activePanel === "roster";
      return {
        ...current,
        settings: {
          ...current.settings,
          rosterOpen: !isOpen,
          bestiaryOpen: false,
          activePanel: current.settings.activePanel === "roster" ? null : current.settings.activePanel,
        },
      };
    });
  };

  const toggleBestiaryPanel = () => {
    setNotesEntityId(null);
    commit((current) => ({ ...current, settings: { ...current.settings, bestiaryOpen: !current.settings.bestiaryOpen, rosterOpen: false, activePanel: current.settings.activePanel === "bestiary" ? null : current.settings.activePanel } }));
  };

  const togglePanel = (next: AppPanel | null) => {
    if (next === "roster") {
      toggleRosterPanel();
      return;
    }
    if (next === "bestiary") {
      toggleBestiaryPanel();
      return;
    }
    setNotesEntityId(null);
    commit((current) => ({ ...current, settings: { ...current.settings, activePanel: next === null ? null : current.settings.activePanel === next ? null : next } }));
  };

  const saveBestiaryEntry = (entry: BestiaryEntry, creature: CreatureTemplate) => {
    const packId = entry.origin.kind === "pack" ? entry.origin.packId : null;
    commit((current) => entry.origin.kind === "local"
      ? { ...current, bestiary: current.bestiary.map((item) => item.id === entry.creature.id ? { ...creature, id: item.id } : item) }
      : { ...current, contentPacks: current.contentPacks.map((pack) => pack.pack.id === packId ? { ...pack, content: { ...pack.content, creatures: pack.content.creatures.map((item) => item.id === entry.creature.id ? { ...creature, id: item.id } : item) } } : pack) });
    setBestiaryEditor(null);
    showToast(`${creature.name} updated in the bestiary.`);
  };

  const addBestiaryCreature = (entry: BestiaryEntry) => {
    updateEncounter((current) => {
      const entity = instantiateBestiaryEntry(entry, current.entities, bestiaryLinkId(entry, current.entities));
      return withLog({ ...current, entities: [...current.entities, entity] }, "system", `${entity.name} added from the bestiary.`);
    });
    showToast(`${entry.creature.name} added to the encounter.`);
  };

  const duplicateBestiaryEntry = (entry: BestiaryEntry) => {
    const copy = structuredClone(entry.creature);
    copy.id = uid("creature");
    copy.name = `${copy.name} variant`;
    copy.rulesetCompatibility = [entry.rulesetId];
    copy.sourceRef = undefined;
    commit((current) => ({ ...current, bestiary: [...current.bestiary, copy] }));
    showToast(`${copy.name} added as homebrew.`);
  };

  const removeBestiaryEntry = (entry: BestiaryEntry) => setConfirmation({
    title: `Remove ${entry.creature.name} from the bestiary?`,
    message: "Existing encounter copies will remain unchanged.",
    actionLabel: "Remove creature",
    action: () => {
      const packId = entry.origin.kind === "pack" ? entry.origin.packId : null;
      commit((current) => entry.origin.kind === "local"
        ? { ...current, bestiary: current.bestiary.filter((item) => item.id !== entry.creature.id) }
        : { ...current, contentPacks: current.contentPacks.map((pack) => pack.pack.id === packId ? { ...pack, content: { ...pack.content, creatures: pack.content.creatures.filter((item) => item.id !== entry.creature.id) } } : pack) });
      setConfirmation(null);
    },
  });

  const saveEntityToBestiary = (entity: EncounterEntity) => {
    const sourced = entity.sourceRef;
    if (sourced?.packId === "local-bestiary") {
      commit((current) => ({ ...current, bestiary: current.bestiary.map((creature) => creature.id === sourced.entryId ? creatureTemplateFromEntity(entity, sourced.rulesetId, creature.id) : creature) }));
      showToast(`${entity.name} updated in the bestiary.`);
      return;
    }
    if (sourced?.packId) {
      commit((current) => ({ ...current, contentPacks: current.contentPacks.map((pack) => pack.pack.id === sourced.packId ? { ...pack, content: { ...pack.content, creatures: pack.content.creatures.map((creature) => creature.id === sourced.entryId ? creatureTemplateFromEntity(entity, sourced.rulesetId, creature.id) : creature) } } : pack) }));
      showToast(`${entity.name} updated in the bestiary.`);
      return;
    }
    commit((current) => ({ ...current, bestiary: [...current.bestiary, creatureTemplateFromEntity(entity, encounter?.rulesetId ?? "dnd5e-2014-srd-5.1")] }));
    showToast(`${entity.name.replace(/\s+\d+$/, "")} saved to the bestiary.`);
  };

  const saveEntity = (entity: EncounterEntity, statBlockSourceId?: string) => {
    if (editor?.rosterOnly) {
      const member = createRosterMemberFromEntity(entity);
      commit((current) => {
        const existing = current.roster.find((item) => item.rosterId === member.rosterId);
        const next = { ...current, roster: [...current.roster.filter((item) => item.rosterId !== member.rosterId), member] };
        return existing ? syncLinkedRosterEntity(next, member) : next;
      });
    } else {
      const exists = encounter?.entities.some((item) => item.id === entity.id) ?? false;
      let linkedEntity = entity;
      if (!exists && entity.isPersistent) {
        const member = createRosterMemberFromEntity(entity);
        linkedEntity = { ...entity, rosterId: member.rosterId, isPersistent: true };
        commit((current) => ({ ...current, roster: [...current.roster.filter((item) => item.rosterId !== member.rosterId), member] }));
      }
      updateEncounter((current) => {
        if (exists) return withLog({ ...current, entities: current.entities.map((item) => item.id === entity.id ? linkedEntity : item) }, "system", `${entity.name} updated.`);
        const name = nextAvailableEntityName(linkedEntity.name, current.entities.map((item) => item.name));
        linkedEntity = { ...linkedEntity, name };
        const source = (statBlockSourceId ? current.entities.find((candidate) => candidate.id === statBlockSourceId) : undefined)
          ?? matchingEnemyEntities(linkedEntity, current.entities).find((candidate) => candidate.statBlock && !candidate.statBlockUnlinked);
        let entities = current.entities;
        if (source?.statBlock) {
          const statBlockLinkId = source.statBlockLinkId ?? uid("stat-block");
          linkedEntity = configureEntityHP({
            ...linkedEntity,
            armorClass: source.armorClass,
            statBlock: structuredClone(source.statBlock),
            statBlockLinkId,
            statBlockUnlinked: false,
          }, Math.min(linkedEntity.currentHP, source.maxHP), source.maxHP);
          entities = entities.map((candidate) => candidate.id === source.id ? { ...candidate, statBlockLinkId, statBlockUnlinked: false } : candidate);
        }
        return withLog({ ...current, entities: [...entities, linkedEntity] }, "system", `${linkedEntity.name} added.`);
      });
    }
    setEditor(null);
  };

  const toggleEntityRoster = (entity: EncounterEntity) => {
    if (entity.rosterId && snapshot?.roster.some((member) => member.rosterId === entity.rosterId)) {
      const rosterId = entity.rosterId;
      commit((current) => ({ ...current, roster: current.roster.filter((member) => member.rosterId !== rosterId) }));
      mutateEntity(entity.id, (current) => ({ ...current, rosterId: null, isPersistent: false }));
      showToast(`${entity.name} removed from the roster.`);
      return;
    }
    const member = createRosterMemberFromEntity(entity);
    commit((current) => ({ ...current, roster: [...current.roster, member] }));
    mutateEntity(entity.id, (current) => ({ ...current, rosterId: member.rosterId, isPersistent: true }));
    showToast(`${entity.name} added to the roster.`);
  };

  const startEditingEntity = (entity: EncounterEntity) => {
    if (!editingEntityId || editingEntityId === entity.id || !editingEntityDirty) {
      setEditingEntityId(entity.id);
      setEditingEntityDirty(false);
      return;
    }
    setConfirmation({
      title: "Discard unsaved entity changes?",
      message: "Opening another entity will discard the changes in the current inline editor.",
      actionLabel: "Discard changes",
      action: () => { setEditingEntityId(entity.id); setEditingEntityDirty(false); setConfirmation(null); },
    });
  };

  const saveEditedEntity = (entity: EncounterEntity) => {
    const previousEntity = encounter?.entities.find((candidate) => candidate.id === entity.id);
    const linked = previousEntity && encounter ? linkedStatBlockEntities(previousEntity, encounter.entities) : [];
    if (previousEntity && linked.length > 1 && (previousEntity.armorClass !== entity.armorClass || previousEntity.maxHP !== entity.maxHP)) {
      setIndependentName(suggestedIndependentName(previousEntity, encounter!.entities));
      setSharedStatBlockUpdate({ entityId: entity.id, replacement: entity, statBlock: entity.statBlock, armorClass: entity.armorClass, maxHP: entity.maxHP, entityIds: linked.map((candidate) => candidate.id), mode: "linked" });
      return;
    }
    if (encounter) {
      commit((current) => {
        const previous = current.encounters.find((item) => item.id === encounter.id)?.entities.find((candidate) => candidate.id === entity.id);
        const next = {
          ...current,
          encounters: current.encounters.map((item) => item.id === encounter.id
            ? withLog({ ...item, entities: item.entities.map((candidate) => candidate.id === entity.id ? entity : candidate) }, "system", `${entity.name} updated.`)
            : item),
        };
        return previous && entity.rosterId ? syncLinkedRosterEntity(next, entity) : next;
      });
    }
    setEditingEntityId(null);
    setEditingEntityDirty(false);
    window.setTimeout(() => document.getElementById(`entity-options-${entity.id}`)?.focus(), 0);
  };

  const cancelEditingEntity = () => {
    const entityId = editingEntityId;
    setEditingEntityId(null);
    setEditingEntityDirty(false);
    if (entityId) window.setTimeout(() => document.getElementById(`entity-options-${entityId}`)?.focus(), 0);
  };

  const mutateEntity = (entityId: string, updater: (entity: EncounterEntity) => EncounterEntity, logMessage?: string) => {
    if (!encounter) return;
    commit((current) => {
      let updatedEntity: EncounterEntity | undefined;
      const next = {
        ...current,
        encounters: current.encounters.map((item) => {
          if (item.id !== encounter.id) return item;
          const changed = {
            ...item,
            entities: item.entities.map((entity) => {
              if (entity.id !== entityId) return entity;
              updatedEntity = updater(entity);
              return updatedEntity;
            }),
          };
          return logMessage ? withLog(changed, "system", logMessage) : changed;
        }),
      };
      return updatedEntity ? syncLinkedRosterEntity(next, updatedEntity) : next;
    });
  };

  const healthAction = (entity: EncounterEntity, action: "damage" | "heal" | "temp" | "set", amount: number) => {
    const result = action === "damage" ? damageEntity(entity, amount) : action === "heal" ? healEntity(entity, amount) : action === "temp" ? setTempHP(entity, amount) : setEntityHP(entity, amount);
    const nextEntity = syncStabilizedEffect(result.entity);
    updateEncounter((current) => {
      let next = { ...current, entities: current.entities.map((item) => item.id === entity.id ? nextEntity : item) };
      next = withLog(next, action === "damage" ? "damage" : action === "heal" ? "healing" : "system", result.message);
      if (result.secondaryMessage) next = withLog(next, nextEntity.isDead ? "death" : nextEntity.isDying ? "death" : "healing", result.secondaryMessage);
      return next;
    });
  };

  const configureHealth = (entity: EncounterEntity, currentHP?: number, maxHP?: number) => {
    if (!encounter) return;
    const linked = maxHP !== undefined ? linkedStatBlockEntities(entity, encounter.entities) : [entity];
    if (maxHP !== undefined && linked.length > 1) {
      setIndependentName(suggestedIndependentName(entity, encounter.entities));
      setSharedStatBlockUpdate({ entityId: entity.id, statBlock: entity.statBlock, armorClass: entity.armorClass, maxHP, entityIds: linked.map((candidate) => candidate.id), mode: "linked" });
      return;
    }
    commit((current) => {
      let updatedEntity: EncounterEntity | undefined;
      const next = {
        ...current,
        encounters: current.encounters.map((item) => item.id === encounter.id
          ? { ...item, entities: item.entities.map((candidate) => {
            if (candidate.id !== entity.id) return candidate;
            updatedEntity = syncStabilizedEffect(configureEntityHP(candidate, currentHP, maxHP));
            return updatedEntity;
          }) }
          : item),
      };
      return maxHP !== undefined && updatedEntity ? syncLinkedRosterEntity(next, updatedEntity) : next;
    });
  };

  const quickUpdateEntity = (entity: EncounterEntity, changes: Partial<Pick<EncounterEntity, "name" | "armorClass">>) => {
    if (!encounter) return;
    if (changes.armorClass !== undefined) {
      const linked = linkedStatBlockEntities(entity, encounter.entities);
      if (linked.length > 1) {
        setIndependentName(suggestedIndependentName(entity, encounter.entities));
        setSharedStatBlockUpdate({ entityId: entity.id, statBlock: entity.statBlock, armorClass: changes.armorClass, maxHP: entity.maxHP, entityIds: linked.map((candidate) => candidate.id), mode: "linked" });
        return;
      }
    }
    mutateEntity(entity.id, (current) => {
      const requestedName = changes.name?.trim();
      if (!requestedName) return { ...current, ...changes };
      const name = nextAvailableEntityName(requestedName, encounter.entities.filter((candidate) => candidate.id !== entity.id).map((candidate) => candidate.name));
      const changedFamily = canonicalEntityName(name).toLocaleLowerCase() !== canonicalEntityName(current.name).toLocaleLowerCase();
      return { ...current, ...changes, name, ...(changedFamily ? { statBlockLinkId: null, statBlockUnlinked: true } : {}) };
    });
  };

  const applyStatBlockUpdate = (update: SharedStatBlockUpdate, share: boolean, renamedEntity?: string) => {
    if (!encounter) return;
    const targetIds = new Set(share ? update.entityIds : [update.entityId]);
    commit((current) => {
      const currentEncounter = current.encounters.find((item) => item.id === encounter.id);
      const source = currentEncounter?.entities.find((entity) => entity.id === update.entityId);
      if (!source) return current;
      const statBlockLinkId = share ? (source.statBlockLinkId ?? uid("stat-block")) : null;
      const updatedEntities: EncounterEntity[] = [];
      const next = {
        ...current,
        encounters: current.encounters.map((item) => item.id !== encounter.id ? item : {
          ...item,
          entities: item.entities.map((entity) => {
            if (!targetIds.has(entity.id)) return entity;
            const baseEntity = entity.id === source.id && update.replacement ? update.replacement : entity;
            const updated = syncStabilizedEffect(configureEntityHP({
              ...baseEntity,
              name: entity.id === source.id && renamedEntity ? renamedEntity : entity.name,
              armorClass: update.armorClass ?? entity.armorClass,
              statBlock: update.statBlock ? structuredClone(update.statBlock) : undefined,
              statBlockLinkId,
              statBlockUnlinked: !share,
            }, undefined, update.maxHP));
            updatedEntities.push(updated);
            return updated;
          }),
        }),
      };
      return updatedEntities.reduce((result, entity) => syncLinkedRosterEntity(result, entity), next);
    });
    setSharedStatBlockUpdate(null);
    setIndependentName("");
    setEditingEntityId(null);
    setEditingEntityDirty(false);
  };

  const requestStatBlockUpdate = (statBlock: MonsterStatBlock | undefined, armorClass?: number, maxHP?: number) => {
    if (!selectedNotesEntity || !encounter) return false;
    const linked = linkedStatBlockEntities(selectedNotesEntity, encounter.entities);
    if (linked.length > 1) {
      setIndependentName(suggestedIndependentName(selectedNotesEntity, encounter.entities));
      setSharedStatBlockUpdate({ entityId: selectedNotesEntity.id, statBlock, armorClass, maxHP, entityIds: linked.map((entity) => entity.id), mode: "linked" });
      return false;
    }
    const emptyMatches = matchingEnemyEntities(selectedNotesEntity, encounter.entities).filter((entity) => entity.id !== selectedNotesEntity.id && !entity.statBlock && !entity.statBlockUnlinked);
    if (selectedNotesEntity.type === "Enemy" && statBlock && !selectedNotesEntity.statBlockUnlinked && emptyMatches.length) {
      setSharedStatBlockUpdate({ entityId: selectedNotesEntity.id, statBlock, armorClass, maxHP, entityIds: [selectedNotesEntity.id, ...emptyMatches.map((entity) => entity.id)], mode: "create" });
      return false;
    }
    applyStatBlockUpdate({ entityId: selectedNotesEntity.id, statBlock, armorClass, maxHP, entityIds: [selectedNotesEntity.id], mode: "create" }, false);
    return true;
  };

  const linkSelectedStatBlock = () => {
    if (!selectedNotesEntity || !selectedStatBlockCandidate?.statBlock || !encounter) return;
    const statBlockLinkId = selectedStatBlockCandidate.statBlockLinkId ?? uid("stat-block");
    const sourceLinkedIds = new Set(linkedStatBlockEntities(selectedStatBlockCandidate, encounter.entities).map((entity) => entity.id));
    sourceLinkedIds.add(selectedStatBlockCandidate.id);
    sourceLinkedIds.add(selectedNotesEntity.id);
    commit((current) => {
      let updatedEntity: EncounterEntity | undefined;
      const next = {
        ...current,
        encounters: current.encounters.map((item) => item.id !== encounter.id ? item : {
          ...item,
          entities: item.entities.map((entity) => {
            if (entity.id === selectedNotesEntity.id) {
              updatedEntity = configureEntityHP({ ...entity, armorClass: selectedStatBlockCandidate.armorClass, statBlock: structuredClone(selectedStatBlockCandidate.statBlock!), statBlockLinkId, statBlockUnlinked: false }, undefined, selectedStatBlockCandidate.maxHP);
              return updatedEntity;
            }
            return sourceLinkedIds.has(entity.id) ? { ...entity, statBlockLinkId, statBlockUnlinked: false } : entity;
          }),
        }),
      };
      return updatedEntity ? syncLinkedRosterEntity(next, updatedEntity) : next;
    });
    showToast(`${selectedNotesEntity.name} now shares ${canonicalEntityName(selectedStatBlockCandidate.name)}’s stat block.`);
  };

  const unlinkSelectedStatBlock = () => {
    if (!selectedNotesEntity || !encounter) return;
    const name = suggestedIndependentName(selectedNotesEntity, encounter.entities);
    mutateEntity(selectedNotesEntity.id, (entity) => ({ ...entity, name, statBlockLinkId: null, statBlockUnlinked: true }));
    showToast(`${name} now has an independent stat block.`);
  };

  const resolveDeathSave = (entity: EncounterEntity, kind: "success" | "failure") => {
    const result = recordDeathSave(entity, kind);
    const nextEntity = syncStabilizedEffect(result.entity);
    updateEncounter((current) => {
      let next = { ...current, entities: current.entities.map((item) => item.id === entity.id ? nextEntity : item) };
      next = withLog(next, nextEntity.isDead ? "death" : "system", result.message);
      if (result.secondaryMessage) next = withLog(next, nextEntity.isDead ? "death" : "healing", result.secondaryMessage);
      return next;
    });
  };

  const createNewEncounter = () => {
    if (!newName.trim()) return;
    const next = createEncounter(newName.trim(), newRuleset);
    next.entities = snapshot?.roster.filter((member) => newRosterIds.has(member.rosterId)).map(instantiateRosterMember) ?? [];
    commit((current) => ({ ...current, encounters: [...current.encounters, next], settings: { ...current.settings, activeEncounterId: next.id } }));
    setDialog(null);
    setNewName("");
    setNewRosterIds(new Set());
  };

  const createDraftEntity = (type: EncounterEntity["type"]) => createEntity({ name: "", type, maxHP: 1, currentHP: 1, armorClass: 10 });

  const persistDraft = (entity: EncounterEntity, statBlockSourceId?: string) => {
    setLastDraftType(entity.type);
    saveEntity(entity, statBlockSourceId);
    return entity.type;
  };

  const startAddingEntity = () => {
    if (!encounter) return;
    if (encounter.mode !== "staging" && !combatEditing) { setEditor({}); return; }
    const nextType = draftEntity?.type ?? lastDraftType;
    if (draftEntity?.name.trim()) persistDraft(draftEntity);
    setDraftEntity(createDraftEntity(nextType));
  };

  const completeDraft = (entity: EncounterEntity, statBlockSourceId?: string) => {
    persistDraft(entity, statBlockSourceId);
    setDraftEntity(null);
  };

  const applyNamedEffect = (entity: EncounterEntity, definitionId: "dodge-action" | "readied-action") => {
    const definition = BUILTIN_EFFECTS.find((effect) => effect.id === definitionId);
    if (!definition) return;
    const label = definitionId === "dodge-action" ? "takes the Dodge action" : "readies an action";
    const source = { entityId: entity.id, currentRound: encounter?.activeEntityId === entity.id ? encounter.round : undefined };
    mutateEntity(entity.id, (current) => current.effects.some((effect) => effect.definitionId === definitionId) ? current : { ...current, effects: [...current.effects, activateEffect(definition, 1, source)] }, `${entity.name} ${label}.`);
  };

  const toggleReaction = (entity: EncounterEntity) => {
    const definition = BUILTIN_EFFECTS.find((effect) => effect.id === "reaction-used");
    if (!definition || entity.isDead || entity.currentHP <= 0) return;
    mutateEntity(entity.id, (current) => current.reactionUsed
      ? { ...current, reactionUsed: false, effects: current.effects.filter((effect) => effect.definitionId !== "reaction-used") }
      : { ...current, reactionUsed: true, effects: [...current.effects.filter((effect) => effect.definitionId !== "reaction-used"), activateEffect(definition, 1, { entityId: entity.id, currentRound: encounter?.activeEntityId === entity.id ? encounter.round : undefined })] },
    `${entity.name}'s reaction ${entity.reactionUsed ? "cleared" : "used"}.`);
  };

  const importDocument = async (file?: File) => {
    if (!file) return;
    try {
      const value = await readJsonFile(file) as Record<string, unknown>;
      if (importKind === "encounter" && value.type === "dmtools-encounter" && value.encounter && typeof value.encounter === "object") {
        const imported = structuredClone(value.encounter) as Encounter;
        imported.id = uid("encounter");
        imported.name += " (imported)";
        imported.entities = imported.entities.map((entity) => normalizeEntityHealth({ ...entity, id: uid("entity"), lethalOverflow: entity.lethalOverflow ?? 0 }));
        imported.activeEntityId = null;
        imported.mode = "staging";
        commit((current) => ({ ...current, encounters: [...current.encounters, imported], settings: { ...current.settings, activeEncounterId: imported.id } }));
        showToast("Encounter imported.");
      } else if (importKind === "roster" && value.type === "dmtools-roster" && Array.isArray(value.roster)) {
        const imported = (value.roster as RosterMember[]).map((member) => ({ ...structuredClone(member), id: uid("entity"), rosterId: uid("roster"), initiative: null, hasRolledInitiative: false }));
        commit((current) => ({ ...current, roster: [...current.roster, ...imported] }));
        showToast(`${imported.length} roster ${imported.length === 1 ? "entry" : "entries"} imported.`);
      } else if (importKind === "bestiary" && value.type === "dmtools-bestiary" && Array.isArray(value.bestiary)) {
        const imported = (value.bestiary as CreatureTemplate[]).map((creature) => ({ ...structuredClone(creature), id: uid("creature"), sourceRef: undefined }));
        commit((current) => ({ ...current, bestiary: [...current.bestiary, ...imported] }));
        showToast(`${imported.length} bestiary ${imported.length === 1 ? "entry" : "entries"} imported.`);
      } else if (importKind === "backup" && value.type === "dmtools-backup" && value.snapshot && typeof value.snapshot === "object") {
        const raw = value.snapshot as AppSnapshot;
        const restored: AppSnapshot = {
          ...raw,
          bestiary: raw.bestiary ?? [],
          encounters: raw.encounters.map((item) => ({ ...item, entities: item.entities.map((entity) => normalizeEntityHealth({ ...entity, lethalOverflow: entity.lethalOverflow ?? 0 })) })),
          roster: raw.roster.map((member) => normalizeEntityHealth({ ...member, lethalOverflow: member.lethalOverflow ?? 0 }) as RosterMember),
        };
        setConfirmation({
          title: "Restore full backup?",
          message: "This replaces every local encounter, roster entry, note, and content pack in this browser.",
          actionLabel: "Restore backup",
          action: () => { setSnapshot(restored); setConfirmation(null); showToast("Backup restored."); },
        });
      } else if (importKind === "bestiary") {
        const pack = validateContentPack(value);
        if (pack.valid && pack.document) {
          commit((current) => ({ ...current, contentPacks: [...current.contentPacks.filter((item) => item.pack.id !== pack.document!.pack.id), pack.document!] }));
          showToast("Content pack installed.");
        } else showToast("That file does not contain a bestiary or creature content pack.");
      } else showToast(`That file does not contain ${importKind === "encounter" ? "an encounter" : importKind === "roster" ? "a roster" : "a backup"}.`);
    } catch { showToast("Import failed: invalid JSON."); }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input, textarea, select")) return;
      if (!encounter) return;
      if (dialog || editor || editingEntityId || confirmation) return;
      if ((event.key === " " || event.key === "ArrowRight") && encounter.mode === "active") { event.preventDefault(); updateEncounter(nextTurn); }
      else if (event.key === "ArrowLeft" && encounter.mode === "active") updateEncounter(previousTurn);
      else if (event.key.toLowerCase() === "n") startAddingEntity();
      else if (event.key.toLowerCase() === "s" && encounter.mode === "staging") updateEncounter(sortInitiative);
      else if (event.key.toLowerCase() === "e" && encounter.mode === "active") updateEncounter(endRound);
      else if (event.key.toLowerCase() === "l") commit((current) => ({ ...current, settings: { ...current.settings, activePanel: current.settings.activePanel === "log" ? null : "log" } }));
      else if (event.key.toLowerCase() === "r") toggleRosterPanel();
      else if (event.key.toLowerCase() === "b") toggleBestiaryPanel();
      else if (event.key.toLowerCase() === "m") setCombatEditing((current) => encounter.mode === "active" ? !current : current);
      else if (event.key === "?") setDialog("shortcuts");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [encounter, updateEncounter, commit, draftEntity, dialog, editor, editingEntityId, confirmation]);

  if (!snapshot || !encounter) return <div className="loading-screen"><div className="loading-die">20</div><span>Opening encounter…</span></div>;

  const panel = snapshot.settings.activePanel === "roster" || snapshot.settings.activePanel === "bestiary" ? null : snapshot.settings.activePanel;
  const rosterOpen = snapshot.settings.rosterOpen ?? snapshot.settings.activePanel === "roster";
  const bestiaryOpen = snapshot.settings.bestiaryOpen ?? snapshot.settings.activePanel === "bestiary";
  const rosterIds = new Set(encounter.entities.map((entity) => entity.rosterId).filter(Boolean) as string[]);
  const storedRosterIds = new Set(snapshot.roster.map((member) => member.rosterId));
  const asidePanelProps = {
    log: encounter.log,
    sessionNotes: snapshot.sessionNotes,
    selectedEntity: selectedNotesEntity,
    roster: snapshot.roster,
    encounterEntityIds: rosterIds,
    packs: snapshot.contentPacks,
    onAddNote: (text: string) => notesEntityId ? mutateEntity(notesEntityId, (entity) => ({ ...entity, notes: [...entity.notes, { id: uid("note"), timestamp: Date.now(), text }] })) : commit((current) => ({ ...current, sessionNotes: [...current.sessionNotes, { id: uid("note"), timestamp: Date.now(), text }] })),
    onUpdateNote: (id: string, text: string) => notesEntityId ? mutateEntity(notesEntityId, (entity) => ({ ...entity, notes: entity.notes.map((note) => note.id === id ? { ...note, text } : note) })) : commit((current) => ({ ...current, sessionNotes: current.sessionNotes.map((note) => note.id === id ? { ...note, text } : note) })),
    onRemoveNote: (id: string, text: string) => setConfirmation({ title: "Delete this note?", message: `“${text}”`, actionLabel: "Delete Entry", className: "modal--note-delete", hideClose: true, action: () => { if (notesEntityId) mutateEntity(notesEntityId, (entity) => ({ ...entity, notes: entity.notes.filter((note) => note.id !== id) })); else commit((current) => ({ ...current, sessionNotes: current.sessionNotes.filter((note) => note.id !== id) })); setConfirmation(null); } }),
    onUpdateStatBlock: requestStatBlockUpdate,
    onSaveBestiary: (block: MonsterStatBlock, armorClass: number, maxHP: number) => selectedNotesEntity && saveEntityToBestiary({ ...selectedNotesEntity, statBlock: block, armorClass, maxHP }),
    statBlockLinkedCount: selectedLinkedEnemies.length,
    statBlockLinkCandidate: selectedStatBlockCandidate,
    onLinkStatBlock: linkSelectedStatBlock,
    onUnlinkStatBlock: unlinkSelectedStatBlock,
    onRosterToggle: (member: RosterMember) => rosterIds.has(member.rosterId) ? updateEncounter((current) => removeEntity(current, current.entities.find((entity) => entity.rosterId === member.rosterId)?.id ?? "")) : updateEncounter((current) => ({ ...current, entities: [...current.entities, instantiateRosterMember(member)] })),
    onRosterEdit: (member: RosterMember) => setEditor({ entity: member, rosterOnly: true }),
    onRosterArchive: (member: RosterMember, archived: boolean) => commit((current) => ({ ...current, roster: current.roster.map((item) => item.rosterId === member.rosterId ? { ...item, archived } : item), encounters: archived ? current.encounters.map((item) => item.id === encounter.id ? removeEntity(item, item.entities.find((entity) => entity.rosterId === member.rosterId)?.id ?? "") : item) : current.encounters })),
    onRosterRemove: (member: RosterMember) => setConfirmation({ title: `Delete ${member.name} from the roster?`, message: "The reusable roster entry will be deleted. Existing encounter copies remain.", actionLabel: "Delete roster entry", action: () => { commit((current) => ({ ...current, roster: current.roster.filter((item) => item.rosterId !== member.rosterId) })); setConfirmation(null); } }),
    onRosterCreate: () => setEditor({ rosterOnly: true }),
    onPackInstall: (pack: ContentPackDocument) => { commit((current) => ({ ...current, contentPacks: [...current.contentPacks.filter((item) => item.pack.id !== pack.pack.id), pack] })); showToast(`${pack.pack.name} installed.`); },
    onPackRemove: (packId: string) => setConfirmation({ title: "Uninstall content pack?", message: "The pack will be removed from this browser. Existing encounter data is not deleted.", actionLabel: "Uninstall pack", action: () => { commit((current) => ({ ...current, contentPacks: current.contentPacks.filter((pack) => pack.pack.id !== packId) })); setConfirmation(null); } }),
  };
  const rosterAside = rosterOpen && <AsidePanel panel="roster" onClose={toggleRosterPanel} {...asidePanelProps} />;
  const bestiaryAside = bestiaryOpen && <aside className="aside-panel aside-panel--bestiary"><button className="aside-close" aria-label="Close bestiary" onClick={toggleBestiaryPanel}><img src="/icons/ui/log-close.svg" alt="" /></button><BestiaryPanel entries={bestiaryEntries} encounterRuleset={encounter.rulesetId} onAdd={addBestiaryCreature} onEdit={setBestiaryEditor} onDuplicate={duplicateBestiaryEntry} onRemove={removeBestiaryEntry} /></aside>;
  const utilityAside = panel && <AsidePanel panel={panel} onClose={() => commit((current) => ({ ...current, settings: { ...current.settings, activePanel: null } }))} {...asidePanelProps} />;

  return <div className={`app-shell${panel || rosterOpen || bestiaryOpen ? " has-aside" : ""}`}>
    <Header
      encounter={encounter}
      saveStatus={saveStatus}
      onRename={() => { setNewName(encounter.name); setDialog("rename"); }}
      onNew={() => { setNewName(""); setNewRuleset("dnd5e-2014-srd-5.1"); setNewRosterIds(new Set()); setDialog("new"); }}
      onLoad={() => setDialog("load")}
      onSave={() => { void saveSnapshot(snapshot).then(() => showToast("Saved locally.")); }}
      onPanel={togglePanel}
      onExport={() => setDialog("export")}
      onExportAll={() => exportAll(snapshot)}
      onImport={() => setDialog("import")}
      onDelete={() => setDialog("delete")}
      onShortcuts={() => setDialog("shortcuts")}
      onEndCombat={() => setConfirmation({ title: "End active combat?", message: "The encounter returns to staging. The combat log and entity state are kept.", actionLabel: "Return to staging", action: () => { setCombatEditing(false); updateEncounter(returnToStaging); setConfirmation(null); } })}
      onRemoveDead={() => setConfirmation({ title: "Remove all dead entities?", message: "Every entity marked dead will be removed from this encounter.", actionLabel: "Remove dead", action: () => { updateEncounter((current) => ({ ...current, entities: current.entities.filter((entity) => !entity.isDead), activeEntityId: current.entities.find((entity) => entity.id === current.activeEntityId && !entity.isDead)?.id ?? current.entities.find((entity) => !entity.isDead)?.id ?? null })); setConfirmation(null); } })}
      onClearEffects={() => setConfirmation({ title: "Clear every effect?", message: "All conditions, reactions, and temporary action effects will be removed from this encounter.", actionLabel: "Clear effects", action: () => { updateEncounter((current) => withLog({ ...current, entities: current.entities.map((entity) => ({ ...entity, effects: [], reactionUsed: false })) }, "system", "All effects cleared.")); setConfirmation(null); } })}
      onResetHP={() => setConfirmation({ title: "Reset all hit points?", message: "Every entity will return to maximum HP and lose temporary HP and death-save state.", actionLabel: "Reset HP", action: () => { updateEncounter((current) => withLog({ ...current, entities: current.entities.map((entity) => syncStabilizedEffect({ ...entity, currentHP: entity.maxHP, tempHP: 0, lethalOverflow: 0, isDead: entity.maxHP === 0, isDying: false, isUnconscious: false, deathSaveSuccesses: 0, deathSaveFailures: 0 })) }, "healing", "All HP reset to maximum.")); setConfirmation(null); } })}
    />
    <main className={`workspace${rosterOpen || bestiaryOpen ? " workspace--roster-aside" : ""}${panel === "library" ? " workspace--library-aside" : panel ? " workspace--utility-aside" : ""}`}>
      {rosterAside}
      {bestiaryAside}
      <TurnOrder
        encounter={encounter}
        rosterIds={storedRosterIds}
        combatEditing={combatEditing}
        editingEntityId={editingEntityId}
        onEdit={startEditingEntity}
        onSaveEdit={saveEditedEntity}
        onCancelEdit={cancelEditingEntity}
        onEditDirtyChange={setEditingEntityDirty}
        onHealthAction={healthAction}
        onConfigureHealth={configureHealth}
        onInitiativeChange={(entity, initiative) => mutateEntity(entity.id, (current) => setInitiative(current, initiative))}
        onQuickUpdate={quickUpdateEntity}
        effects={effects}
        onAddEffect={(entity: EncounterEntity, definition: EffectDefinition, duration: number | null) => mutateEntity(entity.id, (current) => current.effects.some((effect) => effect.definitionId === definition.id) ? current : { ...current, effects: [...current.effects, activateEffect(definition, duration, { entityId: encounter.activeEntityId ?? entity.id, currentRound: encounter.activeEntityId ? encounter.round : undefined })] }, `${definition.name} applied to ${entity.name}.`)}
        onUpdateEffect={(entity: EncounterEntity, effectId: string, changes: Partial<ActiveEffect>) => mutateEntity(entity.id, (current) => ({ ...current, effects: current.effects.map((effect) => effect.id === effectId ? { ...effect, ...changes } : effect) }))}
        onRemoveEffect={(entity, effectId) => mutateEntity(entity.id, (current) => ({ ...current, effects: current.effects.filter((effect) => effect.id !== effectId) }))}
        onRemove={(entity) => setConfirmation({ title: `Remove ${entity.name}?`, message: "This removes the entity from this encounter. A linked party-roster entry is kept.", actionLabel: "Remove entity", action: () => { updateEncounter((current) => removeEntity(current, entity.id)); if (editingEntityId === entity.id) { setEditingEntityId(null); setEditingEntityDirty(false); } setConfirmation(null); } })}
        onDuplicate={(entity) => updateEncounter((current) => ({ ...current, entities: [...current.entities, { ...structuredClone(entity), id: uid("entity"), name: nextDuplicateEntityName(entity.name, current.entities.map((item) => item.name)), isPersistent: false, rosterId: null }] }))}
        onToggleRoster={toggleEntityRoster}
        onSaveToBestiary={saveEntityToBestiary}
        onDelay={() => updateEncounter(delayTurn)}
        onHold={(entity) => applyNamedEffect(entity, "readied-action")}
        onDodge={(entity) => applyNamedEffect(entity, "dodge-action")}
        onReaction={toggleReaction}
        onDeathSave={resolveDeathSave}
        onStabilize={(entity) => { const result = stabilizeEntity(entity); mutateEntity(entity.id, () => syncStabilizedEffect(result.entity), result.message); }}
        onRevive={(entity) => { const result = reviveEntity(entity); mutateEntity(entity.id, () => syncStabilizedEffect(result.entity), result.message); }}
        onNotes={(entity) => { setNotesEntityId(entity.id); commit((current) => ({ ...current, settings: { ...current.settings, activePanel: "notes" } })); }}
        onReorder={(from, to) => updateEncounter((current) => { const entities = [...current.entities]; const [moved] = entities.splice(from, 1); entities.splice(to, 0, moved); return { ...current, entities }; })}
        onAdd={startAddingEntity}
        draftEntity={draftEntity}
        onDraftChange={setDraftEntity}
        onDraftComplete={completeDraft}
        onDraftCancel={() => setDraftEntity(null)}
      />
      {panel === "library" && utilityAside}
      <UtilityRail panel={panel} lastPanel={lastPanel} onSelect={togglePanel} />
      {panel && panel !== "library" && utilityAside}
    </main>
    <ManagementBar
      encounter={encounter}
      combatEditing={combatEditing}
      onRoster={toggleRosterPanel}
      onBestiary={toggleBestiaryPanel}
      onSort={() => updateEncounter(sortInitiative)}
      onRollAll={() => updateEncounter(rollAll)}
      onRollType={(type) => updateEncounter((current) => rollAll(current, type))}
      onBegin={() => { setCombatEditing(false); updateEncounter(beginCombat); }}
      onPrevious={() => updateEncounter(previousTurn)}
      onNext={() => updateEncounter(nextTurn)}
      onEditMode={() => setCombatEditing((current) => !current)}
      onResetInitiative={() => setConfirmation({ title: "Reset initiative?", message: "All initiative scores will be cleared and the encounter will return to staging.", actionLabel: "Reset initiative", action: () => { updateEncounter(resetInitiative); setConfirmation(null); } })}
    />

    <input ref={importInput} hidden type="file" accept="application/json,.json" onChange={(event) => { void importDocument(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
    {editor && <EntityEditor entity={editor.entity} title={editor.rosterOnly ? (editor.entity ? "Edit Character" : "Add Character") : undefined} rosterOnly={editor.rosterOnly} availableCreatures={encounter.entities} onSave={saveEntity} onClose={() => setEditor(null)} />}
    {bestiaryEditor && <BestiaryEditor entry={bestiaryEditor} onSave={saveBestiaryEntry} onClose={() => setBestiaryEditor(null)} />}
    {dialog === "new" && <Modal
      title="New Encounter"
      hideClose
      className={`new-encounter-modal${snapshot.roster.length ? " has-roster" : ""}`}
      onClose={() => setDialog(null)}
      footer={<><Button tone="quiet" onClick={() => setDialog(null)}>Cancel</Button><Button tone="primary" disabled={!newName.trim()} onClick={createNewEncounter}>Create encounter</Button></>}
    >
      <div className="form-stack new-encounter-form">
        <label className="field field--full"><span>Encounter Name</span><input autoFocus placeholder="Enter a name" value={newName} onInput={(event) => setNewName(event.currentTarget.value)} /></label>
        <label className="field field--full"><span>Ruleset</span><SelectField ariaLabel="Ruleset" value={newRuleset} onValueChange={setNewRuleset} options={Object.values(RULESETS).map((ruleset) => ({ value: ruleset.id, label: `D&D ${ruleset.shortName}` }))} /></label>
        {snapshot.roster.length > 0 && <fieldset className="new-encounter-roster">
          <legend>Add from Roster</legend>
          <div>{snapshot.roster.map((member) => {
            const selected = newRosterIds.has(member.rosterId);
            return <button
              key={member.rosterId}
              type="button"
              className={`new-roster-card new-roster-card--${member.type.toLowerCase()}${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => setNewRosterIds((current) => { const next = new Set(current); if (selected) next.delete(member.rosterId); else next.add(member.rosterId); return next; })}
            >
              <RosterCardContent member={member} />
            </button>;
          })}</div>
        </fieldset>}
      </div>
    </Modal>}
    {dialog === "rename" && <Modal title="Rename Encounter" onClose={() => setDialog(null)} footer={<><Button tone="quiet" onClick={() => setDialog(null)}>Cancel</Button><Button tone="primary" onClick={() => { updateEncounter((current) => ({ ...current, name: newName.trim() || current.name })); setDialog(null); }}>Rename</Button></>}><label className="field field--full"><span>Encounter name</span><input autoFocus value={newName} onInput={(event) => setNewName(event.currentTarget.value)} /></label></Modal>}
    {dialog === "load" && <Modal title="Load Encounter" onClose={() => setDialog(null)}><div className="encounter-list">{snapshot.encounters.map((item) => <button key={item.id} className={item.id === encounter.id ? "is-current" : ""} onClick={() => { commit((current) => ({ ...current, settings: { ...current.settings, activeEncounterId: item.id } })); setDialog(null); }}><div><strong>{item.name}</strong><small>{RULESETS[item.rulesetId]?.shortName ?? "5e"} · {item.entities.length} entities</small></div><span>{item.mode === "active" ? `Round ${item.round}` : "Staging"}</span></button>)}</div></Modal>}
    {dialog === "delete" && <Modal title="Delete Encounter" onClose={() => setDialog(null)} footer={<><Button tone="quiet" onClick={() => setDialog(null)}>Cancel</Button><Button tone="danger" onClick={() => { const remaining = snapshot.encounters.filter((item) => item.id !== encounter.id); const next = remaining[0] ?? createEncounter(); setSnapshot({ ...snapshot, encounters: remaining.length ? remaining : [next], settings: { ...snapshot.settings, activeEncounterId: next.id } }); setDialog(null); }}>Delete encounter</Button></>}><p className="confirm-copy">Delete <strong>{encounter.name}</strong>? This removes its entities and combat log from this browser.</p></Modal>}
    {dialog === "shortcuts" && <Modal title="Keyboard shortcuts" onClose={() => setDialog(null)}><dl className="shortcut-list"><div><dt>Space / →</dt><dd>Next turn</dd></div><div><dt>←</dt><dd>Previous turn</dd></div><div><dt>N</dt><dd>New entity</dd></div><div><dt>S</dt><dd>Sort initiative</dd></div><div><dt>E</dt><dd>End round</dd></div><div><dt>L</dt><dd>Combat log</dd></div><div><dt>R</dt><dd>Party roster</dd></div><div><dt>B</dt><dd>Bestiary</dd></div><div><dt>M</dt><dd>Edit entities during combat</dd></div><div><dt>?</dt><dd>Show shortcuts</dd></div><div><dt>Esc</dt><dd>Close dialog</dd></div></dl></Modal>}
    {dialog === "export" && <Modal title="Export data" onClose={() => setDialog(null)}><div className="transfer-choices">
      <button onClick={() => { exportEncounter(encounter); setDialog(null); }}><img src="/icons/ui/combat.svg" alt="" /><span><strong>Encounter</strong><small>Current entities, turn state, and combat log</small></span></button>
      <button onClick={() => { exportRoster(snapshot.roster); setDialog(null); }}><img src="/icons/ui/roster.svg" alt="" /><span><strong>Roster</strong><small>Reusable player characters, allies, and NPCs</small></span></button>
      <button onClick={() => { exportBestiary([...snapshot.bestiary, ...snapshot.contentPacks.flatMap((pack) => pack.content.creatures)]); setDialog(null); }}><img src="/icons/ui/enemy.svg" alt="" /><span><strong>Bestiary</strong><small>All saved and installed creatures</small></span></button>
    </div></Modal>}
    {dialog === "import" && <Modal title="Import data" onClose={() => setDialog(null)}><div className="transfer-choices">
      {([[
        "encounter", "Encounter", "Current entities, turn state, and combat log", "/icons/ui/combat.svg"
      ], ["roster", "Roster", "Reusable player characters, allies, and NPCs", "/icons/ui/roster.svg"], ["bestiary", "Bestiary", "Saved creatures or a creature content pack", "/icons/ui/enemy.svg"]] as const).map(([kind, title, description, icon]) => <button key={kind} onClick={() => { setImportKind(kind); setDialog(null); window.setTimeout(() => importInput.current?.click(), 0); }}><img src={icon} alt="" /><span><strong>{title}</strong><small>{description}</small></span></button>)}
      <button className="transfer-choice--secondary" onClick={() => { setImportKind("backup"); setDialog(null); window.setTimeout(() => importInput.current?.click(), 0); }}><img src="/icons/ui/load.svg" alt="" /><span><strong>Full backup</strong><small>Replace local data from a complete backup</small></span></button>
    </div></Modal>}
    {sharedStatBlockUpdate && <Modal
      title={sharedStatBlockUpdate.mode === "linked" ? "Update shared stat block?" : "Share this stat block?"}
      className="modal--shared-stat-block"
      onClose={() => { setSharedStatBlockUpdate(null); setIndependentName(""); }}
      footer={sharedStatBlockUpdate.mode === "linked"
        ? <><Button tone="quiet" disabled={!independentName.trim()} onClick={() => {
            const entity = encounter.entities.find((candidate) => candidate.id === sharedStatBlockUpdate.entityId);
            const name = nextAvailableEntityName(independentName, encounter.entities.filter((candidate) => candidate.id !== entity?.id).map((candidate) => candidate.name));
            applyStatBlockUpdate(sharedStatBlockUpdate, false, name);
          }}>Unlink and save</Button><Button tone="primary" onClick={() => applyStatBlockUpdate(sharedStatBlockUpdate, true)}>Update {sharedStatBlockUpdate.entityIds.length} enemies</Button></>
        : <><Button tone="quiet" onClick={() => applyStatBlockUpdate(sharedStatBlockUpdate, false)}>Only this enemy</Button><Button tone="primary" onClick={() => applyStatBlockUpdate(sharedStatBlockUpdate, true)}>Share with {sharedStatBlockUpdate.entityIds.length - 1} {sharedStatBlockUpdate.entityIds.length === 2 ? "match" : "matches"}</Button></>}
    >
      {sharedStatBlockUpdate.mode === "linked" ? <div className="shared-stat-block-copy"><p>This creature shares its stat block with {sharedStatBlockUpdate.entityIds.length - 1} other {sharedStatBlockUpdate.entityIds.length === 2 ? "enemy" : "enemies"}. Update every linked enemy, or make this one independent.</p><label className="field field--full"><span>Name for independent enemy</span><input autoFocus value={independentName} onFocus={(event) => event.currentTarget.select()} onInput={(event) => setIndependentName(event.currentTarget.value)} /></label></div> : <p className="confirm-copy">Other enemies in this encounter have the same creature name. Sharing keeps their AC, maximum HP, abilities, traits, and actions together.</p>}
    </Modal>}
    {confirmation && <Modal title={confirmation.title} onClose={() => setConfirmation(null)} hideClose={confirmation.hideClose} className={confirmation.className} footer={<><Button tone="quiet" onClick={() => setConfirmation(null)}>Cancel</Button><Button tone="danger" onClick={confirmation.action}>{confirmation.actionLabel}</Button></>}><p className="confirm-copy">{confirmation.message}</p></Modal>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
