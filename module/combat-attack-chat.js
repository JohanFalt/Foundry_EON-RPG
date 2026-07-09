/**
 * Chattkoppling för stridsflöde: försvar, träffplats, tillfoga skada.
 * @module combat-attack-chat
 */

import { CombatAttackFlow, EON_ATTACK_FLAG } from "./combat-attack-flow.js";
import { DialogWeaponRoll, WeaponRoll } from "./dialogs/dialog-weapon-roll.js";
import { DialogSkillRoll, SkillRoll } from "./dialogs/dialog-skill-roll.js";
import { SkadetabellHelper } from "./skadetabell-helper.js";
import CalculateHelper from "./calculate-helper.js";

export class CombatAttackChat {
    static _clickListenerBound = false;

    static registerHooks() {
        Hooks.on("renderChatMessageHTML", (message, html) => {
            this._injectAttackHitLocationPreview(message, html);
            this._injectMessageControls(message, html);
        });
        this._bindCombatButtonClicks();
    }

    static _bindCombatButtonClicks() {
        if (this._clickListenerBound) return;
        this._clickListenerBound = true;
        document.addEventListener("click", (ev) => this._onCombatButtonClick(ev), true);
    }

    /**
     * @param {Event} ev
     */
    static async _onCombatButtonClick(ev) {
        const btn = ev.target?.closest?.("[data-eon-combat-action]");
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        const message = game.messages.get(btn.dataset.messageId);
        if (!message) return;
        const action = btn.dataset.eonCombatAction;
        if (action === "defend") await this.promptDefense(message);
        else if (action === "rollDamage") await this.openDamageRoll(message);
        else if (action === "applyDamage") await this.applyDamage(message);
        else if (action === "rollAllvarlig") await this.rollAllvarligSkada(message);
    }

    /**
     * Visa förhandslagen träffplats på anfallmeddelandet (rollperson-försvarare).
     * @param {ChatMessage} message
     * @param {HTMLElement|JQuery} html
     */
    static _injectAttackHitLocationPreview(message, html) {
        const flags = message.flags?.[EON_ATTACK_FLAG];
        if (flags?.flowType !== "attack" || !flags.bodyPartKey) return;

        const root = html instanceof HTMLElement ? html : html?.[0];
        if (!root) return;
        const content = root.querySelector(".message-content") ?? root;
        if (content.querySelector(".eon-attack-hit-location-preview")) return;

        const preview = document.createElement("div");
        preview.className = "tray-action-area eon-attack-hit-location-preview";
        preview.textContent = game.i18n.format("eon.combatAttack.attackHitLocationPreview", {
            roll: flags.hitLocationRoll ?? "?",
            location: flags.bodyPartLabel ?? flags.bodyPartKey
        });
        content.appendChild(preview);
    }

    /**
     * @param {ChatMessage} message
     * @param {HTMLElement|JQuery} html
     */
    static _injectMessageControls(message, html) {
        const flags = message.flags?.[EON_ATTACK_FLAG];
        if (!flags) return;

        const root = html instanceof HTMLElement ? html : html?.[0];
        if (!root) return;
        const content = root.querySelector(".message-content") ?? root;
        if (content.querySelector(".eon-combat-attack-controls")) return;

        const wrap = document.createElement("div");
        wrap.className = "eon-combat-attack-controls";

        const addBtn = (action, labelKey, iconClass) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "eon-combat-attack-btn";
            btn.dataset.eonCombatAction = action;
            btn.dataset.messageId = message.id;
            btn.innerHTML = `<i class="${iconClass}"></i> ${game.i18n.localize(labelKey)}`;
            wrap.appendChild(btn);
        };

        // Försvar endast på uppföljningsmeddelandet – inte på själva tärningsslaget.
        if (flags.flowType === "awaitingDefense" && flags.parentMessageId) {
            const parent = game.messages.get(flags.parentMessageId);
            const pf = parent?.flags?.[EON_ATTACK_FLAG];
            if (pf?.flowType === "attack" && pf?.waitingForDefense && this._canUserDefend(pf)) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "eon-combat-attack-btn";
                btn.dataset.eonCombatAction = "defend";
                btn.dataset.messageId = parent.id;
                btn.innerHTML = `<i class="fa-solid fa-shield"></i> ${game.i18n.localize("eon.combatAttack.chatDefendButton")}`;
                wrap.appendChild(btn);
            }
        }
        if (
            flags.flowType === "resolution" &&
            flags.hit &&
            flags.rawDamage == null &&
            flags.attackerActorId &&
            (game.user.isGM || game.actors.get(flags.attackerActorId)?.isOwner)
        ) {
            addBtn("rollDamage", "eon.combatAttack.chatRollDamageButton", "fa-solid fa-gavel");
        }
        if (
            flags.flowType === "damageCalc" &&
            Number(flags.finalDamage) > 0 &&
            !flags.damageApplied
        ) {
            addBtn("applyDamage", "eon.combatAttack.chatApplyDamageButton", "fa-solid fa-heart-crack");
        }
        if (this._canRollAllvarligSkada(flags)) {
            addBtn("rollAllvarlig", "eon.combatAttack.chatRollAllvarligButton", "fa-solid fa-skull");
        }

        if (wrap.children.length) content.appendChild(wrap);
    }

    /**
     * @param {object} flags
     * @returns {boolean}
     */
    static _canRollAllvarligSkada(flags) {
        if (!flags || flags.allvarligResolved) return false;
        if (Number(flags.finalDamage) < 10) return false;
        if (flags.allvarligBaseRoll == null) return false;
        if (!flags.damageApplied) return false;
        const defender = game.actors.get(flags.defenderActorId);
        if (!defender || !CombatAttackFlow.defenderUsesHitLocation(defender)) return false;
        return flags.flowType === "damageCalc" || flags.flowType === "damageApplied";
    }

    /**
     * Rendera om ett chattmeddelande (v14: ChatLog.renderMessage).
     * @param {ChatMessage} message
     */
    static async rerenderChatMessage(message) {
        if (!message) return;

        const options = { force: true };

        try {
            const ChatLog = foundry.applications?.sidebar?.tabs?.ChatLog;
            if (ChatLog?.renderMessage) {
                await ChatLog.renderMessage(message, options);
            } else if (ui.chat?.renderMessage) {
                await ui.chat.renderMessage(message, options);
            }
        } catch (err) {
            console.warn("eon-rpg | Kunde inte rendera om chattmeddelande", err);
        }
    }

    /**
     * Anfallsslag som väntar på försvar (direkt eller via awaitingDefense-meddelande).
     * @param {ChatMessage} message
     * @returns {{ attackMessage: ChatMessage, flags: object }|null}
     */
    static _resolveAttackFlowForDefense(message) {
        if (!message) return null;

        const flags = message.flags?.[EON_ATTACK_FLAG];

        if (!flags) return null;

        if (flags.flowType === "attack" && flags.waitingForDefense) {
            return { attackMessage: message, flags };
        }
        if (flags.flowType === "awaitingDefense" && flags.parentMessageId) {
            const parent = game.messages.get(flags.parentMessageId);
            const pf = parent?.flags?.[EON_ATTACK_FLAG];
            if (parent && pf?.flowType === "attack" && pf?.waitingForDefense) {
                return { attackMessage: parent, flags: pf };
            }
        }

        return null;
    }

    /**
     * @param {string} flowId
     * @returns {ChatMessage|undefined}
     */
    static findAttackMessageByFlowId(flowId) {
        if (!flowId) return undefined;

        for (let messageIndex = game.messages.size - 1; messageIndex >= 0; messageIndex--) {
            const message = game.messages.contents[messageIndex];
            const attackFlags = message.flags?.[EON_ATTACK_FLAG];
            if (attackFlags?.attackFlowId === flowId && attackFlags?.flowType === "attack") return message;
        }

        return undefined;
    }

    /**
     * Efter anfallsslag: spara resultat, visa väntar-meddelande, meddela försvarare.
     * @param {ChatMessage} attackMessage
     * @param {number} attackResult
     */
    static async afterAttackRolled(attackMessage, attackResult) {
        const flags = attackMessage.flags?.[EON_ATTACK_FLAG];
        if (!flags?.waitingForDefense) return;

        const attackFlagUpdates = {
            [`flags.${EON_ATTACK_FLAG}.attackResult`]: attackResult
        };

        const defenderActor = game.actors.get(flags.defenderActorId);

        if (defenderActor && CombatAttackFlow.defenderUsesHitLocation(defenderActor)) {
            const locRoll = await new Roll("1d10").evaluate();
            const loc = CombatAttackFlow.mapHitLocation(locRoll.total);
            attackFlagUpdates[`flags.${EON_ATTACK_FLAG}.hitLocationRoll`] = loc.roll;
            attackFlagUpdates[`flags.${EON_ATTACK_FLAG}.bodyPartKey`] = loc.key;
            attackFlagUpdates[`flags.${EON_ATTACK_FLAG}.bodyPartLabel`] = loc.label;
            attackFlagUpdates[`flags.${EON_ATTACK_FLAG}.hitLocationRolled`] = true;
        } else if (defenderActor) {
            attackFlagUpdates[`flags.${EON_ATTACK_FLAG}.hitLocationRolled`] = true;
        }

        await attackMessage.update(attackFlagUpdates);
        await this.rerenderChatMessage(attackMessage);

        const defenderName = flags.defenderName ?? "?";
        await CombatAttackFlow.postSystemMessage({
            actor: defenderActor ?? game.actors.get(flags.attackerActorId),
            title: game.i18n.localize("eon.combatAttack.awaitingDefenseTitle"),
            sections: [
                game.i18n.format("eon.combatAttack.awaitingDefenseBody", {
                    attacker: flags.attackerName ?? "?",
                    defender: defenderName,
                    result: attackResult
                }),
                `<em>${game.i18n.localize("eon.combatAttack.awaitingDefenseHint")}</em>`
            ],
            flags: {
                ...flags,
                flowType: "awaitingDefense",
                attackResult,
                parentMessageId: attackMessage.id
            }
        });

        if (this._canUserDefend(flags)) {
            ui.notifications.info(game.i18n.format("eon.combatAttack.defenderPrompt", { attacker: flags.attackerName }));
        } else {
            const attacker = game.actors.get(flags.attackerActorId);
            const isAttackerSide = game.user.isGM || attacker?.isOwner || attackMessage.user?.id === game.user.id;

            if (isAttackerSide) {
                ui.notifications.info(game.i18n.format("eon.combatAttack.attackerWaitingHint", {
                    defender: defenderName,
                    result: attackResult
                }));
            }
        }
    }

    /**
     * @param {object} flags
     */
    static _canUserDefend(flags) {
        if (game.user.isGM) return true;

        const defender = game.actors.get(flags.defenderActorId);

        return Boolean(defender?.isOwner);
    }

    /**
     * @param {ChatMessage} attackMessage
     */
    static async promptDefense(attackMessage) {
        const flags = attackMessage.flags?.[EON_ATTACK_FLAG];

        if (!flags?.waitingForDefense) return;

        const defender = game.actors.get(flags.defenderActorId);

        if (!defender) {
            ui.notifications.warn(game.i18n.localize("eon.combatAttack.defenderNotFound"));
            return;
        }

        const options = CombatAttackFlow.getDefenseOptions(defender);

        if (!options.length) {
            ui.notifications.warn(game.i18n.localize("eon.combatAttack.noDefenseOptions"));
            return;
        }

        const hasSkill = options.some((o) => o.kind === "skill");
        const hasWeapon = options.some((o) => o.kind === "weapon");
        const mustChoose = options.length > 1 || (hasSkill && hasWeapon);

        if (!mustChoose) {
            await this.openDefenseRoll(defender, attackMessage, options[0]);
            return;
        }

        const chosen = await this.promptDefenseChoice(options);
        
        if (chosen) {
            await this.openDefenseRoll(defender, attackMessage, chosen);
        }
    }

    /**
     * @param {Array<{ kind: string, item: Item, labelKey: string, labelParams?: object }>} options
     * @returns {Promise<object|null>}
     */
    static async promptDefenseChoice(options) {
        const rows = options.map((opt, idx) => {
            const label = CombatAttackFlow.formatDefenseOptionLabel(opt);
            const checked = idx === 0 ? "checked" : "";
            return `<label style="display:block;margin:6px 0;"><input type="radio" name="defenseOption" value="${idx}" ${checked}> ${label}</label>`;
        }).join("");

        return new Promise((resolve) => {
            const dialog = new foundry.applications.api.DialogV2({
                classes: ["eon-defense-choice-dialog"],
                window: { title: game.i18n.localize("eon.combatAttack.defenseChoiceTitle") },
                content: `<form><p>${game.i18n.localize("eon.combatAttack.defenseChoicePrompt")}</p>${rows}</form>`,
                buttons: [
                    {
                        action: "confirm",
                        label: game.i18n.localize("eon.dialogs.valj"),
                        callback: (_event, _button, app) => {
                            const root = app.element instanceof HTMLElement ? app.element : app.element?.[0];
                            const checked = root?.querySelector?.("input[name='defenseOption']:checked");
                            const idx = Number(checked?.value);
                            resolve(Number.isFinite(idx) && options[idx] ? options[idx] : null);
                        }
                    },
                    {
                        action: "cancel",
                        label: game.i18n.localize("eon.dialogs.avbryt"),
                        callback: () => resolve(null)
                    }
                ]
            });
            dialog.render(true);
        });
    }

    /**
     * @param {Actor} defender
     * @param {ChatMessage} attackMessage
     * @param {{ kind: string, item: Item }} option
     */
    static async openDefenseRoll(defender, attackMessage, option) {
        const flags = attackMessage.flags?.[EON_ATTACK_FLAG];

        const combatContext = {
            attackerName: flags.attackerName ?? "?",
            defenderName: flags.defenderName ?? "?",
            attackResult: Number(flags.attackResult ?? 0)
        };

        if (option.kind === "skill") {
            let item = option.item;
            if (!item && CombatAttackFlow.isMotstandareActor(defender)) {
                item = {
                    type: "Färdighet",
                    name: "eon.config.fardigheter.undvika",
                    system: {
                        grupp: "rorelse",
                        id: "undvika",
                        varde: CalculateHelper.motstandareAnfallForsvar(defender)
                    }
                };
            }
            const roll = new SkillRoll(item, defender);
            roll.svarighet = String(combatContext.attackResult ?? "");
            const dialog = new DialogSkillRoll(defender, roll, {
                combatContext,
                onRollComplete: async ({ result }) => {
                    const msg = game.messages.get(attackMessage.id);
                    if (msg) {
                        await this.resolveDefense(
                            msg,
                            result,
                            game.i18n.format("eon.combatAttack.defenseUndvikaResult", { result })
                        );
                    }
                }
            });
            await dialog.render(true);
            return;
        }

        const roll = new WeaponRoll(defender, option.item);
        roll.setCombatmode("defence");
        roll.svarighet = String(flags?.attackResult ?? "");
        const dialog = new DialogWeaponRoll(defender, roll);
        dialog.linkedAttackMessageId = attackMessage.id;
        dialog.linkedAttackResult = Number(flags?.attackResult ?? 0);
        dialog.linkedFlowId = flags?.attackFlowId;
        await dialog.render(true);
    }

    /**
     * @param {ChatMessage} attackMessage
     * @param {number} defenseResult
     * @param {string} defenseDescription
     */
    static async resolveDefense(attackMessage, defenseResult, defenseDescription = "") {
        const freshAttack = game.messages.get(attackMessage.id) ?? attackMessage;
        const flags = freshAttack.flags?.[EON_ATTACK_FLAG];
        if (!flags) return;
        if (!flags.waitingForDefense) return;

        const attackResult = Number(flags.attackResult ?? 0);
        const { hit, overtag } = CombatAttackFlow.compareAttackDefense(attackResult, defenseResult);

        await freshAttack.update({
            [`flags.${EON_ATTACK_FLAG}.waitingForDefense`]: false,
            [`flags.${EON_ATTACK_FLAG}.defenseResult`]: defenseResult,
            [`flags.${EON_ATTACK_FLAG}.flowType`]: "resolution"
        });

        const attackerName = flags.attackerName ?? "?";
        const defenderName = flags.defenderName ?? "?";
        const hitText = hit
            ? game.i18n.format("eon.combatAttack.resolutionHit", { overtag })
            : game.i18n.localize("eon.combatAttack.resolutionMiss");

        const resultHtml = hit
            ? `<strong>${hitText}</strong><br /><em>${game.i18n.localize("eon.combatAttack.resolutionHitHint")}</em>`
            : `<strong>${hitText}</strong>`;

        const resolutionSections = [
            game.i18n.format("eon.combatAttack.resolutionSummary", {
                attacker: attackerName,
                attack: attackResult,
                defender: defenderName,
                defense: defenseResult
            }),
            defenseDescription || ""
        ];

        if (hit && flags.bodyPartKey && flags.bodyPartLabel) {
            resolutionSections.push(
                game.i18n.format("eon.combatAttack.resolutionHitLocation", {
                    roll: flags.hitLocationRoll ?? "?",
                    location: flags.bodyPartLabel
                })
            );
        }

        const defenderActor = game.actors.get(flags.defenderActorId);
        await CombatAttackFlow.postSystemMessage({
            actor: defenderActor,
            title: game.i18n.localize("eon.combatAttack.resolutionTitle"),
            sections: resolutionSections,
            result: resultHtml,
            flags: {
                ...flags,
                flowType: "resolution",
                waitingForDefense: false,
                defenseResult,
                hit,
                overtag,
                hitLocationRolled: flags.hitLocationRolled ?? true,
                bodyPartKey: flags.bodyPartKey ?? null,
                bodyPartLabel: flags.bodyPartLabel ?? null,
                hitLocationRoll: flags.hitLocationRoll ?? null,
                rawDamage: null,
                finalDamage: null,
                damageApplied: false,
                parentMessageId: attackMessage.id
            }
        });
    }

    /**
     * @param {ChatMessage} carrierMessage Meddelande som bär stridsflödesflags (resolution).
     */
    static async openDamageRoll(carrierMessage) {
        const flags = carrierMessage.flags?.[EON_ATTACK_FLAG];
        const attacker = game.actors.get(flags?.attackerActorId);
        if (!attacker) return;
        const weaponId = flags?.weaponItemId;
        const item = weaponId ? attacker.items.get(weaponId) : null;
        if (!item) {
            ui.notifications.warn(game.i18n.localize("eon.combatAttack.weaponNotFound"));
            return;
        }
        const roll = new WeaponRoll(attacker, item);
        if (flags.weaponFattning === "enhand" || flags.weaponFattning === "tvahand") {
            roll.fattning = flags.weaponFattning;
        }
        roll.setCombatmode("damage");
        const dialog = new DialogWeaponRoll(attacker, roll);
        dialog._combatAttackFlow = {
            flowId: flags.attackFlowId,
            defenderActorId: flags.defenderActorId,
            defenderName: flags.defenderName,
            hitLocationMessageId: carrierMessage.id
        };
        await dialog.render(true);
    }

    /**
     * @param {ChatMessage} message
     */
    static async applyDamage(message) {
        const flags = message.flags?.[EON_ATTACK_FLAG];
        if (flags?.damageApplied) return;
        const finalDamage = Number(flags?.finalDamage ?? 0);
        if (finalDamage <= 0) return;

        const defender = game.actors.get(flags.defenderActorId);
        if (!defender) return;

        const body = CombatAttackFlow.resolveBodyPartFromFlags(flags);
        const result = await CombatAttackFlow.applyDamageToDefender(defender, body.key, finalDamage);

        await message.update({
            [`flags.${EON_ATTACK_FLAG}.damageApplied`]: true,
            [`flags.${EON_ATTACK_FLAG}.flowType`]: "damageApplied",
            [`flags.${EON_ATTACK_FLAG}.bodyPartKey`]: result?.bodyPartKey ?? body.key,
            [`flags.${EON_ATTACK_FLAG}.bodyPartLabel`]: body.label
        });

        if (defender.sheet?.rendered) defender.sheet.render(false);

        ui.notifications.info(game.i18n.format("eon.combatAttack.damageAppliedToast", {
            name: defender.name,
            location: body.label
        }));
        await this.rerenderChatMessage(message);
    }

    /**
     * Slå upp allvarlig skada på skadetabell och visa i chatten (ingen auto-applicering).
     * @param {ChatMessage} message
     */
    static async rollAllvarligSkada(message) {
        const flags = message.flags?.[EON_ATTACK_FLAG];
        if (!this._canRollAllvarligSkada(flags)) return;

        const defender = game.actors.get(flags.defenderActorId);
        if (!defender) return;

        const body = CombatAttackFlow.resolveBodyPartFromFlags(flags);
        const finalDamage = Number(flags.finalDamage ?? 0);
        const allvarligBaseRoll = Number(flags.allvarligBaseRoll);
        const damageType = flags.damageType || "hugg";

        const resolved = SkadetabellHelper.resolveAllvarligSkada(
            defender,
            damageType,
            body.key,
            allvarligBaseRoll,
            finalDamage
        );

        if (!resolved.ok) {
            const key = resolved.error === "eon4"
                ? "eon.combatAttack.allvarligEon4NotAvailable"
                : "eon.combatAttack.allvarligLookupFailed";
            ui.notifications.warn(game.i18n.localize(key));
            return;
        }

        const dtypeKey = CONFIG?.EON?.vapenskador?.[damageType] ?? damageType;
        const damageTypeLabel = game.i18n.has(dtypeKey) ? game.i18n.localize(dtypeKey) : damageType;
        const sections = SkadetabellHelper.formatAllvarligSections(resolved.row, {
            tableRoll: resolved.tableRoll
        });

        await CombatAttackFlow.postSystemMessage({
            actor: defender,
            title: game.i18n.localize("eon.combatAttack.allvarligResultTitle"),
            sections: [
                game.i18n.format("eon.combatAttack.allvarligResultSummary", {
                    name: defender.name,
                    type: damageTypeLabel,
                    location: body.label,
                    base: allvarligBaseRoll,
                    bonus: SkadetabellHelper.getIntervalBonus(finalDamage),
                    total: resolved.tableRoll
                }),
                ...sections
            ],
            result: `<em>${game.i18n.localize("eon.combatAttack.allvarligResultHint")}</em>`,
            flags: {
                ...foundry.utils.mergeObject(flags, {
                    flowType: "allvarligSkada",
                    allvarligTableRoll: resolved.tableRoll,
                    parentMessageId: message.id
                })
            }
        });

        await message.update({
            [`flags.${EON_ATTACK_FLAG}.allvarligResolved`]: true,
            [`flags.${EON_ATTACK_FLAG}.flowType`]: "damageApplied"
        });
        await this.rerenderChatMessage(message);
    }

    /**
     * Efter skadeslag: beräkna rustning och slutskada på träffplats-meddelande.
     * @param {string} hitLocationMessageId
     * @param {number} rawDamage
     * @param {string} damageType
     * @param {number|null} [allvarligBaseRoll]
     */
    static async attachDamageCalculation(hitLocationMessageId, rawDamage, damageType, allvarligBaseRoll = null) {
        const msg = game.messages.get(hitLocationMessageId);
        if (!msg) return null;
        const flags = msg.flags?.[EON_ATTACK_FLAG];
        if (!flags) return null;

        const defender = game.actors.get(flags.defenderActorId);
        const body = CombatAttackFlow.resolveBodyPartFromFlags(flags);
        const bodyKey = body.key;
        const dtype = damageType || "hugg";
        const armor = CombatAttackFlow.getArmorProtection(defender, bodyKey, dtype);
        const finalDamage = CombatAttackFlow.computeFinalDamage(rawDamage, armor);

        await msg.update({
            [`flags.${EON_ATTACK_FLAG}.rawDamage`]: rawDamage,
            [`flags.${EON_ATTACK_FLAG}.armor`]: armor,
            [`flags.${EON_ATTACK_FLAG}.finalDamage`]: finalDamage,
            [`flags.${EON_ATTACK_FLAG}.damageType`]: dtype,
            [`flags.${EON_ATTACK_FLAG}.bodyPartKey`]: bodyKey,
            [`flags.${EON_ATTACK_FLAG}.bodyPartLabel`]: body.label,
            [`flags.${EON_ATTACK_FLAG}.hitLocationRoll`]: body.roll ?? flags.hitLocationRoll ?? null
        });

        const preview = CombatAttackFlow.previewDamageApplication(defender, bodyKey, finalDamage, dtype);
        const sections = [
            game.i18n.format("eon.combatAttack.damageCalcSummary", {
                raw: rawDamage,
                armor,
                final: finalDamage,
                location: body.label
            })
        ];

        if (preview.utmattning > 0) {
            sections.push(game.i18n.format("eon.combatAttack.damagePreviewUtmattning", {
                utmattning: preview.utmattning
            }));
        }
        if (preview.allvarlig && allvarligBaseRoll != null) {
            const bonus = SkadetabellHelper.getIntervalBonus(finalDamage);
            const tableRoll = SkadetabellHelper.computeTableRoll(allvarligBaseRoll, finalDamage);
            sections.push(game.i18n.format("eon.combatAttack.damagePreviewAllvarligRoll", {
                base: allvarligBaseRoll,
                bonus,
                total: tableRoll,
                type: preview.damageTypeLabel,
                location: preview.bodyPartLabel
            }));
            sections.push(game.i18n.localize("eon.combatAttack.damagePreviewSarFromTable"));
        } else if (preview.allvarlig && preview.allvarligRoll) {
            sections.push(game.i18n.format("eon.combatAttack.damagePreviewAllvarlig", {
                roll: preview.allvarligRoll,
                type: preview.damageTypeLabel,
                location: preview.bodyPartLabel
            }));
            sections.push(game.i18n.localize("eon.combatAttack.damagePreviewSarFromTable"));
        } else {
            sections.push(game.i18n.localize("eon.combatAttack.damagePreviewAllvarligNo"));
        }

        await CombatAttackFlow.postSystemMessage({
            actor: defender,
            title: game.i18n.localize("eon.combatAttack.damageCalcTitle"),
            sections,
            result: `<em>${game.i18n.localize("eon.combatAttack.damageCalcHint")}</em>`,
            flags: {
                ...foundry.utils.mergeObject(flags, {
                    flowType: "damageCalc",
                    rawDamage,
                    armor,
                    finalDamage,
                    damageType: dtype,
                    damageApplied: false,
                    allvarligBaseRoll: allvarligBaseRoll ?? null,
                    allvarligResolved: false,
                    bodyPartKey: bodyKey,
                    bodyPartLabel: body.label,
                    hitLocationRoll: body.roll ?? flags.hitLocationRoll ?? null
                })
            }
        });

        return finalDamage;
    }
}
