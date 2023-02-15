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

        return varde;
    }

    static AdderaVarden(tarning1, tarning2) {
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
}

/* klassen som man använder för att skicka in information in i RollDice */
export class DiceRollContainer {
    constructor(actor) {
		this.actor = actor;  			// rolling actor
		this.number = 0;
		this.bonus = 0;
		this.type = "d6";
		this.obRoll = true;
    }
}

/* Slår ett antal tärningar */
export async function RollDice(diceRoll) {
    const number = diceRoll.number;
    const bonus = diceRoll.bonus;
    const type = diceRoll.type;
    const obRoll = diceRoll.obRoll;

    let canRoll = number > 0;
    let result = 0;
    let diceResult = [];
    let label = "";

    let numDices = number;
    let rolledDices = 0;

    const allRolls = [];

    while (numDices > rolledDices) {
        let roll = new Roll("1" + type);
        allRolls.push(roll);
        roll.evaluate({async:true});	
        
        roll.terms[0].results.forEach((dice) => {
        rolledDices += 1;

        if ((type == "d6") && (dice.result == 6) && (obRoll)) {
            numDices += 1;
            rolledDices -= 1;
        }
        else {
            result += parseInt(dice.result);
        }

        diceResult.push(dice.result);
        });
    }

    if (canRoll) {
        diceResult.forEach((dice) => {
            let diceicon = "";
            if (type == "d6") {
                

                switch (dice) {
                case 1:
                    diceicon = `<i class="fa-solid fa-dice-one tray-dice"></i>`;
                    break;
                case 2:
                    diceicon = `<i class="fa-solid fa-dice-two tray-dice"></i>`;
                    break;
                case 3:
                    diceicon = `<i class="fa-solid fa-dice-three tray-dice"></i>`;
                    break;
                case 4:
                    diceicon = `<i class="fa-solid fa-dice-four tray-dice"></i>`;
                    break;
                case 5:
                    diceicon = `<i class="fa-solid fa-dice-five tray-dice"></i>`;
                    break;
                case 6:
                    if (obRoll) {
                    diceicon = `<i class="fa-solid fa-dice-six tray-dice tray-dice-max"></i>`;
                    }
                    else {
                    diceicon = `<i class="fa-solid fa-dice-six tray-dice"></i>`;
                    }
                    
                    break;
                }
            } 
            else {
                diceicon = `<span class="tray-dice-text">${dice}</span>`;
            }       

            label += `<div class="tray-dice-area">${diceicon}</div>`;
        });

        result += parseInt(bonus);
    }

    let text = `<div class="tray-roll-area"><h2>Slår ${number}${type}</h2></div><div class="tray-dice-row">${label}</div>`;

    if (bonus > 0) {
        text = `<div class="tray-roll-area"><h2>Slår ${number}${type}+${bonus}</h2></div><div class="tray-dice-row">${label}</div>`;
    }
    else if (bonus < 0) {
        text = `<div class="tray-roll-area"><h2>Slår ${number}${type}-${bonus}</h2></div><div class="tray-dice-row">${label}</div>`;
    }

    if (numDices > 1) {
        text += `<div class="tray-result-area">Totalt: ${result}</div>`;
    }

    const chatOpt = {
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        rolls: allRolls,
        rollMode: game.settings.get('core', 'rollMode'),
        content: text
    };
    ChatMessage.create(chatOpt);

    return result;
}
