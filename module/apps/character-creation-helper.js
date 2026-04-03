/**
 * Karaktärsskapande-wizard (CCW) — publikt API (barrel).
 *
 * Dataflöde: `actor.flags[EON_CCW_FLAG_SCOPE].wizardData` ↔ `getMergedWizardData` (merge med defaults)
 * → `collectWizardDraftFromRoot` (DOM, respekterar aktiv flik) → `persistWizardData` / `syncWizard*` →
 * `applyCharacterCreationFinish` vid Slutför (rensar wizard-flaggor).
 *
 * Implementationen är uppdelad under `./ccw/`; denna fil re-exporterar oförändrat API för befintliga importer.
 */

export * from "./ccw/ccw-constants-keys.js";
export * from "./ccw/ccw-fardighet-rules.js";
export * from "./ccw/ccw-wizard-draft-defaults.js";
export * from "./ccw/ccw-wizard-draft-merge.js";
export * from "./ccw/ccw-wizard-draft-collect.js";
export * from "./ccw/ccw-sprak-embed.js";
export * from "./ccw/ccw-wizard-sync-names.js";
export * from "./ccw/ccw-wizard-fields-pairing.js";
export * from "./ccw/ccw-wizard-finish.js";
