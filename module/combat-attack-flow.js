/**
 * Stridsflöde: målval via Eon Combat Tracker, anfall↔försvar, träffplats och skada.
 * @module combat-attack-flow
 */

import { postTrayChatMessage } from "./dice-helper.js";
import EffectHelper from "./effect-helper.js";

export const EON_ATTACK_FLAG = "eon-rpg";

/** @typedef {"melee"|"ranged"} WeaponAttackType */

/**
 * @param {Item} item
 * @returns {WeaponAttackType|null}
 */
export function getWeaponAttackType(item) {
    if (!item?.type) return null;
    const itemType = item.type.toLowerCase();
    if (itemType === "närstridsvapen" || itemType === "sköld") return "melee";
    if (itemType === "avståndsvapen") return "ranged";
    return null;
}

export class CombatAttackFlow {
    /** @returns {boolean} */
    static isEncounterActive() {
        return Boolean(game.combat?.started);
    }

    /**
     * @param {Actor} actor
     * @returns {Combatant|null}
     */
    static findCombatantForActor(actor) {
        if (!actor || !game.combat?.combatants) return null;
        const actorId = actor.id ?? actor._id;
        const tokenIds = new Set(
            (actor.getActiveTokens?.() ?? []).map((token) => token.id).filter(Boolean)
        );
        for (const c of game.combat.combatants.contents) {
            if (c.actorId === actorId) return c;
            if (c.tokenId && tokenIds.has(c.tokenId)) return c;
        }
        return null;
    }

    /**
     * @param {Combatant} attackerCombatant
     * @returns {Combatant[]}
     */
    static getSubcombatOpponents(attackerCombatant) {
        const combat = attackerCombatant?.combat ?? game.combat;
        if (!combat) return [];
        const flags = attackerCombatant.flags?.[EON_ATTACK_FLAG] ?? {};
        const groupId = flags.groupId ?? "main";
        if (groupId === "main") return [];

        return combat.combatants.contents.filter((combatant) => {
            if (combatant.id === attackerCombatant.id || combatant.defeated) return false;
            const combatantFlags = combatant.flags?.[EON_ATTACK_FLAG] ?? {};
            return (combatantFlags.groupId ?? "main") === groupId;
        });
    }

    /**
     * @param {Combatant} attackerCombatant
     * @returns {Combatant[]}
     */
    static getRangedTargets(attackerCombatant) {
        const combat = attackerCombatant?.combat ?? game.combat;
        if (!combat) return [];
        return combat.combatants.contents.filter(
            (combatant) => combatant.id !== attackerCombatant.id && !combatant.defeated
        );
    }

    /**
     * @param {Combatant|null} attackerCombatant
     * @param {WeaponAttackType|null} weaponType
     * @returns {Combatant[]}
     */
    static getTargetCandidates(attackerCombatant, weaponType) {
        if (!this.isEncounterActive() || !attackerCombatant || !weaponType) return [];
        if (weaponType === "melee") return this.getSubcombatOpponents(attackerCombatant);
        if (weaponType === "ranged") return this.getRangedTargets(attackerCombatant);
        return [];
    }

    /**
     * @param {Combat} combat
     * @param {string} attackerCombatantId
     * @returns {string|null}
     */
    static getLastTargetCombatantId(combat, attackerCombatantId) {
        const last = combat?.flags?.[EON_ATTACK_FLAG]?.lastTargets ?? {};
        const id = last[attackerCombatantId];
        return typeof id === "string" && id.length ? id : null;
    }

    /**
     * @param {Combatant[]} candidates
     * @param {string|null} preferredId
     * @returns {string|null}
     */
    static resolveDefaultTargetId(candidates, preferredId) {
        if (!candidates.length) return null;
        if (preferredId && candidates.some((c) => c.id === preferredId)) return preferredId;
        if (candidates.length === 1) return candidates[0].id;
        return candidates[0]?.id ?? null;
    }

    /**
     * @param {Combat} combat
     * @param {string} attackerCombatantId
     * @param {string} defenderCombatantId
     */
    static async saveLastTarget(combat, attackerCombatantId, defenderCombatantId) {
        if (!combat || !attackerCombatantId || !defenderCombatantId) return;
        const prev = foundry.utils.duplicate(combat.flags?.[EON_ATTACK_FLAG]?.lastTargets ?? {});
        prev[attackerCombatantId] = defenderCombatantId;
        await combat.setFlag(EON_ATTACK_FLAG, "lastTargets", prev);
    }

    static createFlowId() {
        return foundry.utils.randomID?.() ?? `flow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    /**
     * @param {Actor} attackerActor
     * @param {Item} weaponItem
     * @returns {Promise<object>}
     */
    static async buildTargetContext(attackerActor, weaponItem) {
        const weaponType = getWeaponAttackType(weaponItem);
        const encounterActive = this.isEncounterActive();
        const attackerCombatant = this.findCombatantForActor(attackerActor);
        const candidates = this.getTargetCandidates(attackerCombatant, weaponType);
        const combat = game.combat;
        const preferredId = combat && attackerCombatant
            ? this.getLastTargetCombatantId(combat, attackerCombatant.id)
            : null;
        const defaultId = this.resolveDefaultTargetId(candidates, preferredId);

        const candidateRows = candidates.map((combatant) => ({
            id: combatant.id,
            name: combatant.name ?? combatant.actor?.name ?? "?",
            actorId: combatant.actorId ?? combatant.actor?.id ?? null
        }));

        let hintKey = "eon.combatAttack.noEncounterHint";
        if (encounterActive && !attackerCombatant) {
            hintKey = "eon.combatAttack.notInEncounterHint";
        } else if (encounterActive && weaponType === "melee" && !candidates.length) {
            hintKey = "eon.combatAttack.noMeleeTargetsHint";
        } else if (encounterActive && weaponType === "ranged" && !candidates.length) {
            hintKey = "eon.combatAttack.noRangedTargetsHint";
        }

        return {
            showSelector: encounterActive && candidateRows.length > 0,
            requireTarget: encounterActive && candidateRows.length > 0,
            weaponType,
            encounterActive,
            attackerCombatantId: attackerCombatant?.id ?? null,
            candidates: candidateRows,
            defaultTargetId: defaultId,
            hintKey: candidateRows.length ? null : hintKey
        };
    }

    /**
     * @param {number} attackResult
     * @param {number} defenseResult
     * @returns {{ hit: boolean, overtag: number }}
     */
    static compareAttackDefense(attackResult, defenseResult) {
        const hit = Number(attackResult) >= Number(defenseResult);
        const overtag = hit ? Math.floor((Number(attackResult) - Number(defenseResult)) / 5) : 0;
        return { hit, overtag };
    }

    /**
     * @param {number} d10
     * @returns {{ key: string, label: string }}
     */
    static mapHitLocation(d10) {
        const roll = Math.max(1, Math.min(10, Math.floor(Number(d10) || 1)));
        /** @type {Record<number, string>} */
        const map = {
            1: "huvud",
            2: "torso",
            3: "torso",
            4: "torso",
            5: "vansterarm",
            6: "vansterarm",
            7: "hogerarm",
            8: "hogerarm",
            9: "vansterben",
            10: "hogerben"
        };
        const key = map[roll] ?? "torso";
        const labelKey = CONFIG?.EON?.kroppsdelar?.grund?.[key] ?? key;
        const label = game.i18n.has(labelKey) ? game.i18n.localize(labelKey) : labelKey;
        return { key, label, roll };
    }

    /**
     * @param {string|null|undefined} key
     * @returns {string|null}
     */
    static normalizeBodyPartKey(key) {
        const k = String(key ?? "").toLowerCase();
        return CONFIG?.EON?.kroppsdelar?.grund?.[k] ? k : null;
    }

    /**
     * @param {string} key
     * @returns {string}
     */
    static localizeBodyPart(key) {
        const labelKey = CONFIG?.EON?.kroppsdelar?.grund?.[key] ?? key;
        return game.i18n.has(labelKey) ? game.i18n.localize(labelKey) : labelKey;
    }

    /**
     * Träffplats från chattflags – 1T10-slängningen är auktoritativ om den finns.
     * @param {object} flags
     * @returns {{ key: string, label: string, roll: number|null }}
     */
    static resolveBodyPartFromFlags(flags) {
        const roll = Number(flags?.hitLocationRoll);
        if (Number.isFinite(roll) && roll >= 1 && roll <= 10) {
            const loc = this.mapHitLocation(roll);
            return { key: loc.key, label: loc.label, roll: loc.roll };
        }
        const key = this.normalizeBodyPartKey(flags?.bodyPartKey);
        if (key) {
            return {
                key,
                label: flags?.bodyPartLabel ?? this.localizeBodyPart(key),
                roll: null
            };
        }
        return { key: "torso", label: this.localizeBodyPart("torso"), roll: null };
    }

    /**
     * @param {Actor} defender
     * @param {string} bodyPartKey
     * @param {"hugg"|"kross"|"stick"} damageType
     * @returns {number}
     */
    static getArmorProtection(defender, bodyPartKey, damageType) {
        if (!defender) return 0;
        let total = 0;

        // Varelse har skada.skydd; folkslag har grundrustning istället
        if (this.isFolkslagActor(defender)) {
            const grundrustning = Number(defender.system?.harleddegenskaper?.grundrustning?.totalt ?? 0);
            if (Number.isFinite(grundrustning)) total += grundrustning;
        } else {
            const grund = defender.system?.skada?.skydd?.[damageType];
            if (Number.isFinite(Number(grund))) total += Number(grund);
        }

        for (const item of defender.items ?? []) {
            if (item.type !== "Rustning") continue;
            if (!item.system?.installningar?.buren) continue;
            for (const kroppsdelRad of item.system?.kroppsdel ?? []) {
                if ((kroppsdelRad.kroppsdel ?? kroppsdelRad.namn) !== bodyPartKey) continue;
                const skadevarde = kroppsdelRad[damageType];
                if (Number.isFinite(Number(skadevarde))) total += Number(skadevarde);
            }
        }
        return total;
    }

    /**
     * Bär försvararen rustning eller pansar på träffplatsen? Grundrustning och
     * varelsers naturliga skydd räknas inte som rustning — de är kroppsliga och är
     * just det som egenskaper som Skärande är byggda för att skära igenom.
     * @param {Actor} defender
     * @param {string} bodyPartKey
     * @returns {boolean}
     */
    static hasWornArmorAt(defender, bodyPartKey) {
        for (const item of defender?.items ?? []) {
            if (item.type !== "Rustning") continue;
            if (!item.system?.installningar?.buren) continue;

            for (const kroppsdelRad of item.system?.kroppsdel ?? []) {
                if ((kroppsdelRad.kroppsdel ?? kroppsdelRad.namn) !== bodyPartKey) continue;
                const skydd = ["hugg", "kross", "stick"]
                    .reduce((summa, typ) => summa + (Number(kroppsdelRad[typ]) || 0), 0);
                if (skydd > 0) return true;
            }
        }
        return false;
    }

    /**
     * @param {number} rawDamage
     * @param {number} armor
     * @returns {number}
     */
    static computeFinalDamage(rawDamage, armor) {
        return Math.max(0, Math.floor(Number(rawDamage) - Number(armor)));
    }

    /**
     * Slutskada → utmattning enligt referensmall (förenklad tabell).
     * @param {number} finalDamage
     * @param {{ utmattningEffects?: object[] }} [options]
     * @returns {{ utmattning: number, baseUtmattning: number, utmattningEffectApplications: object[], allvarlig: boolean, allvarligRoll: string|null }}
     */
    static damageIntervalEffects(finalDamage, options = {}) {
        const slutskada = Math.floor(Number(finalDamage) || 0);
        if (slutskada <= 0) {
            return {
                utmattning: 0,
                baseUtmattning: 0,
                utmattningEffectApplications: [],
                allvarlig: false,
                allvarligRoll: null
            };
        }

        let baseUtmattning = 0;
        let allvarlig = false;
        let allvarligRoll = null;

        if (slutskada <= 4) baseUtmattning = 1;
        else if (slutskada <= 9) baseUtmattning = 2;
        else {
            allvarligRoll = this.getAllvarligSkadaRoll(slutskada);
            allvarlig = true;
            if (slutskada <= 14) baseUtmattning = 4;
            else if (slutskada <= 19) baseUtmattning = 6;
            else if (slutskada <= 24) baseUtmattning = 8;
            else if (slutskada <= 29) baseUtmattning = 10;
            else {
                const extraUtmattning = 2 * Math.floor((slutskada - 30) / 5);
                baseUtmattning = 12 + extraUtmattning;
            }
        }

        const utmattningResult = EffectHelper.applyUtmattningEffects(
            baseUtmattning,
            options.utmattningEffects ?? []
        );

        if (options.blockAllvarlig) {
            allvarlig = false;
            allvarligRoll = null;
        }

        return {
            utmattning: utmattningResult.value,
            baseUtmattning,
            utmattningEffectApplications: utmattningResult.applications,
            allvarlig,
            allvarligRoll
        };
    }

    /**
     * Tärningsformel för allvarlig skada (skadetabell) vid slutskada ≥ 10.
     * @param {number} finalDamage
     * @returns {string|null}
     */
    static getAllvarligSkadaRoll(finalDamage) {
        const slutskada = Math.floor(Number(finalDamage) || 0);
        if (slutskada < 10) return null;
        const bonus = 2 * Math.floor((slutskada - 10) / 5);
        return bonus > 0 ? `1T10+${bonus}` : "1T10";
    }

    /**
     * @param {Actor} defender
     * @param {string} bodyPartKey
     * @param {number} finalDamage
     * @param {{ utmattningEffects?: object[] }} [options]
     */
    static async applyDamageToDefender(defender, bodyPartKey, finalDamage, options = {}) {
        if (!defender || finalDamage <= 0) return;
        const {
            utmattning,
            baseUtmattning,
            utmattningEffectApplications,
            allvarlig,
            allvarligRoll
        } = this.damageIntervalEffects(finalDamage, options);
        const partKey = this.normalizeBodyPartKey(bodyPartKey) ?? "torso";
        const updates = {};
        if (utmattning > 0) {
            const cur = Number(defender.system?.skada?.utmattning?.varde ?? 0);
            updates["system.skada.utmattning.varde"] = cur + utmattning;
        }
        if (Object.keys(updates).length) await defender.update(updates);
        return {
            utmattning,
            baseUtmattning,
            utmattningEffectApplications,
            allvarlig,
            allvarligRoll,
            applied: true,
            bodyPartKey: partKey
        };
    }

    /**
     * @param {Actor} defender
     * @returns {boolean}
     */
    static defenderUsesHitLocation(defender) {
        return this.isFolkslagActor(defender);
    }

    /**
     * Förhandsvisning av skadeeffekter innan applicering.
     * @param {Actor} defender
     * @param {string} bodyPartKey
     * @param {number} finalDamage
     * @param {string} [damageType]
     * @param {{ utmattningEffects?: object[] }} [options]
     */
    static previewDamageApplication(defender, bodyPartKey, finalDamage, damageType = "hugg", options = {}) {
        const {
            utmattning,
            baseUtmattning,
            utmattningEffectApplications,
            allvarlig,
            allvarligRoll
        } = this.damageIntervalEffects(finalDamage, options);
        const partKey = this.normalizeBodyPartKey(bodyPartKey) ?? "torso";
        const dtypeKey = CONFIG?.EON?.vapenskador?.[damageType] ?? damageType;
        const damageTypeLabel = game.i18n.has(dtypeKey) ? game.i18n.localize(dtypeKey) : damageType;
        return {
            utmattning,
            baseUtmattning,
            utmattningEffectApplications,
            allvarlig,
            allvarligRoll,
            damageTypeLabel,
            bodyPartKey: partKey,
            bodyPartLabel: this.localizeBodyPart(partKey)
        };
    }

    /**
     * @param {Actor} actor
     * @returns {boolean}
     */
    static isPlayerCharacter(actor) {
        const actorType = actor?.type?.toLowerCase?.()?.replace?.(/\s+/g, "") ?? "";
        return actorType === "rollperson" || actorType === "rollperson5";
    }

    /**
     * Folkslag (PC eller motståndare) — träffplats och sår/utmattning, inte varelse-vändning.
     * @param {Actor} actor
     * @returns {boolean}
     */
    static isFolkslagActor(actor) {
        const actorType = actor?.type?.toLowerCase?.()?.replace?.(/\s+/g, "") ?? "";
        return actorType === "rollperson" || actorType === "rollperson5" || actorType === "motstandare5";
    }

    /**
     * Eon 5-motståndare (NPC med anfall & försvar).
     * @param {Actor} actor
     * @returns {boolean}
     */
    static isMotstandareActor(actor) {
        const actorType = actor?.type?.toLowerCase?.()?.replace?.(/\s/g, "") ?? "";
        return actorType === "motstandare5" || actor?.system?.installningar?.motstandare === true;
    }

    /**
     * @param {string} type
     * @returns {string}
     */
    static _normalizeItemType(type) {
        return String(type ?? "").toLowerCase().replace(/\s+/g, "");
    }

    /**
     * @param {Item} item
     * @param {string} type
     * @returns {boolean}
     */
    static _isItemType(item, type) {
        return this._normalizeItemType(item?.type) === this._normalizeItemType(type);
    }

    /**
     * @param {Item} item
     * @returns {boolean}
     */
    static _isWorn(item) {
        const buren = item?.system?.installningar?.buren;
        return buren === true || buren === "true" || buren === 1;
    }

    /**
     * @param {Actor} defender
     * @returns {Item|null}
     */
    static _findUndvikaSkill(defender) {
        const byId = defender.items?.find(
            (i) => this._isItemType(i, "Färdighet")
                && String(i.system?.id ?? "").toLowerCase() === "undvika"
        );
        if (byId) return byId;

        const undvikaName = game.i18n.localize("eon.config.fardigheter.undvika");
        return defender.items?.find((i) => {
            if (!this._isItemType(i, "Färdighet")) return false;
            const name = game.i18n.has(i.name) ? game.i18n.localize(i.name) : i.name;
            return name === undvikaName;
        }) ?? null;
    }

    /**
     * Giltiga försvarsalternativ för försvararen.
     * Folkslag (rollperson, motståndare): Undvika + burna Närstridsvapen/Sköldar.
     * Varelse: Undvika + alla Närstridsvapen/Sköldar (ingen buren-koll).
     * @param {Actor} defender
     * @returns {Array<{ kind: "skill"|"weapon", item: Item, labelKey: string, labelParams?: object }>}
     */
    static getDefenseOptions(defender) {
        /** @type {Array<{ kind: "skill"|"weapon", item: Item, labelKey: string, labelParams?: object }>} */
        const options = [];
        if (!defender?.items) return options;

        const undvika = this._findUndvikaSkill(defender);
        if (undvika || this.isMotstandareActor(defender)) {
            options.push({
                kind: "skill",
                item: undvika,
                labelKey: "eon.combatAttack.defenseChoiceUndvika"
            });
        }

        const requiresWorn = (i) => this.isFolkslagActor(defender) ? this._isWorn(i) : true;

        for (const w of defender.items.filter(
            (i) => this._isItemType(i, "Närstridsvapen") && requiresWorn(i)
        )) {
            options.push({
                kind: "weapon",
                item: w,
                labelKey: "eon.combatAttack.defenseChoiceWeapon",
                labelParams: { name: w.name }
            });
        }

        for (const s of defender.items.filter(
            (i) => this._isItemType(i, "Sköld") && requiresWorn(i)
        )) {
            options.push({
                kind: "weapon",
                item: s,
                labelKey: "eon.combatAttack.defenseChoiceShield",
                labelParams: { name: s.name }
            });
        }

        return options;
    }

    /**
     * @param {{ labelKey: string, labelParams?: object }} option
     * @returns {string}
     */
    static formatDefenseOptionLabel(option) {
        if (option.labelParams) {
            return game.i18n.format(option.labelKey, option.labelParams);
        }
        return game.i18n.localize(option.labelKey);
    }

    /**
     * Senaste träffplats-meddelande för anfallare som väntar på skadeslag.
     * @param {string} attackerActorId
     */
    static findPendingHitLocationForAttacker(attackerActorId) {
        if (!attackerActorId) return null;
        for (let messageIndex = game.messages.size - 1; messageIndex >= 0; messageIndex--) {
            const message = game.messages.contents[messageIndex];
            const attackFlags = message.flags?.[EON_ATTACK_FLAG];
            if (
                attackFlags?.attackerActorId === attackerActorId &&
                (attackFlags?.flowType === "resolution" || attackFlags?.flowType === "hitLocation") &&
                attackFlags?.hit === true &&
                attackFlags?.rawDamage == null
            ) {
                return {
                    flowId: attackFlags.attackFlowId,
                    defenderActorId: attackFlags.defenderActorId,
                    defenderName: attackFlags.defenderName,
                    hitLocationMessageId: message.id,
                    weaponFattning: attackFlags.weaponFattning ?? null,
                    weaponAttackType: attackFlags.weaponAttackType ?? null,
                    overtag: attackFlags.overtag ?? 0
                };
            }
        }
        return null;
    }

    /**
     * @param {object} flowState
     * @param {Actor} [flowState.actor]
     * @param {string} flowState.title
     * @param {string[]} [flowState.sections]
     * @param {string} [flowState.result]
     * @param {string} [flowState.diceTitle]
     * @param {number[]} [flowState.diceresult]
     * @param {number|null} [flowState.total]
     * @param {object} [flowState.flags]
     * @returns {Promise<ChatMessage>}
     */
    static async postSystemMessage(flowState) {
        return postTrayChatMessage({
            actor: flowState.actor,
            title: flowState.title ?? "",
            sections: flowState.sections ?? [],
            result: flowState.result ?? "",
            diceTitle: flowState.diceTitle ?? "",
            diceresult: flowState.diceresult ?? null,
            total: flowState.total ?? null,
            flags: flowState.flags ?? {}
        });
    }
}
