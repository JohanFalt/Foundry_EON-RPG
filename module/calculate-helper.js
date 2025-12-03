import DiceHelper from "./dice-helper.js";

export default class CalculateHelper {
    static async BeraknaTotaltVarde(attribut) {
        if (attribut == undefined) {
            console.error("'attribut' empty in BeraknaTotaltVarde");
            return false;
        }

        // Special handling för läkningstakt och grundrustning
        if (attribut.varde !== undefined) {
            let total = parseInt(attribut.varde) || 0;
            if (attribut.bonuslista?.length > 0) {
                attribut.bonuslista.forEach(bonus => {
                    total += parseInt(bonus.tvarde) || 0;
                });
            }
            attribut.totalt = total;
            return total;
        }

        if (!attribut.grund) {
            let totalValue = parseInt(attribut.varde) || 0;
            if (attribut.bonuslista) {
                for (const bonus of attribut.bonuslista) {
                    totalValue += parseInt(bonus.tvarde) || 0;
                }
            }
            attribut.totalt = totalValue;
            return totalValue;
        }

        let totalTarning = Math.floor(parseInt(attribut.grund.tvarde));
        let totalBonus = Math.floor(parseInt(attribut.grund.bonus));

        if(attribut.bonuslista.length > 0) {
			for (const bonus of attribut.bonuslista) {
				totalTarning += Math.floor(parseInt(bonus.tvarde || 0));
				totalBonus += Math.floor(parseInt(bonus.bonus || 0));
			}

			if (totalBonus > 3) {
				while (totalBonus > 3) {
					totalTarning += 1;
					totalBonus -= 4;
				}
			}
            else if (totalBonus < -1) {
				while (totalBonus < -1) {
					totalTarning -= 1;
					totalBonus += 4;
				}
			}
		}

		if ((totalTarning == 0) && (totalBonus < 0)) {
			totalBonus = 0;
		}
		if (totalTarning < 0) {
			totalTarning = 0;
			totalBonus = 0;
		}

        return {
            tvarde: Math.floor(totalTarning),
            bonus: Math.floor(totalBonus)
        }
    }

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

        const rustning = actorData.items.filter(rustning => rustning.type === "Rustning" && rustning.system.installningar.buren);
        let rustningBelastning = 0;
            
        for (const i of rustning) {
            rustningBelastning += i.system.belastning;
        }

        const grundUtmattningRustning = this._beraknaRustningBelastning(rustningBelastning, actorData.system.installningar.eon);

        actorData.system.skada.utmattning.grund = actorData.system.skada.infektion + grundUtmattningRustning;

        if (!Number.isInteger(actorData.system.skada.utmattning.varde)) {
            actorData.system.skada.utmattning.varde = parseInt(actorData.system.skada.utmattning.grund);
        }
        if (actorData.system.skada.utmattning.varde < actorData.system.skada.utmattning.grund) {
            actorData.system.skada.utmattning.varde = parseInt(actorData.system.skada.utmattning.grund);
        }
    }

    static async BeraknaHarleddEgenskaper(actorData) {
        if (actorData.type.toLowerCase().replace(" ", "") != "rollperson") {
            return;
        }

        let styrka = actorData.system.grundegenskaper.styrka.totalt;
        let rorlighet = actorData.system.grundegenskaper.rorlighet.totalt;
        let talighet = actorData.system.grundegenskaper.talighet.totalt;
        let uppfattning = actorData.system.grundegenskaper.uppfattning.totalt;
        let utstralning = actorData.system.grundegenskaper.utstralning.totalt;
        let psyke = actorData.system.grundegenskaper.psyke.totalt;
        let vilja = actorData.system.grundegenskaper.vilja.totalt;
        let visdom = actorData.system.grundegenskaper.visdom.totalt;

        actorData.system.harleddegenskaper.forflyttning.grund = await DiceHelper.BeraknaMedelvarde(rorlighet, talighet);
        actorData.system.harleddegenskaper.forflyttning.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.forflyttning);
        actorData.system.harleddegenskaper.intryck.grund = await DiceHelper.BeraknaMedelvarde(utstralning, visdom);
        actorData.system.harleddegenskaper.intryck.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.intryck);
        actorData.system.harleddegenskaper.kroppsbyggnad.grund = await DiceHelper.BeraknaMedelvarde(styrka, talighet);
        actorData.system.harleddegenskaper.kroppsbyggnad.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.kroppsbyggnad);
        actorData.system.harleddegenskaper.reaktion.grund = await DiceHelper.BeraknaMedelvarde(rorlighet, uppfattning);
        actorData.system.harleddegenskaper.reaktion.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.reaktion);
        actorData.system.harleddegenskaper.sjalvkontroll.grund = await DiceHelper.BeraknaMedelvarde(psyke, vilja);
        actorData.system.harleddegenskaper.sjalvkontroll.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.sjalvkontroll);
        actorData.system.harleddegenskaper.vaksamhet.grund = await DiceHelper.BeraknaMedelvarde(psyke, uppfattning);
        actorData.system.harleddegenskaper.vaksamhet.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.vaksamhet);
        actorData.system.harleddegenskaper.livskraft.grund = await DiceHelper.BeraknaLivskraft(styrka, talighet);
        actorData.system.harleddegenskaper.livskraft.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.livskraft);
        actorData.system.harleddegenskaper.grundskada.grund = await DiceHelper.BeraknaGrundskada(styrka);
        actorData.system.harleddegenskaper.grundskada.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.grundskada);
        actorData.system.harleddegenskaper.grundrustning = await DiceHelper.BeraknaGrundrustning(styrka, talighet);
        actorData.system.harleddegenskaper.initiativ.grund = await DiceHelper.BeraknaInitiativ(actorData);        
        actorData.system.harleddegenskaper.initiativ.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.initiativ);

        // Update grundskada calculation
        const baseGrundskada = await DiceHelper.BeraknaGrundskada(styrka);
        actorData.system.harleddegenskaper.grundskada.grund = baseGrundskada;
        
        // Apply modifiers if they exist
        if (actorData.system.harleddegenskaper.grundskada.modifierare) {
            actorData.system.harleddegenskaper.grundskada.grund.tvarde += actorData.system.harleddegenskaper.grundskada.modifierare.tvarde;
            actorData.system.harleddegenskaper.grundskada.grund.bonus += actorData.system.harleddegenskaper.grundskada.modifierare.bonus;
        }
        
        actorData.system.harleddegenskaper.grundskada.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.grundskada);

        // Add calculation for läkningstakt total
        if (actorData.system.strid.lakningstakt) {
            actorData.system.strid.lakningstakt.totalt = 
                await CalculateHelper.BeraknaTotaltVarde(actorData.system.strid.lakningstakt);
        }

        // Handle grundrustning with bonus preservation
        const baseGrundrustning = await DiceHelper.BeraknaGrundrustning(styrka, talighet);
        if (!actorData.system.harleddegenskaper.grundrustning?.bonuslista) {
            actorData.system.harleddegenskaper.grundrustning = baseGrundrustning;
        } else {
            actorData.system.harleddegenskaper.grundrustning.varde = baseGrundrustning.varde;
            actorData.system.harleddegenskaper.grundrustning.totalt = 
                await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.grundrustning);
        }

        actorData.system.harleddegenskaper.initiativ.grund = await DiceHelper.BeraknaInitiativ(actorData);        
        actorData.system.harleddegenskaper.initiativ.totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper.initiativ);
    }

    /* Belastningstabellen som detta är från Strid */
    static BeraknaBelastningAvdrag(varde, bok) {
        let avdrag = {
			"tvarde": 0,
			"bonus": 0
		};

        if (bok == "eon4") {
            if (varde < 17) {
                avdrag = {
                    "tvarde": 0,
                    "bonus": 0
                };
            }
            if ((varde >= 17) && (varde <= 20)) {
                avdrag = {
                    "tvarde": 0,
                    "bonus": 2
                };
            }
            if ((varde >= 21) && (varde <= 24)) {
                avdrag = {
                    "tvarde": 1,
                    "bonus": 0
                };
            }
            if ((varde >= 25) && (varde <= 28)) {
                avdrag = {
                    "tvarde": 1,
                    "bonus": 2
                };
            }
            if ((varde >= 29) && (varde <= 48)) {
                avdrag = {
                    "tvarde": 2,
                    "bonus": 0
                };
            }
            if (varde > 48) {
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
        }

        if (bok == "eon5") {
            if (varde < 17) {
                avdrag = {
                    "tvarde": 0,
                    "bonus": 0
                };
            }
            if ((varde >= 17) && (varde <= 24)) {
                avdrag = {
                    "tvarde": 1,
                    "bonus": 0
                };
            }
            if ((varde >= 25) && (varde <= 48)) {
                avdrag = {
                    "tvarde": 2,
                    "bonus": 0
                };
            }
            if (varde > 48) {
                avdrag = {
                    "tvarde": 3,
                    "bonus": 0
                };
            }
        }

        return avdrag;
    }

    // Beräkna svårigheten att höja färdighet
    static CalculateImproveDifficulty(actor, item) {
        const tvarde = item.system.varde.tvarde;
        const bonus = item.system.varde.bonus;
        const isLattlard = item.system.installningar.lattlard;
        const isSvarlard = item.system.installningar.svarlard;
        const attributeValue = actor.system.grundegenskaper[item.system.attribut]?.totalt.tvarde * 4 + actor.system.grundegenskaper[item.system.attribut]?.totalt.bonus;       
    
        if (tvarde === 0 && bonus === 0) {
            return Infinity; // This ensures that a roll can never succeed for a 0-value skill
        }
        const rank = ((tvarde - 2) * 4) + bonus;
        let difficulty = 4 + (rank * 2);
    
        // Check if skill is less than the attribute it's based on
        const skillValue = tvarde * 4 + bonus;
        if (skillValue < attributeValue) {
            difficulty -= 2;
        }
    
        if (isLattlard) {
            difficulty -= 2;
        } 
        else if (isSvarlard) {
            difficulty += 4;
        }
    
        // For lättlärd skills, we allow the difficulty to be less than 4
        return isLattlard ? difficulty : Math.max(difficulty, 4);
    }

    /* Belastningstabellen baserad på rustning */
    static _beraknaRustningBelastning(belastning, bok) {
        let grundUtmattning = 0;

        if (bok == "eon4") {
            // Grundboken
            if (belastning < 9) {
                grundUtmattning = 0;
            }
            if ((belastning >= 9) && (belastning <= 32)) {
                grundUtmattning = 3;
            }
            if ((belastning >= 33) && (belastning <= 40)) {
                grundUtmattning = 6;
            }
            if (belastning > 40){
                const number = belastning - 40;
                grundUtmattning = Math.floor(number / 8) * 3;
            }
        }
        
        if (bok == "strid") {
            // Strid
            if (belastning < 9) {
                grundUtmattning = 0;
            }
            if ((belastning >= 9) && (belastning <= 12)) {
                grundUtmattning = 2;
            }
            if ((belastning >= 13) && (belastning <= 28)) {
                grundUtmattning = 3;
            }
            if ((belastning >= 29) && (belastning <= 32)) {
                grundUtmattning = 4;
            }
            if ((belastning >= 33) && (belastning <= 36)) {
                grundUtmattning = 5;
            }
            if ((belastning >= 37) && (belastning <= 40)) {
                grundUtmattning = 6;
            }
            if ((belastning >= 41) && (belastning <= 44)) {
                grundUtmattning = 8;
            }
            if ((belastning >= 45) && (belastning <= 48)) {
                grundUtmattning = 9;
            }
            if (belastning > 48) {
                const number = belastning - 48;
                grundUtmattning = (Math.floor(number / 4) * 2) + 9;
            }
        }

        if (bok == "eon5") {
            // Eon 5
            if (belastning < 9) {
                grundUtmattning = 0;
            }
            if ((belastning >= 9) && (belastning <= 16)) {
                grundUtmattning = 1;
            }
            if ((belastning >= 17) && (belastning <= 24)) {
                grundUtmattning = 2;
            }
            if ((belastning >= 25) && (belastning <= 32)) {
                grundUtmattning = 4;
            }
            if ((belastning >= 33) && (belastning <= 40)) {
                grundUtmattning = 6;
            }
            if ((belastning >= 41) && (belastning <= 48)) {
                grundUtmattning = 8;
            }
            if ((belastning >= 49) && (belastning <= 56)) {
                grundUtmattning = 10;
            }
            if (belastning > 56) {
                const number = belastning - 56;
                grundUtmattning = (Math.floor(number / 8) * 2) + 10;
            }
        }

        return grundUtmattning;
    }    

    static isNumeric(str) {
        if (typeof str == "number") return true;
        if (typeof str != "string") return false;
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
               !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    
}