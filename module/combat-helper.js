import { DiceRollContainer, RollDice } from "./dice-helper.js";
import { AttributeRoll, DialogAttributeRoll } from "./dialogs/dialog-skill-roll.js";

export class CombatHelper {
    static init() {
        Hooks.on("combatStart", async (combat) => {
            await this.sortCombatantsByPhase(combat);
        });
    }

    static getPhaseOrder(combatant) {
        const phase = combatant?.flags?.["eon-rpg"]?.phase;
        const configPhases = CONFIG?.EON?.combatPhases ?? {};
        const fallback = {
            initiative_distance: { order: 1 },
            initiative_close: { order: 2 },
            initiative_mystic: { order: 3 },
            initiative_other: { order: 4 }
        };

        return configPhases?.[phase]?.order ?? fallback?.[phase]?.order ?? 999;
    }

    static calculateCompositeInitiative(combatant) {
        const phaseOrder = this.getPhaseOrder(combatant);
        const flaggedBase = Number(combatant?.flags?.["eon-rpg"]?.initiativeBase);
        const initiativeValue = Number(combatant?.initiative ?? 0);
        const baseInitiative = Number.isFinite(flaggedBase) ? flaggedBase : (Number.isFinite(initiativeValue) ? initiativeValue % 10000 : 0);

        // Lower phase order should act earlier; represent this with higher sort band.
        const phaseBand = (5 - phaseOrder) * 10000;
        return phaseBand + baseInitiative;
    }

    static requiresInitiativeRoll(combatant) {
        const role = combatant?.flags?.["eon-rpg"]?.subcombatRole ?? "";
        return role !== "defender";
    }

    static async promptReactionInitiative(actor) {
        if (!actor) return null;
        try {
            return await new Promise((resolve) => {
                let resolved = false;
                const done = (value) => {
                    if (resolved) return;
                    resolved = true;
                    resolve(value);
                };

                const rollData = new AttributeRoll(actor, "harleddegenskaper", "reaktion", "Reaktion");
                const dialog = new DialogAttributeRoll(actor, rollData, {
                    onRollComplete: ({ result }) => done(Number(result)),
                    onRollCancelled: () => done(null)
                });

                dialog.render(true);
                const originalClose = dialog.close.bind(dialog);
                dialog.close = async (...args) => {
                    done(null);
                    return originalClose(...args);
                };
            });
        } catch (_error) {
            return null;
        }
    }

    static async setCombatantPhase(combatant, phase, { clearSubcombatOnNonClose = true } = {}) {
        if (!combatant) return;
        const flags = combatant.flags?.["eon-rpg"] ?? {};
        const update = { ...flags, phase };

        if (clearSubcombatOnNonClose && phase !== "initiative_close") {
            update.subcombatRole = null;
            update.groupId = "main";
            update.groupType = "main";
        }

        await combatant.update({
            flags: {
                "eon-rpg": update
            }
        });
    }

    static async rollReactionInitiative(combatant, { phase = null, baseInitiativeOverride = null, promptDialog = false } = {}) {
        if (!combatant?.actor) return null;
        if (!this.requiresInitiativeRoll(combatant)) return combatant.initiative ?? null;

        const combat = combatant.combat ?? game.combat;
        const currentRound = combat?.round ?? 0;
        const initiativeRound = combatant.flags?.["eon-rpg"]?.initiativeRound;
        const alreadyRolledThisRound = initiativeRound !== undefined && Number(initiativeRound) === Number(currentRound);

        if (alreadyRolledThisRound) {
            const replace = await Dialog.confirm({
                title: "Slå initiativ",
                content: "<p>Du har redan slagit initiativ. Vill du ersätta det existerande värdet?</p>",
                defaultYes: false
            });
            if (!replace) return null;
        }

        if (phase) {
            await this.setCombatantPhase(combatant, phase);
        }

        let baseInitiative = null;
        const hasOverride = baseInitiativeOverride !== null && baseInitiativeOverride !== undefined;
        if (hasOverride) baseInitiative = Number(baseInitiativeOverride);

        if (!hasOverride && promptDialog) {
            const prompted = await this.promptReactionInitiative(combatant.actor);
            if (prompted !== null && prompted !== undefined && Number.isFinite(Number(prompted))) {
                baseInitiative = Number(prompted);
            } else {
                return null;
            }
        }

        if (baseInitiative === null || Number.isNaN(baseInitiative)) {
            const attr = combatant.actor.system?.harleddegenskaper?.reaktion?.totalt ?? { tvarde: 0, bonus: 0 };
            const roll = new DiceRollContainer(combatant.actor, CONFIG.EON ?? game.EON?.CONFIG ?? {});
            roll.typeroll = CONFIG?.EON?.slag?.grundegenskap ?? "Grundegenskap";
            roll.action = "Reaktion";
            roll.number = Number(attr.tvarde ?? 0);
            roll.bonus = Number(attr.bonus ?? 0);

            baseInitiative = Number(await RollDice(roll));
            if (!Number.isFinite(baseInitiative)) baseInitiative = 0;
        }

        const existing = combatant.flags?.["eon-rpg"] ?? {};
        const composite = this.calculateCompositeInitiative({
            ...combatant,
            initiative: baseInitiative,
            flags: { "eon-rpg": { ...existing } }
        });

        const combatForRound = combatant.combat ?? game.combat;
        await combatant.update({
            initiative: composite,
            flags: {
                "eon-rpg": {
                    ...existing,
                    initiativeBase: baseInitiative,
                    initiativeRound: combatForRound?.round ?? currentRound
                }
            }
        });

        await this.sortCombatantsByPhase(combatForRound);
        return composite;
    }

    static async sortCombatantsByPhase(combat) {
        if (!combat?.combatants?.size) return;

        const updates = [];
        for (const combatant of combat.combatants.contents) {
            const current = Number(combatant.initiative ?? 0);
            const composite = this.calculateCompositeInitiative(combatant);
            if (current !== composite) {
                updates.push({
                    _id: combatant.id,
                    initiative: composite
                });
            }
        }

        if (updates.length > 0) {
            await combat.updateEmbeddedDocuments("Combatant", updates);
        }
    }

    /** Phase sort order (1=Avstånd, 2=Närstrid, 3=Mystik, 4=Övrigt). */
    static _eonPhaseOrder(phase) {
        const order = CONFIG?.EON?.combatPhases?.[phase]?.order;
        if (Number.isFinite(order)) return order;
        if (phase === "initiative_distance") return 1;
        if (phase === "initiative_close") return 2;
        if (phase === "initiative_mystic") return 3;
        if (phase === "initiative_other") return 4;
        return 99;
    }

    static _eonGroupKey(combatant) {
        return combatant?.flags?.["eon-rpg"]?.groupId ?? "main";
    }

    /**
     * Eon turn order for the round: by phase, then by "group initiative" (subcombat
     * groups by attacker initiative, main combatants by own initiative), then by
     * group, then within group by role (attacker first) and initiative.
     * Returns array of combatant ids in that order.
     */
    static getEonTurnOrder(combat) {
        if (!combat?.combatants?.contents?.length) return [];

        const list = [...combat.combatants.contents];
        const attackerInitByGroup = {};
        for (const c of list) {
            const g = this._eonGroupKey(c);
            const role = c.flags?.["eon-rpg"]?.subcombatRole ?? "";
            if (g !== "main" && role === "attacker") {
                attackerInitByGroup[g] = Number(c.initiative ?? -99999);
            }
        }

        list.sort((a, b) => {
            const phaseA = this._eonPhaseOrder(a.flags?.["eon-rpg"]?.phase ?? "");
            const phaseB = this._eonPhaseOrder(b.flags?.["eon-rpg"]?.phase ?? "");
            if (phaseA !== phaseB) return phaseA - phaseB;

            const groupA = this._eonGroupKey(a);
            const groupB = this._eonGroupKey(b);
            const keyA = groupA === "main" ? Number(a.initiative ?? -99999) : (attackerInitByGroup[groupA] ?? -99999);
            const keyB = groupB === "main" ? Number(b.initiative ?? -99999) : (attackerInitByGroup[groupB] ?? -99999);
            if (keyA !== keyB) return keyB - keyA;

            if (groupA !== groupB) return groupA.localeCompare(groupB);

            const roleA = a.flags?.["eon-rpg"]?.subcombatRole ?? "";
            const roleB = b.flags?.["eon-rpg"]?.subcombatRole ?? "";
            if (roleA !== roleB) {
                if (roleA === "attacker") return -1;
                if (roleB === "attacker") return 1;
            }

            return Number(b.initiative ?? -99999) - Number(a.initiative ?? -99999);
        });

        return list.map((c) => c.id);
    }

    /**
     * Advance to the next turn in Eon order (subcombat fully before next subcombat).
     * Returns { nextTurnIndex, roundAdvanced } for combat.update(), or null if no combat/combatant.
     */
    static advanceToNextEonTurn(combat) {
        if (!combat?.combatants?.size) return null;

        const currentCombatant = combat.combatant;
        if (!currentCombatant) return null;

        const eonOrder = this.getEonTurnOrder(combat);
        if (!eonOrder.length) return null;

        const currentId = currentCombatant.id;
        const currentIndex = eonOrder.indexOf(currentId);
        if (currentIndex < 0) return null;

        let nextIndex = currentIndex + 1;
        let roundAdvanced = false;
        if (nextIndex >= eonOrder.length) {
            nextIndex = 0;
            roundAdvanced = true;
        }

        const nextCombatantId = eonOrder[nextIndex];
        const turns = combat.turns ?? [];
        const turnIndex = turns.findIndex((t) => (t.id ?? t.combatantId) === nextCombatantId);
        if (turnIndex < 0) return null;

        return { nextTurnIndex: turnIndex, roundAdvanced };
    }
}
