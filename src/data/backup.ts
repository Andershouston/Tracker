import type { AppSnapshot, Encounter } from "../domain/types";

function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportEncounter(encounter: Encounter) {
  downloadJson(`${encounter.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "encounter"}.json`, { schemaVersion: 2, type: "dmtools-encounter", encounter });
}

export function exportAll(snapshot: AppSnapshot) {
  downloadJson(`dmtools_backup_${new Date().toISOString().slice(0, 10)}.json`, { schemaVersion: 2, type: "dmtools-backup", exportedAt: new Date().toISOString(), snapshot });
}

export async function readJsonFile(file: File): Promise<unknown> {
  return JSON.parse(await file.text());
}
