import type { ContentPackDocument, RulesetId } from "../domain/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  document?: ContentPackDocument;
}

const RULESETS = new Set<RulesetId>(["dnd5e-2014-srd-5.1", "dnd5e-2024-srd-5.2.1"]);

export function validateContentPack(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { valid: false, errors: ["The document must be a JSON object."] };
  const document = input as Partial<ContentPackDocument>;
  if (document.schemaVersion !== 1) errors.push("schemaVersion must currently be 1.");
  if (!document.pack || typeof document.pack !== "object") errors.push("pack is required.");
  if (!document.content || typeof document.content !== "object") errors.push("content is required.");
  if (document.pack) {
    if (!document.pack.id || !/^[a-z0-9][a-z0-9-]*$/.test(document.pack.id)) errors.push("pack.id must use lowercase letters, numbers, and hyphens.");
    if (!document.pack.name?.trim()) errors.push("pack.name is required.");
    if (!document.pack.sourceVersion?.trim()) errors.push("pack.sourceVersion is required.");
    if (!Array.isArray(document.pack.rulesetCompatibility) || !document.pack.rulesetCompatibility.length) errors.push("pack.rulesetCompatibility must contain at least one ruleset.");
    else document.pack.rulesetCompatibility.forEach((id) => { if (!RULESETS.has(id)) errors.push(`Unsupported ruleset: ${id}.`); });
    if (!Array.isArray(document.pack.requiredAttribution)) errors.push("pack.requiredAttribution must be an array (it may be empty).");
  }
  if (document.content) {
    for (const collection of ["conditions", "creatures", "spells"] as const) {
      if (!Array.isArray(document.content[collection])) errors.push(`content.${collection} must be an array.`);
    }
  }
  return errors.length ? { valid: false, errors } : { valid: true, errors: [], document: document as ContentPackDocument };
}
