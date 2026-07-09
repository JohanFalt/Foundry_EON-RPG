import { formatT6Pool } from "./apps/eon5-weapon-kroppsbyggnad.js";

export default class DiceHelper {
    static async BeraknaMedelvarde(tarning1, tarning2) {
        let totalTarning = parseInt(tarning1.tvarde) + parseInt(tarning2.tvarde);
        let totalBonus = parseInt(tarning1.bonus) + parseInt(tarning2.bonus);

        if (totalBonus > 3) {
            totalTarning += 1;
            totalBonus -= 4;
        }
        else if (totalBonus < -1) {
            totalTarning -= 1;
            totalBonus = 2;
        }

        const medelVarde = Math.floor((totalTarning * 4 + totalBonus) / 2);
        const tarningVarde = Math.floor(medelVarde / 4);
        const bonusVarde = medelVarde % 4;

        return {
            tvarde: tarningVarde,
            bonus: bonusVarde
        };
    }    

    static async BeraknaHalvera(tarning) {
        let totalTarning = parseInt(tarning.tvarde);
        let totalBonus = parseInt(tarning.bonus);

        const halvering = Math.floor((totalTarning * 4 + totalBonus) / 2);
        const tarningVarde = Math.floor(halvering / 4);
        const bonusVarde = halvering % 4;

        return {
            tvarde: tarningVarde,
            bonus: bonusVarde
        };
    }

    static async BeraknaLivskraft(tarning1, tarning2) {
        let totalTarning = parseInt(tarning1.tvarde) + parseInt(tarning2.tvarde);
        let totalBonus = parseInt(tarning1.bonus) + parseInt(tarning2.bonus);

        if (totalBonus > 3) {
            totalTarning += 1;
            totalBonus -= 4;
        }
        else if (totalBonus < -1) {
            totalTarning -= 1;
            totalBonus = 2;
        }

        let tarningVarde = 3;
        let bonusVarde = 0;

        if (totalTarning > 4) {
            bonusVarde = totalTarning - 4;
            tarningVarde = tarningVarde + Math.floor(bonusVarde / 4);
            bonusVarde = bonusVarde % 4;

        }

        return {
            tvarde: tarningVarde,
            bonus: bonusVarde
        };
    }

    static async BeraknaGrundskada(tarning) {
        let halveradTarning = await this.BeraknaHalvera(tarning);
        halveradTarning.tvarde += 1;

        return halveradTarning;
    }

    static async BeraknaGrundrustning(tarning1, tarning2) {
        let totalTarning = parseInt(tarning1.tvarde) + parseInt(tarning2.tvarde);
        let totalBonus = parseInt(tarning1.bonus) + parseInt(tarning2.bonus);
        let varde = 0;

        if (totalBonus > 3) {
            totalTarning += 1;
            totalBonus -= 4;
        }
        else if (totalBonus < -1) {
            totalTarning -= 1;
            totalBonus = 2;
        }        

        if (totalTarning >= 5) {
            varde = totalTarning - 4;
        }

        return {
            varde: varde,
            totalt: varde,
            bonuslista: []
        };
    }

    static async BeraknaInitiativ(actorData) {
        const totalTarning = actorData.system.grundegenskaper.rorlighet.totalt.tvarde;
        const totalBonus = actorData.system.grundegenskaper.rorlighet.totalt.bonus;
        const tarning = `${totalTarning}d6`;

        return {
            tarning: tarning,
            tvarde: totalTarning,            
            bonus: totalBonus
        };
    }

    static AdderaVarden(tarning1, tarning2) {
        if ((tarning1 == undefined) && (tarning2 == undefined)) {
            return {
                tvarde: 0,
                bonus: 0
            };
        }
        else if (tarning1 == undefined) {
            return {
                tvarde: parseInt(tarning2.tvarde),
                bonus: parseInt(tarning2.bonus)
            };
        }
        else if (tarning2 == undefined) {
            return {
                tvarde: parseInt(tarning1.tvarde),
                bonus: parseInt(tarning1.bonus)
            };
        }

        let totalTarning = parseInt(tarning1.tvarde) + parseInt(tarning2.tvarde);
        let totalBonus = parseInt(tarning1.bonus) + parseInt(tarning2.bonus);

        if (totalBonus > 3) {
            totalTarning += 1;
            totalBonus -= 4;
        }
        else if (totalBonus < -1) {
            totalTarning -= 1;
            totalBonus = 2;
        } 

        return {
            tvarde: totalTarning,
            bonus: totalBonus
        };
    }    

    static BeraknaBonus(tarning, bonus) {
        let tvarde = 0;
        bonus = tarning.bonus + bonus;

        while (bonus > 3) {
            tvarde += 1;
            bonus -= 4;
        }

        let totalTarning = parseInt(tarning.tvarde) + parseInt(tvarde);
        let totalBonus = parseInt(bonus);

        return {
            tvarde: totalTarning,
            bonus: totalBonus
        }
    }

    
}

/* klassen som man använder för att skicka in information in i RollDice */
export class DiceRollContainer {
    constructor(actor, config) {
        this.config = config;
		this.actor = actor;  			// rolling actor
        this.info = [];
        this.description = "";
        this.grundvarde = "";
		this.number = 0;
		this.bonus = 0;
        this.svarighet = 0;
		this.dicetype = "d6";
		this.obRoll = true;
        this.actorName = actor.name;
        /** @type {object|null} flags för ChatMessage (eon-rpg stridsflöde) */
        this.chatFlags = null;
    }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {number} number
 * @param {string} dicetype
 * @param {number} bonus
 * @param {{ ob?: boolean }} [options]
 */
export function buildRollDiceTitle(number, dicetype, bonus, options = {}) {
    const dt = dicetype.replace("d", "T");
    const ob = (options.ob && dicetype === "d6") ? game.i18n.localize("eon.roll.ob") : "";
    const dice = `${ob}${number}${dt}`;

    if (bonus > 0) {
        return game.i18n.format("eon.roll.slarWithBonus", { dice, bonus });
    }
    if (bonus < 0) {
        return game.i18n.format("eon.roll.slarWithPenalty", { dice, bonus: Math.abs(bonus) });
    }

    return game.i18n.format("eon.roll.slar", { dice });
}

/**
 * @param {number} difficulty
 * @param {number} result
 */
export function buildRollResultText(difficulty, result) {
    if (!(difficulty > 0)) return "";
    if (result >= difficulty) {
        const advantage = Math.floor((result - difficulty) / 5);
        if (advantage > 0) {
            return game.i18n.format("eon.roll.successAdvantage", { advantage });
        }
        return game.i18n.localize("eon.roll.success");
    }

    return game.i18n.localize("eon.roll.failure");
}

/** @param {Actor} actor */
export function buildBelastningModifierHtml(actor) {
    const avdrag = actor.system?.berakning?.belastning?.totaltavdrag;

    if (!avdrag || (avdrag.tvarde <= 0 && avdrag.bonus <= 0)) 
        return "";

    const line = game.i18n.format("eon.roll.modifierLine", {
        dice: formatT6Pool(avdrag),
        label: game.i18n.localize("eon.sheets.actor.belastning")
    });

    return `${line}<br />`;
}

/** @param {Actor} actor */
export function buildSmartaModifierHtml(actor) {
    const smarta = actor.system?.berakning?.svarighet?.smarta;

    if (!smarta || smarta <= 0) 
        return "";

    const line = game.i18n.format("eon.roll.modifierLine", {
        dice: `${smarta}T6`,
        label: game.i18n.localize("eon.sheets.actor.smarta")
    });

    return `${line}<br />`;
}

/**
 * @param {number} count
 * @param {"RightLeg"|"LeftLeg"|"RightArm"|"LeftArm"} limbKey
 */
export function buildWoundInLimbHtml(count, limbKey) {
    if (!count || count <= 0) return "";

    const limb = game.i18n.localize(`eon.roll.limb${limbKey}`);

    return `${game.i18n.format("eon.roll.woundInLimb", {
        count,
        limb,
        dice: `${count}T6`
    })}<br />`;
}

/** @param {Actor} actor */
export function buildWoundsBodyHtml(actor) {
    const count = actor.system?.berakning?.svarighet?.antalsar ?? 0;

    if (count <= 0) 
        return "";

    return `${game.i18n.format("eon.roll.woundsBody", {
        count,
        dice: `${count}T6`
    })}<br />`;
}

/**
 * @param {number} count
 * @param {"RightLeg"|"LeftLeg"|"RightArm"|"LeftArm"} limbKey
 */
export function buildWoundIgnoredHtml(count, limbKey) {
    if (!count || count <= 0) 
        return "";

    const limb = game.i18n.localize(`eon.roll.limb${limbKey}`);
    
    return `${game.i18n.format("eon.roll.woundIgnored", { count, limb })}<br />`;
}

/* Slår ett antal tärningar */
export async function RollDice(diceRoll) {
    const number = diceRoll.number;
    const bonus = diceRoll.bonus;
    const difficulty = diceRoll.svarighet;
    let dicetype = diceRoll.dicetype;
    const obRoll = diceRoll.obRoll;
    const typeRoll = diceRoll.typeroll;
    const action = diceRoll.action;
    const color = game.settings.get("eon-rpg", "diceColor");
    

    let canRoll = number > 0;
    let result = 0;
    let diceResult = [];
    let rollInfo = "";
    let rollDescription = "";
    let resulttext = "";

    // egenskaper
    if ((typeRoll == CONFIG.EON.slag.vapen) && (diceRoll.info.length > 0)) {
        for (const egenskap of diceRoll.info) {
            if (rollInfo != "") {
                rollInfo += ", ";
            }
            if(egenskap.varde > 0) {
                rollInfo += egenskap.label + " " + egenskap.varde;
            }
            else {
                rollInfo += egenskap.label;
            }            
        }
    }
    if ((typeRoll == CONFIG.EON.slag.grundegenskap) && (diceRoll.info.length > 0)) {
        for (const egenskap of diceRoll.info) {
            if (rollInfo != "") {
                rollInfo += ", ";
            }

            rollInfo += egenskap;
        }
    }
    if ((typeRoll == CONFIG.EON.slag.fardighet) && (diceRoll.info.length > 0)) {
        for (const egenskap of diceRoll.info) {
            if (rollInfo != "") {
                rollInfo += ", ";
            }

            rollInfo += egenskap;
        }
    }

    if ((diceRoll.description != "") && (diceRoll.description != undefined)) {
        rollDescription = diceRoll.description;
    }

    let numDices = number;
    let rolledDices = 0;

    const allDices = [];

    while (numDices > rolledDices) {
        let roll = await new Roll("1" + dicetype);
        await roll.evaluate();
        allDices.push(roll);
        
        roll.terms[0].results.forEach((dice) => {
            rolledDices += 1;

            if ((dicetype == "d6") && (dice.result == 6) && (obRoll)) {
                numDices += 1;
                rolledDices -= 1;
            }
            else {
                result += parseInt(dice.result);
            }

            diceResult.push(dice.result);
        });
    }

    const diceList = [];

    if (canRoll) {
        diceResult.forEach((dice) => {
            diceList.push(dice);
        });

        result += parseInt(bonus);
    }
    else {
        result = parseInt(bonus);
    }

    let text = buildRollDiceTitle(number, dicetype, bonus, { ob: obRoll });

    if (diceRoll.grundvarde != undefined) {
        if (diceRoll.grundvarde != "") {
            text = `${text} (${diceRoll.grundvarde})`;
        }
    }

    resulttext = buildRollResultText(difficulty, result);

    const templateData = {
        data: {
            info: rollInfo,
            description: rollDescription,
            config: diceRoll.config,
            actor: diceRoll.actor,
            dicecolor: color,
            isrollable: canRoll,
            type: typeRoll,
            action: action,
            title: text,
            diceresult: diceList,
            difficulty: difficulty,
            result: result,
            resulttext: resulttext,
            obroll: obRoll
        }
    };

    // Render the chat card template
    const template = `systems/eon-rpg/templates/dice/roll-template.html`;
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

    const chatData = {
        rolls: allDices,
        user: game.user.id,
        speaker: {
            actor: diceRoll.actor?.id,
            token: diceRoll.actor?.token?.id,
            alias: diceRoll.actorName
        },
        content: html,
        rollMode: game.settings.get("core", "rollMode")        
    };
    if (diceRoll.chatFlags && typeof diceRoll.chatFlags === "object") {
        chatData.flags = { "eon-rpg": foundry.utils.duplicate(diceRoll.chatFlags) };
    }
    ChatMessage.applyRollMode(chatData, "roll");
    const created = await ChatMessage.create(chatData);
    if (diceRoll && typeof diceRoll === "object") {
        diceRoll._createdMessageId = created?.id ?? null;
    }

    return result;
}

/**
 * Postar stridsflödesmeddelande med samma tray-mall som tärningsslag.
 * @param {{ actor?: Actor, title: string, sections?: string[], result?: string, diceTitle?: string, diceresult?: number[]|null, total?: number|null, flags?: object }} options
 * @returns {Promise<ChatMessage>}
 */
export async function postTrayChatMessage({
    actor,
    title,
    sections = [],
    result = "",
    diceTitle = "",
    diceresult = null,
    total = null,
    flags = null
}) {
    const config = game.EON?.CONFIG ?? CONFIG.EON;
    const color = game.settings.get("eon-rpg", "diceColor");
    const templateData = {
        data: {
            type: "combatFlow",
            config,
            actor,
            title,
            sections: sections.filter(Boolean),
            result,
            diceTitle,
            diceresult: Array.isArray(diceresult) ? diceresult : null,
            total: total != null ? total : null,
            dicecolor: color
        }
    };

    const template = "systems/eon-rpg/templates/dice/roll-template.html";
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

    const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: html,
        rollMode: game.settings.get("core", "rollMode")
    };

    if (flags && typeof flags === "object") {
        chatData.flags = { "eon-rpg": foundry.utils.duplicate(flags) };
    }

    ChatMessage.applyRollMode(chatData, "roll");
    return ChatMessage.create(chatData);
}

export async function SendMessage(actor, config, headline, message) {

    const templateData = {
        data: {
            description: message,
            config: config,
            actor: actor,
            type: "message",
            title: headline,
        }
    };

    // Render the chat card template
    const template = `systems/eon-rpg/templates/dice/roll-template.html`;
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

    const chatData = {
        content: html,
        speaker: ChatMessage.getSpeaker(),
        rollMode: game.settings.get("core", "rollMode")        
    };
    ChatMessage.applyRollMode(chatData, "roll");
    ChatMessage.create(chatData);
}