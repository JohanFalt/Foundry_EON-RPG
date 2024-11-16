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
    }
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
    const color = game.settings.get("eon-dice-roller", "diceColor");
    

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
                rollInfo += game.EON.egenskaper[egenskap.namn].namn + " " + egenskap.varde;
            }
            else {
                rollInfo += game.EON.egenskaper[egenskap.namn].namn;
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

    dicetype = dicetype.replace("d", "T");
    let text = `Slår ${number}${dicetype}`;

    if (bonus > 0) {
        text = `Slår ${number}${dicetype}+${bonus}`;
    }
    else if (bonus < 0) {
        let sbonus = bonus * -1;
        text = `Slår ${number}${dicetype}-${sbonus}`;
    }

    if (diceRoll.grundvarde != undefined) {
        if (diceRoll.grundvarde != "") {
            text = `${text} (${diceRoll.grundvarde})`;
        }
    }    

    if ((difficulty > 0) && (result >= difficulty)) {
        let advetanges = Math.floor((result - difficulty) / 5);

        if (advetanges > 0) {
            resulttext = "LYCKAT SLAG (+" + advetanges + " övertag)";
        }
        else {
            resulttext = "LYCKAT SLAG";
        }

        
    }
    else if ((difficulty > 0) && (result < difficulty)) {
        resulttext = "MISSLYCKAT SLAG";
    }

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
    const template = `modules/eon-dice-roller/templates/roll-template.html`;
    const html = await renderTemplate(template, templateData);

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
    ChatMessage.applyRollMode(chatData, "roll");
    ChatMessage.create(chatData);

    return result;
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
    const template = `modules/eon-dice-roller/templates/roll-template.html`;
    const html = await renderTemplate(template, templateData);

    const chatData = {
        content: html,
        speaker: ChatMessage.getSpeaker(),
        rollMode: game.settings.get("core", "rollMode")        
    };
    ChatMessage.applyRollMode(chatData, "roll");
    ChatMessage.create(chatData);

    // ChatMessage.create({
    //     user: game.user.id,
    //     content: message,
    //     type: CONST.CHAT_MESSAGE_TYPES.OTHER
    // });
}