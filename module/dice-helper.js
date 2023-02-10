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

/* function HanteraBonus(dice, bonus) {
    if (totalBonus > 3) {
        totalDice += 1;
        bonus -= 4;
    }
    else if (totalBonus < 1) {
        totalDice -= 1;
        bonus = 2;
    }

    return -1;
} */