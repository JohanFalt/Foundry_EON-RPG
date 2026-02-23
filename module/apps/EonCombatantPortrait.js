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
        if (this.role === "attacker") return "Anfallare";
        if (this.role === "defender") return "Försvarare";
        return "";
    }

    toContext() {
        const actor = this.combatant?.actor;
        const isCurrentTurn = this.tracker?.combat?.combatant?.id === this.combatant?.id;
        const phaseSelected = this.phase !== "";
        const isClose = this.phase === "initiative_close";
        const isDefender = this.role === "defender";

        let rollInitiativeDisabledReason = "";
        if (!phaseSelected) rollInitiativeDisabledReason = "Välj fas först.";
        else if (this.interactionsLocked) rollInitiativeDisabledReason = "Alla combatants måste välja fas först.";
        else if (isDefender) rollInitiativeDisabledReason = "Försvarare slår inte initiativ separat i delstrid.";

        const canRollInitiativeAction = phaseSelected && !this.interactionsLocked && !isDefender;
        const canUseRoleActions = isClose && !this.interactionsLocked;
        const notInSubcombat = this.groupId === "main";
        const canSelectSubcombatTargets = isClose && !this.interactionsLocked && notInSubcombat;
        const canConfirmSubcombat = canSelectSubcombatTargets && this.pendingTargets.length > 0;
        const canLeaveSubcombat = this.groupId !== "main" && !this.interactionsLocked;
        const showRoleActions = isClose;

        let selectSubcombatTargetsDisabledReason = "";
        if (isClose && !notInSubcombat) selectSubcombatTargetsDisabledReason = "Lämna delstrid först om du vill välja andra motståndare.";

        const phaseLabel = this.phase
            ? (CONFIG?.EON?.combatPhases?.[this.phase]?.namn ?? this.phase)
            : "";

        return {
            id: this.combatant?.id,
            name: this.combatant?.name ?? actor?.name ?? "Okänd",
            img: this.combatant?.img ?? actor?.img ?? "icons/svg/mystery-man.svg",
            phase: this.phase,
            phaseLabel,
            role: this.role,
            initiative: Number(this.combatant?.initiative ?? 0),
            groupId: this.groupId,
            roleLabel: this.roleLabel,
            pendingTargetsCount: this.pendingTargets.length,
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
            canUseRoleActions,
            canSelectSubcombatTargets,
            canConfirmSubcombat,
            canLeaveSubcombat,
            rollInitiativeDisabledReason,
            selectSubcombatTargetsDisabledReason
        };
    }
}
