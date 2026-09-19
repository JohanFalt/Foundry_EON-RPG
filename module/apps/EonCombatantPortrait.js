export class EonCombatantPortrait {
    constructor(combatant, tracker, options = {}) {
        this.combatant = combatant;
        this.tracker = tracker;
        this.interactionsLocked = Boolean(options.interactionsLocked);
        this.showGroupSeparator = Boolean(options.showGroupSeparator);
        this.isLastInRound = Boolean(options.isLastInRound);
    }

    get flags() {
        return this.combatant?.flags?.["eon-rpg"] ?? {};
    }

    get phase() {
        return this.flags.phase ?? "";
    }

    get role() {
        return this.flags.subcombatRole ?? "";
    }

    get groupId() {
        return this.flags.groupId ?? "main";
    }

    get pendingTargets() {
        const pending = this.flags.pendingSubcombatTargets;
        return Array.isArray(pending) ? pending : [];
    }

    get roleLabel() {
        if (this.role === "attacker") return "eon.dialogs.anfallare";
        if (this.role === "defender") return "eon.dialogs.forsvarare";
        return "";
    }

    get isDefeated() {
        return Boolean(this.combatant?.defeated);
    }

    toContext() {
        const actor = this.combatant?.actor;
        const isCurrentTurn = this.tracker?.combat?.combatant?.id === this.combatant?.id;
        const phaseSelected = this.phase !== "";
        const isClose = this.phase === "initiative_close";
        const isDefender = this.role === "defender";
        const defeated = this.isDefeated;

        let rollInitiativeDisabledReason = "";
        if (defeated) rollInitiativeDisabledReason = game.i18n.localize("eon.combat.besegradIntInitiativ");
        else if (!phaseSelected) rollInitiativeDisabledReason = game.i18n.localize("eon.combat.valjFasForstInitiativ");
        else if (this.interactionsLocked) rollInitiativeDisabledReason = game.i18n.localize("eon.combat.allaMasteValjaFasInitiativ");

        const canRollInitiativeAction = phaseSelected && !isDefender && !defeated;
        // Försvarare i delstrid slår inte initiativ separat – knappen döljs helt för dem.
        const showInitiativeButton = phaseSelected && !defeated && !isDefender;
        const canUseRoleActions = isClose && !this.interactionsLocked && !defeated;
        const notInSubcombat = this.groupId === "main";
        const groupHasAttacker = notInSubcombat || (this.tracker?.combat?.combatants?.contents?.some(
            (c) => (c.flags?.["eon-rpg"]?.groupId === this.groupId && c.flags?.["eon-rpg"]?.subcombatRole === "attacker")
        ) ?? false);
        const canSelectSubcombatTargets = isClose && (notInSubcombat || !groupHasAttacker) && !defeated;
        const canConfirmSubcombat = canSelectSubcombatTargets && this.pendingTargets.length > 0;
        const canLeaveSubcombat = this.groupId !== "main" && !this.interactionsLocked && !defeated;
        const showRoleActions = isClose && !defeated;

        let selectSubcombatTargetsDisabledReason = "";
        if (isClose && notInSubcombat === false && groupHasAttacker) selectSubcombatTargetsDisabledReason = "Lämna delstrid först om du vill välja andra motståndare.";

        const phaseLabel = this.phase
            ? (CONFIG?.EON?.combatPhases?.[this.phase]?.namn ?? this.phase)
            : "";

        return {
            id: this.combatant?.id,
            name: this.combatant?.name ?? actor?.name ?? "Okänd",
            img: this.combatant?.img ?? actor?.img ?? "icons/svg/mystery-man.svg",
            hasActor: Boolean(actor),
            phase: this.phase,
            phaseLabel,
            role: this.role,
            initiativeDisplay: this.flags.initiativeBase != null ? String(Number(this.flags.initiativeBase)) : "–",
            groupId: this.groupId,
            roleLabel: this.roleLabel,
            pendingTargetsCount: this.pendingTargets.length,
            isDefeated: defeated,
            isCurrentTurn,
            canNext: isCurrentTurn && !this.interactionsLocked,
            showGroupSeparator: this.showGroupSeparator,
            isLastInRound: this.isLastInRound,
            interactionsLocked: this.interactionsLocked,
            showRoleActions,
            isPhaseDistanceSelected: this.phase === "initiative_distance",
            isPhaseCloseSelected: this.phase === "initiative_close",
            isPhaseMysticSelected: this.phase === "initiative_mystic",
            isPhaseOtherSelected: this.phase === "initiative_other",
            isRoleAttackerSelected: this.role === "attacker",
            isRoleDefenderSelected: this.role === "defender",
            canRollInitiativeAction,
            showInitiativeButton,
            canUseRoleActions,
            canSelectSubcombatTargets,
            canConfirmSubcombat,
            canLeaveSubcombat,
            rollInitiativeDisabledReason,
            selectSubcombatTargetsDisabledReason
        };
    }
}
