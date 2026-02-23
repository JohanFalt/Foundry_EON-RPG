export class SubcombatManager {
    static _flags(combatant) {
        return combatant.flags?.["eon-rpg"] ?? {};
    }

    static async setPendingTargets(combatant, targetIds = []) {
        if (!combatant) return;
        const uniqueIds = [...new Set((Array.isArray(targetIds) ? targetIds : []).filter(Boolean))];
        const flags = this._flags(combatant);
        await combatant.update({
            flags: {
                "eon-rpg": {
                    ...flags,
                    pendingSubcombatTargets: uniqueIds
                }
            }
        });
    }

    static _groupMembers(combat, groupId) {
        return combat.combatants.contents.filter((c) => (this._flags(c).groupId ?? "main") === groupId);
    }

    static _newGroupId(combat) {
        const rid = foundry?.utils?.randomID ? foundry.utils.randomID() : Math.random().toString(36).slice(2, 10);
        return `subcombat_${combat?.id ?? "combat"}_${rid}`;
    }

    static async confirmIntent(combatant) {
        const combat = combatant?.combat ?? game.combat;
        if (!combatant || !combat) return null;

        const flags = this._flags(combatant);
        const actorPhase = flags.phase ?? "";
        if (actorPhase !== "initiative_close") {
            ui.notifications.warn("Delstrid kan bara bekräftas i närstridsfas.");
            return null;
        }

        const targetIds = [...new Set((flags.pendingSubcombatTargets ?? []).filter(Boolean))];
        if (!targetIds.length) {
            ui.notifications.warn("Välj minst en motståndare för delstrid.");
            return null;
        }

        const validTargets = targetIds.map((id) => combat.combatants.get(id)).filter(Boolean);
        if (!validTargets.length) return null;

        const existingGroupIds = new Set();
        const ownGroup = flags.groupId ?? "main";
        if (ownGroup !== "main") existingGroupIds.add(ownGroup);
        for (const t of validTargets) {
            const gid = this._flags(t).groupId ?? "main";
            if (gid !== "main") existingGroupIds.add(gid);
        }

        const groupId = existingGroupIds.size ? [...existingGroupIds][0] : this._newGroupId(combat);

        const members = new Map();
        if (groupId !== "main") {
            for (const member of this._groupMembers(combat, groupId)) members.set(member.id, member);
        }
        members.set(combatant.id, combatant);
        for (const t of validTargets) members.set(t.id, t);

        const totalMembers = members.size;
        if (totalMembers > 5) {
            ui.notifications.warn("Delstrid tillåter max 4 mot 1 (max 5 deltagare).");
            return null;
        }

        const updates = [];
        for (const member of members.values()) {
            const memberFlags = this._flags(member);
            const role = member.id === combatant.id ? "attacker" : (memberFlags.subcombatRole || "defender");
            updates.push({
                _id: member.id,
                flags: {
                    "eon-rpg": {
                        ...memberFlags,
                        phase: "initiative_close",
                        groupId,
                        groupType: "subcombat",
                        subcombatRole: role,
                        pendingSubcombatTargets: []
                    }
                }
            });
        }

        await combat.updateEmbeddedDocuments("Combatant", updates);
        return groupId;
    }

    static async leaveSubcombat(combatant) {
        const combat = combatant?.combat ?? game.combat;
        if (!combatant || !combat) return;

        const flags = this._flags(combatant);
        const groupId = flags.groupId ?? "main";
        if (groupId === "main") return;

        const others = this._groupMembers(combat, groupId).filter((c) => c.id !== combatant.id);

        await combatant.update({
            flags: {
                "eon-rpg": {
                    ...flags,
                    groupId: "main",
                    groupType: "main",
                    subcombatRole: null,
                    pendingSubcombatTargets: []
                }
            }
        });

        if (others.length < 2) {
            const updates = others.map((c) => {
                const f = this._flags(c);
                return {
                    _id: c.id,
                    flags: {
                        "eon-rpg": {
                            ...f,
                            groupId: "main",
                            groupType: "main",
                            subcombatRole: null,
                            pendingSubcombatTargets: []
                        }
                    }
                };
            });
            if (updates.length) await combat.updateEmbeddedDocuments("Combatant", updates);
        }
    }

    static async createSubcombat(actor, opponentIds = [], role = "attacker") {
        const actorId = actor?._id ?? actor?.id ?? "unknown";
        const rid = foundry?.utils?.randomID ? foundry.utils.randomID() : Math.random().toString(36).slice(2, 10);
        const subcombatId = `subcombat_${actorId}_${rid}`;

        // Minimal compatible payload for current callers. This can later be expanded
        // with stricter Eon rule checks and group state persistence.
        return subcombatId;
    }
}
