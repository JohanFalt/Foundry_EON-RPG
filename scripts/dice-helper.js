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