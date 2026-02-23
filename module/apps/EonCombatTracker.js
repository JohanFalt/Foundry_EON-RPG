import { CombatHelper } from "../combat-helper.js";
import { EonCombatantPortrait } from "./EonCombatantPortrait.js";
import { SubcombatManager } from "../subcombat-manager.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EonCombatTracker extends HandlebarsApplicationMixin(ApplicationV2) {
    static PARTS = {
        content: {
            template: "systems/eon-rpg/templates/combat/eon-combat-tracker.html"
        }
    };

    static DEFAULT_OPTIONS = {
        id: "eon-combat-tracker",
        classes: ["eon-combat-tracker"],
        tag: "section",
        position: {
            width: 1200,
            height: "auto",
            top: 12,
            left: 200
        },
        actions: {},
        window: {
            frame: false,
            positioned: true,
            title: "Eon Combat Tracker",
            controls: []
        }
    };

    get combat() {
        return game.combat ?? null;
    }

    get areAllPhasesSelected() {
        const combatants = this.combat?.combatants?.contents ?? [];
        if (combatants.length === 0) return false;
        return combatants.every((c) => {
            const phase = c.flags?.["eon-rpg"]?.phase;
            return typeof phase === "string" && phase.length > 0;
        });
    }

    get interactionsLocked() {
        return !this.areAllPhasesSelected;
    }

    _phaseSortValue(phase) {
        const order = CONFIG?.EON?.combatPhases?.[phase]?.order;
        if (Number.isFinite(order)) return order;
        if (phase === "initiative_distance") return 1;
        if (phase === "initiative_close") return 2;
        if (phase === "initiative_mystic") return 3;
        if (phase === "initiative_other") return 4;
        return 99;
    }

    _groupKey(combatant) {
        const flags = combatant.flags?.["eon-rpg"] ?? {};
        return flags.groupId ?? "main";
    }

    get orderedCombatants() {
        const combat = this.combat;
        if (!combat?.combatants?.contents?.length) return [];

        const all = [...combat.combatants.contents];
        all.sort((a, b) => {
            const phaseA = this._phaseSortValue(a.flags?.["eon-rpg"]?.phase ?? "");
            const phaseB = this._phaseSortValue(b.flags?.["eon-rpg"]?.phase ?? "");
            if (phaseA !== phaseB) return phaseA - phaseB;

            const groupA = this._groupKey(a);
            const groupB = this._groupKey(b);
            if (groupA !== groupB) {
                if (groupA === "main") return -1;
                if (groupB === "main") return 1;
                return groupA.localeCompare(groupB);
            }

            const roleA = a.flags?.["eon-rpg"]?.subcombatRole ?? "";
            const roleB = b.flags?.["eon-rpg"]?.subcombatRole ?? "";
            if (roleA !== roleB) {
                if (roleA === "attacker") return -1;
                if (roleB === "attacker") return 1;
            }

            return Number(b.initiative ?? -99999) - Number(a.initiative ?? -99999);
        });
        return all;
    }

    get currentRound() {
        const candidates = [
            this.combat?.round,
            game?.combat?.round,
            ui?.combat?.viewed?.round
        ];
        for (const value of candidates) {
            const round = Number(value);
            if (Number.isFinite(round)) return round;
        }
        return 0;
    }

    get roundLabel() {
        return String(this.currentRound);
    }

    async _prepareContext() {
        const ordered = this.orderedCombatants;
        const eonTurnOrder = CombatHelper.getEonTurnOrder(this.combat);
        const lastInRoundId = eonTurnOrder.length ? eonTurnOrder[eonTurnOrder.length - 1] : null;

        const portraits = ordered.map((c, index) => {
            const prev = index > 0 ? ordered[index - 1] : ordered[ordered.length - 1];
            const phaseChanged = (prev?.flags?.["eon-rpg"]?.phase ?? "") !== (c.flags?.["eon-rpg"]?.phase ?? "");
            const groupChanged = this._groupKey(prev) !== this._groupKey(c);
            const separator = index > 0 && (phaseChanged || groupChanged);
            return new EonCombatantPortrait(c, this, {
                interactionsLocked: this.interactionsLocked,
                showGroupSeparator: separator,
                isLastInRound: lastInRoundId === c.id
            }).toContext();
        });

        return {
            hasCombat: Boolean(this.combat),
            hasCombatants: portraits.length > 0,
            roundLabel: this.roundLabel,
            allPhasesSelected: this.areAllPhasesSelected,
            interactionsLocked: this.interactionsLocked,
            combatants: portraits
        };
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        const root = this._rootElement();
        root?.removeEventListener?.("click", this._boundOnAction);
        this._boundOnAction = this._onAction.bind(this);
        root?.addEventListener?.("click", this._boundOnAction);
    }

    _rootElement() {
        if (!this.element) return null;
        if (this.element instanceof HTMLElement) return this.element;
        if (this.element[0] instanceof HTMLElement) return this.element[0];
        return null;
    }

    async _onAction(event) {
        const actionEl = event.target?.closest?.("[data-action]");
        if (!actionEl) return;

        event.preventDefault();
        const action = actionEl.dataset.action;
        const combatantId = actionEl.dataset.combatantId;
        const combatant = this.combat?.combatants?.get(combatantId);
        if (!combatant) return;

        if (this.interactionsLocked && action !== "set-phase") {
            ui.notifications.warn("Alla combatants måste välja fas först.");
            return;
        }

        if (action === "set-phase") {
            await CombatHelper.setCombatantPhase(combatant, actionEl.dataset.phase);
            await CombatHelper.sortCombatantsByPhase(this.combat);
            await this.render(true);
            return;
        }

        if (action === "roll-initiative") {
            await CombatHelper.rollReactionInitiative(combatant, { promptDialog: true });
            await this.render(true);
            return;
        }

        if (action === "set-role") {
            const existing = combatant.flags?.["eon-rpg"] ?? {};
            await combatant.update({
                flags: {
                    "eon-rpg": {
                        ...existing,
                        subcombatRole: actionEl.dataset.role
                    }
                }
            });
            await CombatHelper.sortCombatantsByPhase(this.combat);
            await this.render(true);
            return;
        }

        if (action === "select-subcombat-targets") {
            await this._openSubcombatTargetDialog(combatant);
            return;
        }

        if (action === "confirm-subcombat") {
            await SubcombatManager.confirmIntent(combatant);
            await CombatHelper.sortCombatantsByPhase(this.combat);
            await this.render(true);
            return;
        }

        if (action === "leave-subcombat") {
            await SubcombatManager.leaveSubcombat(combatant);
            await CombatHelper.sortCombatantsByPhase(this.combat);
            await this.render(true);
            return;
        }

        if (action === "next-turn") {
            if (this.combat?.combatant?.id !== combatant.id) return;
            const result = CombatHelper.advanceToNextEonTurn(this.combat);
            if (result) {
                const update = { turn: result.nextTurnIndex };
                if (result.roundAdvanced) {
                    update.round = Math.max(0, (this.combat.round ?? 0) + 1);
                }
                await this.combat.update(update);
            }
            await this.render(true);
        }
    }

    async _openSubcombatTargetDialog(combatant) {
        const combat = this.combat;
        if (!combat) return;

        const groupId = combatant.flags?.["eon-rpg"]?.groupId ?? "main";
        if (groupId !== "main") {
            ui.notifications.warn("Lämna delstrid först om du vill välja andra motståndare.");
            return;
        }

        const candidates = combat.combatants.contents.filter((c) => c.id !== combatant.id);
        if (!candidates.length) {
            ui.notifications.warn("Inga andra deltagare att välja.");
            return;
        }
        if (!candidates.length) {
            ui.notifications.warn("Inga giltiga motståndare i närstrid att välja.");
            return;
        }

        const selected = new Set(combatant.flags?.["eon-rpg"]?.pendingSubcombatTargets ?? []);
        const rows = candidates.map((c) => {
            const checked = selected.has(c.id) ? "checked" : "";
            return `<label style="display:block;margin:4px 0;"><input type="checkbox" name="target" value="${c.id}" ${checked}> ${c.name}</label>`;
        }).join("");

        const dialog = new foundry.applications.api.DialogV2({
            window: { title: "Välj motståndare" },
            content: `<form><p>Välj en eller flera motståndare:</p>${rows}</form>`,
            buttons: [
                {
                    action: "cancel",
                    label: "Avbryt"
                },
                {
                    action: "save",
                    label: "Spara",
                    callback: async (_event, button, app) => {
                        const root = app.element instanceof HTMLElement ? app.element : app.element?.[0];
                        if (!root) return;
                        const checked = Array.from(root.querySelectorAll("input[name='target']:checked")).map((el) => el.value);
                        await SubcombatManager.setPendingTargets(combatant, checked);
                        if (checked.length > 0) {
                            const combat = this.combat;
                            if (combat) {
                                const selectorFlags = combatant.flags?.["eon-rpg"] ?? {};
                                await combatant.update({
                                    flags: {
                                        "eon-rpg": {
                                            ...selectorFlags,
                                            subcombatRole: "attacker"
                                        }
                                    }
                                });
                                for (const targetId of checked) {
                                    const target = combat.combatants.get(targetId);
                                    if (target) {
                                        const targetFlags = target.flags?.["eon-rpg"] ?? {};
                                        await target.update({
                                            flags: {
                                                "eon-rpg": {
                                                    ...targetFlags,
                                                    subcombatRole: "defender"
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        await this.render(true);
                    }
                }
            ]
        });

        await dialog.render(true);
    }
}
