import type { AppSettings, AppSnapshot, ContentPackDocument, Encounter, RosterMember, SessionNote } from "../domain/types";
import { normalizeEntityHealth } from "../domain/hit-points";

const DB_NAME = "dmtools";
const DB_VERSION = 1;
const STORES = ["encounters", "rosterMembers", "contentPacks", "sessionNotes", "settings", "metadata"] as const;

type StoreName = (typeof STORES)[number];

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, DB_VERSION);
    opening.onupgradeneeded = () => {
      const database = opening.result;
      for (const store of STORES) {
        if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: "id" });
      }
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
}

async function all<T>(database: IDBDatabase, store: StoreName): Promise<T[]> {
  const tx = database.transaction(store, "readonly");
  return request(tx.objectStore(store).getAll()) as Promise<T[]>;
}

export async function loadSnapshot(): Promise<AppSnapshot | null> {
  const database = await openDatabase();
  const [encounters, roster, packRecords, sessionNotes, settingsRecords] = await Promise.all([
    all<Encounter>(database, "encounters"),
    all<RosterMember>(database, "rosterMembers"),
    all<ContentPackDocument & { id: string }>(database, "contentPacks"),
    all<SessionNote>(database, "sessionNotes"),
    all<AppSettings & { id: string }>(database, "settings"),
  ]);
  if (!encounters.length && !settingsRecords.length) return null;
  const settingsRecord = settingsRecords[0];
  const settings: AppSettings = settingsRecord
    ? { activeEncounterId: settingsRecord.activeEncounterId, activePanel: settingsRecord.activePanel, persistenceRequested: settingsRecord.persistenceRequested }
    : { activeEncounterId: encounters[0]?.id ?? null, activePanel: "log", persistenceRequested: false };
  return {
    encounters: encounters.map((encounter) => ({ ...encounter, entities: encounter.entities.map(normalizeEntityHealth) })),
    roster: roster.map((member) => normalizeEntityHealth(member) as RosterMember),
    contentPacks: packRecords.map(({ id: _id, ...pack }) => pack),
    sessionNotes,
    settings,
  };
}

export async function saveSnapshot(snapshot: AppSnapshot): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([...STORES], "readwrite");
  for (const name of ["encounters", "rosterMembers", "contentPacks", "sessionNotes", "settings"] as StoreName[]) {
    transaction.objectStore(name).clear();
  }
  snapshot.encounters.forEach((encounter) => transaction.objectStore("encounters").put(encounter));
  snapshot.roster.forEach((member) => transaction.objectStore("rosterMembers").put(member));
  snapshot.contentPacks.forEach((pack) => transaction.objectStore("contentPacks").put({ ...pack, id: pack.pack.id }));
  snapshot.sessionNotes.forEach((note) => transaction.objectStore("sessionNotes").put(note));
  transaction.objectStore("settings").put({ id: "app", ...snapshot.settings });
  transaction.objectStore("metadata").put({ id: "schema", version: DB_VERSION, updatedAt: new Date().toISOString() });
  await transactionDone(transaction);
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}
