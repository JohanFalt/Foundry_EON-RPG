import DiceHelper from "./dice-helper.js";
import { harleddT6AttributTillAttributVarde } from "./apps/ccw/ccw-fardighet-rules.js";
import { getGrundrustningOchGrundskadaFromKroppsbyggnadVarde } from "./apps/eon5-kroppsbyggnad-derived.js";

export default class CalculateHelper {
    /**
     * Varelse under Eon 4-regler: type Varelse och eon tom eller "eon4".
     * @param {Actor|object} actorOrData - Actor eller duplicerad actorData med .type och .system
     */
    static isVarelseEon4(actorOrData) {
        if (!actorOrData) return false;
        const type = actorOrData.type;
        if (type !== "Varelse") return false;
        const eon = actorOrData.system?.installningar?.eon;
        return eon === "eon4" || eon === "";
    }

    /**
     * Eon 5-rollperson, motståndare eller annan aktör med installningar.eon === "eon5".
     * @param {Actor|object} actorOrData
     */
    static isEon5Actor(actorOrData) {
        if (!actorOrData) return false;
        if (actorOrData.system?.installningar?.eon === "eon5") return true;
        const type = (actorOrData.type ?? "").toLowerCase().replace(/\s/g, "");
        return type === "rollperson5" || type === "motstandare5";
    }

    /**
     * Eon 5: grundrustning och grundskada från kroppsbyggnad (tabell i regelboken).
     * @param {object} actorData duplicerad aktördata med .system
     */
    static async beraknaGrundrustningOchGrundskadaEon5(actorData) {
        if (!CalculateHelper.isEon5Actor(actorData)) return;

        const harleddegenskaper = actorData.system?.harleddegenskaper;
        const kroppsbyggnad = harleddegenskaper?.kroppsbyggnad;
        if (!harleddegenskaper || !kroppsbyggnad) return;

        if (!kroppsbyggnad.totalt || typeof kroppsbyggnad.totalt !== "object") {
            kroppsbyggnad.totalt = await CalculateHelper.BeraknaTotaltVarde(kroppsbyggnad);
        }

        let kroppsbyggnadAttributvarde = harleddT6AttributTillAttributVarde(kroppsbyggnad.totalt);
        if (kroppsbyggnadAttributvarde < 4) {
            kroppsbyggnadAttributvarde = 4;
        }

        const kroppsbyggnadTabell = getGrundrustningOchGrundskadaFromKroppsbyggnadVarde(kroppsbyggnadAttributvarde);
        const grundrustning = harleddegenskaper.grundrustning;
        const grundskada = harleddegenskaper.grundskada;

        if (grundrustning) {
            const rustningFranTabell = kroppsbyggnadTabell.rustning;
            if (!grundrustning.bonuslista?.length) {
                grundrustning.varde = rustningFranTabell;
                grundrustning.totalt = rustningFranTabell;
            } else {
                grundrustning.varde = rustningFranTabell;
                grundrustning.totalt = await CalculateHelper.BeraknaTotaltVarde(grundrustning);
            }
        }

        if (!grundskada?.grund) return;

        grundskada.bonuslista = grundskada.bonuslista ?? [];
        grundskada.grund.tvarde = kroppsbyggnadTabell.grundskada.tvarde;
        grundskada.grund.bonus = kroppsbyggnadTabell.grundskada.bonus;

        if (grundskada.modifierare) {
            grundskada.grund.tvarde += parseInt(grundskada.modifierare.tvarde ?? 0, 10) || 0;
            grundskada.grund.bonus += parseInt(grundskada.modifierare.bonus ?? 0, 10) || 0;
        }

        const grundskadaTotalt = await CalculateHelper.BeraknaTotaltVarde(grundskada);
        if (grundskadaTotalt && typeof grundskadaTotalt === "object") {
            grundskada.totalt = grundskadaTotalt;
        }
    }

    /**
     * Efter ändring av härledda attribut — uppdaterar beroende värden per version.
     * @param {object} actorData
     */
    static async efterHarleddAttributAndring(actorData) {
        if (CalculateHelper.isEon5Actor(actorData)) {
            await CalculateHelper.beraknaGrundrustningOchGrundskadaEon5(actorData);
        } else if (actorData.type?.toLowerCase().replace(/\s/g, "") === "rollperson") {
            await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
        }
    }

    /**
     * Ordinarie Eon: +4 bonus → +1 tärning (obegränsat antal tärningar).
     */
    static _normaliseraTarningBonusOrdinarie(totalTarning, totalBonus) {
        let tarning = totalTarning;
        let bonus = totalBonus;
        while (bonus > 3) {
            tarning += 1;
            bonus -= 4;
        }
        while (bonus < -1 && tarning > 0) {
            tarning -= 1;
            bonus += 4;
        }
        return { tvarde: tarning, bonus };
    }

    /**
     * Varelse Eon 4 grundegenskap: max 6 tärningar; överskjutande tärningar blir +4 bonus vardera.
     * Bonus → tärning bara medan tärningar < 6.
     */
    static _normaliseraVarelseEon4Grundegenskap(totalTarning, totalBonus) {
        let tarning = totalTarning;
        let bonus = totalBonus;
        while (bonus > 3 && tarning < 6) {
            tarning += 1;
            bonus -= 4;
        }
        while (bonus < -1 && tarning > 0) {
            tarning -= 1;
            bonus += 4;
        }
        while (tarning > 6) {
            tarning -= 1;
            bonus += 4;
        }
        return { tvarde: tarning, bonus };
    }

    /**
     * @param {object} attribut
     * @param {boolean|object} [options] - Om true: samma som { varelseEon4Grundegenskap: true } (bakåtkompat)
     * @param {boolean} [options.varelseEon4Grundegenskap]
     */
    static async BeraknaTotaltVarde(attribut, options = false) {
        if (attribut == undefined) {
            console.error("'attribut' empty in BeraknaTotaltVarde");
            return false;
        }

        const varelseEon4Grundegenskap =
            options === true ||
            (typeof options === "object" && options !== null && options.varelseEon4Grundegenskap === true);

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
        const bonuslista = attribut.bonuslista ?? [];

        for (const bonus of bonuslista) {
            totalTarning += Math.floor(parseInt(bonus.tvarde || 0));
            totalBonus += Math.floor(parseInt(bonus.bonus || 0));
        }

        let result;
        if (varelseEon4Grundegenskap) {
            result = CalculateHelper._normaliseraVarelseEon4Grundegenskap(totalTarning, totalBonus);
        } else {
            result = CalculateHelper._normaliseraTarningBonusOrdinarie(totalTarning, totalBonus);
        }

        totalTarning = result.tvarde;
        totalBonus = result.bonus;

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
        };
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

        const burnaRustningar = actorData.items.filter(
            (item) => item.type === "Rustning" && item.system.installningar.buren
        );
        let rustningBelastning = 0;

        for (const rustning of burnaRustningar) {
            rustningBelastning += rustning.system.belastning;
        }

        const grundUtmattningRustning = this._beraknaRustningBelastning(rustningBelastning, actorData.system.installningar.eon);

        actorData.system.skada.utmattning.grund = actorData.system.skada.infektion + grundUtmattningRustning;

        if (!Number.isInteger(actorData.system.skada.utmattning.varde)) {
            actorData.system.skada.utmattning.varde = parseInt(actorData.system.skada.utmattning.grund);
        }
        if (actorData.system.skada.utmattning.varde < actorData.system.skada.utmattning.grund) {
            actorData.system.skada.utmattning.varde = parseInt(actorData.system.skada.utmattning.grund);
        }

        await CalculateHelper.beraknaGrundrustningOchGrundskadaEon5(actorData);
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

    /**
     * Beräknar tillfällig rollkontext (smärta, sår, belastning) för folkslagsaktörer.
     * @param {Actor} actor
     */
    static byggRollBerakning(actor) {
        const skada = actor.system?.skada ?? {};
        const sar = skada.sar ?? {};
        let antalsar = 0;

        for (const kroppsdel of Object.keys(sar)) {
            antalsar += Number(sar[kroppsdel] ?? 0);
        }

        let rustningBelastning = 0;
        let vapenVikt = 0;
        let utrustningVikt = 0;

        for (const item of actor.items ?? []) {
            if (item.type === "Rustning" && item.system?.installningar?.buren) {
                rustningBelastning += Number(item.system?.belastning ?? 0);
            }
            if (CONFIG.EON?.settings?.weightRules && item.system?.installningar?.buren) {
                if (item.type === "Närstridsvapen" || item.type === "Avståndsvapen" || item.type === "Sköld") {
                    vapenVikt += Number(item.system?.vikt ?? 0);
                }
                if (item.type === "Utrustning" || item.type === "Valuta") {
                    utrustningVikt += Number(item.system?.vikt ?? 0) * Number(item.system?.antal ?? 1);
                }
            }
        }

        const eon = actor.system?.installningar?.eon ?? "eon5";
        const belastning = {
            vapen: Math.round(vapenVikt),
            utrustning: Math.round(utrustningVikt),
            rustning: rustningBelastning,
            riddjur: 0
        };

        const totalVarde = CONFIG.EON?.settings?.weightRules
            ? belastning.vapen + belastning.rustning + belastning.utrustning
            : belastning.rustning;

        belastning.totaltavdrag = CalculateHelper.BeraknaBelastningAvdrag(totalVarde, eon);

        return {
            utmattning: { perrunda: Number(skada.blodning ?? 0) },
            svarighet: {
                smarta: Number(skada.smarta ?? 0),
                antalsar
            },
            belastning
        };
    }

    /**
     * @param {{ tvarde?: number, bonus?: number }|null|undefined} ob
     * @returns {{ tvarde: number, bonus: number }}
     */
    static normaliseraOb(ob) {
        const antalTarningar = Number.parseInt(ob?.tvarde ?? 0, 10) || 0;
        const bonus = Number.parseInt(ob?.bonus ?? 0, 10) || 0;
        return CalculateHelper._normaliseraTarningBonusOrdinarie(antalTarningar, bonus);
    }

    /**
     * Jämförbar rang för tärnings-Ob (högre tärning, sedan högre bonus).
     * @param {{ tvarde?: number, bonus?: number }} ob
     * @returns {number}
     */
    static tarningObRank(ob) {
        const normaliserat = CalculateHelper.normaliseraOb(ob);
        return normaliserat.tvarde * 4 + normaliserat.bonus;
    }

    /**
     * Returnerar det högre av två Ob-värden.
     * @param {{ tvarde?: number, bonus?: number }|null|undefined} a
     * @param {{ tvarde?: number, bonus?: number }|null|undefined} b
     * @returns {{ tvarde: number, bonus: number }}
     */
    static hogreTarningOb(a, b) {
        const normaliseratA = CalculateHelper.normaliseraOb(a);
        const normaliseratB = CalculateHelper.normaliseraOb(b);
        return CalculateHelper.tarningObRank(normaliseratA) >= CalculateHelper.tarningObRank(normaliseratB)
            ? normaliseratA
            : normaliseratB;
    }

    /** @param {Actor} actor */
    static motstandareAnfallForsvar(actor) {
        return CalculateHelper.normaliseraOb(actor?.system?.strid?.anfallForsvar);
    }

    /**
     * Motståndare: träffa med vapen = max(stridsfärdighet, anfall & försvar).
     * @param {Actor} actor
     * @param {{ tvarde?: number, bonus?: number }|null|undefined} skillVarde
     * @returns {{ varde: { tvarde: number, bonus: number }, useAnfallForsvar: boolean }}
     */
    static resolveMotstandareStridTraffa(actor, skillVarde) {
        const anfallForsvar = CalculateHelper.motstandareAnfallForsvar(actor);
        if (!skillVarde) {
            return { varde: anfallForsvar, useAnfallForsvar: true };
        }
        const normaliseradFardighet = CalculateHelper.normaliseraOb(skillVarde);
        if (CalculateHelper.tarningObRank(normaliseradFardighet) > CalculateHelper.tarningObRank(anfallForsvar)) {
            return { varde: normaliseradFardighet, useAnfallForsvar: false };
        }
        return { varde: anfallForsvar, useAnfallForsvar: true };
    }

    /**
     * Motståndare: undvika = max(undvika-färdighet, anfall & försvar).
     * @param {Actor} actor
     * @param {{ tvarde?: number, bonus?: number }|null|undefined} skillVarde
     * @returns {{ tvarde: number, bonus: number }}
     */
    static resolveMotstandareUndvika(actor, skillVarde) {
        const anfallForsvar = CalculateHelper.motstandareAnfallForsvar(actor);
        if (!skillVarde) return anfallForsvar;
        return CalculateHelper.hogreTarningOb(skillVarde, anfallForsvar);
    }

    /**
     * Grundskada för vapenrullning — använder totalt om det finns, annars beräknar från grund/modifierare.
     * @param {Actor|object} actorOrData
     * @param {{ tvarde?: number, bonus?: number }|null|undefined} [cachedTotalt]
     * @returns {{ tvarde: number, bonus: number }}
     */
    static grundskadaTotaltForRoll(actorOrData, cachedTotalt = null) {
        if (cachedTotalt?.tvarde !== undefined) {
            return CalculateHelper.normaliseraOb(cachedTotalt);
        }

        const grundskada = actorOrData?.system?.harleddegenskaper?.grundskada;
        if (!grundskada) {
            return { tvarde: 0, bonus: 0 };
        }

        if (grundskada.totalt && typeof grundskada.totalt === "object" && grundskada.totalt.tvarde !== undefined) {
            return CalculateHelper.normaliseraOb(grundskada.totalt);
        }

        if (!grundskada.grund) {
            return { tvarde: 0, bonus: 0 };
        }

        let totalTarning = Number.parseInt(grundskada.grund.tvarde ?? 0, 10) || 0;
        let totalBonus = Number.parseInt(grundskada.grund.bonus ?? 0, 10) || 0;

        if (grundskada.modifierare) {
            totalTarning += Number.parseInt(grundskada.modifierare.tvarde ?? 0, 10) || 0;
            totalBonus += Number.parseInt(grundskada.modifierare.bonus ?? 0, 10) || 0;
        }

        for (const bonus of grundskada.bonuslista ?? []) {
            totalTarning += Number.parseInt(bonus.tvarde ?? 0, 10) || 0;
            totalBonus += Number.parseInt(bonus.bonus ?? 0, 10) || 0;
        }

        return CalculateHelper._normaliseraTarningBonusOrdinarie(totalTarning, totalBonus);
    }
}