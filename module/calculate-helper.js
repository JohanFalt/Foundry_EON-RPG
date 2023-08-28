import DiceHelper from "./dice-helper.js";

export default class CalculateHelper {
    static async hanteraBerakningar(actorData) {

        // Fokushantering
        if (actorData.system.egenskap.fokus.max > 10) {
            actorData.system.egenskap.fokus.max = 10;
        }

        if (actorData.system.egenskap.fokus.max < 0) {
            actorData.system.egenskap.fokus.max = 0;
        }

        if (actorData.system.egenskap.fokus.varde > actorData.system.egenskap.fokus.max) {
            actorData.system.egenskap.fokus.varde = parseInt(actorData.system.egenskap.fokus.max);
        }

        // Utmattningberäkning
        if (!Number.isInteger(actorData.system.skada.utmattning.grund)) {
            actorData.system.skada.utmattning.grund = 0;
        }
        if (!Number.isInteger(actorData.system.skada.infektion)) {
            actorData.system.skada.infektion = 0;
        }

        const grundUtmattningRustning = this._beraknaRustningBelastning(actorData.items.filter(rustning => rustning.type === "Rustning" && rustning.system.installningar.buren));

        actorData.system.skada.utmattning.grund = actorData.system.skada.infektion + grundUtmattningRustning;

        if (!Number.isInteger(actorData.system.skada.utmattning.varde)) {
            actorData.system.skada.utmattning.varde = parseInt(actorData.system.skada.utmattning.grund);
        }
        if (actorData.system.skada.utmattning.varde < actorData.system.skada.utmattning.grund) {
            actorData.system.skada.utmattning.varde = parseInt(actorData.system.skada.utmattning.grund);
        }
    }

    static async BeraknaHarleddEgenskaper(actorData) {
        actorData.system.harleddegenskaper.forflyttning = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.rorlighet, actorData.system.grundegenskaper.talighet);
        actorData.system.harleddegenskaper.intryck = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.utstralning, actorData.system.grundegenskaper.visdom);
        actorData.system.harleddegenskaper.kroppsbyggnad = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.styrka, actorData.system.grundegenskaper.talighet);
        actorData.system.harleddegenskaper.reaktion = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.rorlighet, actorData.system.grundegenskaper.uppfattning);
        actorData.system.harleddegenskaper.sjalvkontroll = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.psyke, actorData.system.grundegenskaper.vilja);
        actorData.system.harleddegenskaper.vaksamhet = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.psyke, actorData.system.grundegenskaper.uppfattning);
        actorData.system.harleddegenskaper.livskraft = await DiceHelper.BeraknaLivskraft(actorData.system.grundegenskaper.styrka, actorData.system.grundegenskaper.talighet);
        actorData.system.harleddegenskaper.grundskada = await DiceHelper.BeraknaGrundskada(actorData.system.grundegenskaper.styrka);
        actorData.system.harleddegenskaper.grundrustning = await DiceHelper.BeraknaGrundrustning(actorData.system.grundegenskaper.styrka, actorData.system.grundegenskaper.talighet);
        actorData.system.harleddegenskaper.initiativ = await DiceHelper.BeraknaInitiativ(actorData);        
    }

    static BeraknaBelastningAvdrag(varde) {
        let avdrag = {
			"tvarde": 0,
			"bonus": 0
		};

        if ((varde >= 17) && (varde <= 20)) {
            avdrag = {
                "tvarde": 0,
                "bonus": 2
            };
        }
        else if ((varde >= 21) && (varde <= 24)) {
            avdrag = {
                "tvarde": 1,
                "bonus": 0
            };
        }
        else if ((varde >= 25) && (varde <= 28)) {
            avdrag = {
                "tvarde": 1,
                "bonus": 2
            };
        }
        else if ((varde >= 29) && (varde <= 48)) {
            avdrag = {
                "tvarde": 2,
                "bonus": 0
            };
        }
        else if (varde >= 48) {
            let totalt = Math.floor((varde - 48) / 4);
            let bonus = totalt + 1;

            if (bonus > 3) {
                const tarning = {
                    tvarde: 2,
                    bonus: 0
                }

                avdrag = DiceHelper.BeraknaBonus(tarning, bonus);
            }
            else {
                avdrag = {
                    tvarde: 2,
                    bonus: bonus
                }
            }            
        }

        return avdrag;
    }

    static _beraknaRustningBelastning(rustning) {
        let grundUtmattning = 0;

        for (const item of rustning) {
            if (item.system.belastning < 9) {
                grundUtmattning = 0;
            }
            else if ((item.system.belastning >= 9) || (item.system.belastning <= 32)) {
                grundUtmattning = 3;
            }
            else if ((item.system.belastning >= 33) || (item.system.belastning <= 40)) {
                grundUtmattning = 6;
            }
            else {
                const number = item.system.belastning - 40;
                grundUtmattning = Math.floor(number / 8) * 3;
            }
        }

        return grundUtmattning;
    }
}