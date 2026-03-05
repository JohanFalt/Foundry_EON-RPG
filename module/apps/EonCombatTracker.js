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

    /** @type {ResizeObserver|null} */
    _maxWidthResizeObserver = null;

    get combat() {
        return game.combat ?? null;
    }

    get areAllPhasesSelected() {
        const combatants = this.combat?.combatants?.contents ?? [];
        const active = combatants.filter((c) => !c.defeated);
        if (active.length === 0) return true;
        return active.every((c) => {
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

        const eonOrder = CombatHelper.getEonTurnOrder(combat);
        const byId = new Map(combat.combatants.contents.map((c) => [c.id, c]));
        return eonOrder.map((id) => byId.get(id)).filter(Boolean);
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
        this._applyMaxWidth();
        this._observeInterfaceResize();
    }

    /**
     * Limit tracker width to 50% of scene area (interface minus sidebar). Foundry v13: #interface, #sidebar.
     */
    _applyMaxWidth() {
        const root = this._trackRootElement();
        if (!root) return;
        const interfaceEl = document.querySelector("#interface");
        const sidebarEl = document.querySelector("#sidebar");
        let maxWidthPx = null;
        if (interfaceEl) {
            const interfaceWidth = interfaceEl.offsetWidth ?? interfaceEl.clientWidth ?? 0;
            const sidebarWidth = sidebarEl ? (sidebarEl.offsetWidth ?? sidebarEl.clientWidth ?? 0) : 0;
            const sceneWidth = Math.max(0, interfaceWidth - sidebarWidth);
            maxWidthPx = Math.floor(sceneWidth * 0.5);
        }
        if (maxWidthPx != null && maxWidthPx > 0) {
            root.style.setProperty("--eon-combat-track-max-width", `${maxWidthPx}px`);
        } else {
            root.style.removeProperty("--eon-combat-track-max-width");
        }
    }

    /** @returns {HTMLElement|null} */
    _trackRootElement() {
        const appEl = this._rootElement();
        if (!appEl) return null;
        return appEl.querySelector?.(".eon-combat-track-root") ?? null;
    }

    /**
     * Observe #interface resize so tracker max-width updates when sidebar/window is resized.
     */
    _observeInterfaceResize() {
        const interfaceEl = document.querySelector("#interface");
        if (!interfaceEl) return;
        if (this._maxWidthResizeObserver) {
            this._maxWidthResizeObserver.disconnect();
            this._maxWidthResizeObserver = null;
        }
        this._maxWidthResizeObserver = new ResizeObserver(() => {
            const root = this._trackRootElement();
            if (!root?.isConnected) {
                this._maxWidthResizeObserver?.disconnect();
                this._maxWidthResizeObserver = null;
                return;
            }
            this._applyMaxWidth();
        });
        this._maxWidthResizeObserver.observe(interfaceEl);
    }

    _rootElement() {
        if (!this.element) return null;
        if (this.element instanceof HTMLElement) return this.element;
        if (this.element[0] instanceof HTMLElement) return this.element[0];
        return null;
    }

    /**
     * Scroll the portrait row so the current turn (is-current-turn) is in view, centered when possible.
     * Runs after two animation frames so we target the DOM that is actually on screen after render.
     * Uses instant scroll (no smooth) and keeps the row hidden until scroll is set to avoid a visible jump to the left.
     */
    _scrollToCurrentTurn() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const root = this._rootElement();
                try {
                    const row = root?.querySelector?.(".eon-combat-track-row");
                    const current = root?.querySelector?.(".eon-combatant-portrait.is-current-turn");
                    if (!row || !current || row.scrollWidth <= row.clientWidth) return;

                    const rowRect = row.getBoundingClientRect();
                    const portraitRect = current.getBoundingClientRect();
                    const portraitCenterInView = portraitRect.left - rowRect.left + portraitRect.width / 2;
                    const rowCenter = row.clientWidth / 2;
                    const targetScrollLeft = Math.max(0, Math.min(
                        row.scrollLeft + portraitCenterInView - rowCenter,
                        row.scrollWidth - row.clientWidth
                    ));
                    row.scrollTo({ left: targetScrollLeft, behavior: "auto" });
                } finally {
                    root?.classList?.remove("eon-combat-track-scroll-pending");
                }
            });
        });
    }

    async _onAction(event) {
        const actionEl = event.target?.closest?.("[data-action]");
        if (!actionEl) return;

        event.preventDefault();
        const action = actionEl.dataset.action;

        if (action === "turn-menu-next") {
            this._rootElement()?.classList?.add("eon-combat-track-scroll-pending");
            const result = CombatHelper.advanceToNextEonTurn(this.combat);
            if (result) {
                const update = { turn: result.nextTurnIndex };
                if (result.roundAdvanced) {
                    update.round = Math.max(0, (this.combat.round ?? 0) + 1);
                }
                await this.combat.update(update);
            }
            await this.render(true);
            this._scrollToCurrentTurn();
            return;
        }

        if (action === "turn-menu-previous") {
            this._rootElement()?.classList?.add("eon-combat-track-scroll-pending");
            const result = CombatHelper.advanceToPreviousEonTurn(this.combat);
            if (result) {
                const update = { turn: result.prevTurnIndex };
                if (result.roundRewound) {
                    update.round = Math.max(0, (this.combat.round ?? 1) - 1);
                }
                await this.combat.update(update);
            }
            await this.render(true);
            this._scrollToCurrentTurn();
            return;
        }

        if (action === "turn-menu-roll-all-initiative") {
            const combat = this.combat;
            if (!combat?.combatants?.contents?.length) return;
            const currentRound = combat.round ?? 0;
            for (const c of combat.combatants.contents) {
                if (!CombatHelper.requiresInitiativeRoll(c)) continue;
                const initiativeRound = c.flags?.["eon-rpg"]?.initiativeRound;
                if (initiativeRound !== undefined && Number(initiativeRound) === Number(currentRound)) continue;
                await CombatHelper.rollReactionInitiative(c, { promptDialog: false });
            }
            await this.render(true);
            return;
        }

        const combatantId = actionEl.dataset.combatantId;
        const combatant = this.combat?.combatants?.get(combatantId);
        if (!combatant) return;

        if (action === "toggle-defeated") {
            const newDefeated = !combatant.defeated;
            if (newDefeated && (combatant.flags?.["eon-rpg"]?.groupId ?? "main") !== "main") {
                await SubcombatManager.leaveSubcombat(combatant);
            }
            const update = { defeated: newDefeated };
            if (newDefeated) update.initiative = 0;
            await combatant.update(update);
            await this.render(true);
            return;
        }

        if (action === "roll-initiative") {
            const hasPhase = (combatant.flags?.["eon-rpg"]?.phase ?? "") !== "";
            if (!hasPhase) {
                ui.notifications.warn("Välj fas först.");
                return;
            }
            await CombatHelper.rollReactionInitiative(combatant, { promptDialog: true });
            await this.render(true);
            return;
        }

        if (action === "select-subcombat-targets") {
            const phase = combatant.flags?.["eon-rpg"]?.phase ?? "";
            if (phase !== "initiative_close") {
                ui.notifications.warn("Välj närstridsfas först.");
                return;
            }
            await this._openSubcombatTargetDialog(combatant);
            return;
        }

        if (action === "confirm-subcombat") {
            const phase = combatant.flags?.["eon-rpg"]?.phase ?? "";
            if (phase !== "initiative_close") {
                ui.notifications.warn("Välj närstridsfas först.");
                return;
            }
            await SubcombatManager.confirmIntent(combatant);
            await CombatHelper.sortCombatantsByPhase(this.combat);
            await this.render(true);
            return;
        }

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

        if (action === "set-role") {
            const existing = combatant.flags?.["eon-rpg"] ?? {};
            const clickedRole = actionEl.dataset.role;
            const currentRole = existing.subcombatRole ?? null;
            const newRole = currentRole === clickedRole ? null : clickedRole;
            await combatant.update({
                flags: {
                    "eon-rpg": {
                        ...existing,
                        subcombatRole: newRole
                    }
                }
            });
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
            this._rootElement()?.classList?.add("eon-combat-track-scroll-pending");
            const result = CombatHelper.advanceToNextEonTurn(this.combat);
            if (result) {
                const update = { turn: result.nextTurnIndex };
                if (result.roundAdvanced) {
                    update.round = Math.max(0, (this.combat.round ?? 0) + 1);
                }
                await this.combat.update(update);
            }
            await this.render(true);
            this._scrollToCurrentTurn();
        }
    }

    async _openSubcombatTargetDialog(combatant) {
        const combat = this.combat;
        if (!combat) return;

        const groupId = combatant.flags?.["eon-rpg"]?.groupId ?? "main";
        const groupHasAttacker = groupId === "main" || combat.combatants.contents.some(
            (c) => (c.flags?.["eon-rpg"]?.groupId === groupId && c.flags?.["eon-rpg"]?.subcombatRole === "attacker")
        );
        if (groupId !== "main" && groupHasAttacker) {
            ui.notifications.warn("Lämna delstrid först om du vill välja andra motståndare.");
            return;
        }

        const candidates = combat.combatants.contents.filter((c) => c.id !== combatant.id && !c.defeated);
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
            classes: ["eon-select-opponent-dialog"],
            window: { title: "Välj motståndare" },
            content: `<form><p>Välj en eller flera motståndare:</p>${rows}</form>`,
            buttons: [
                {
                    action: "save",
                    label: "Välj",
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
                },
                {
                    action: "cancel",
                    label: "Avbryt"
                }
            ]
        });

        await dialog.render(true);
    }
}
