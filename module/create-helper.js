export default class CreateHelper {
    static async SkapaFardigheter(actor, config, version) {

        if (actor.type.toLowerCase().replace(" ", "") == "rollperson") {
            for (const grupp in config.fardighetgrupper) {
                for (const fardighet in game.EON.fardigheter[grupp]) {
                    let itemData = await this.SkapaFardighetItem(actor, grupp, game.EON.fardigheter[grupp][fardighet], fardighet, version);
                    await actor.createEmbeddedDocuments("Item", [itemData]);
                }
            }       
        }   
        else if (actor.type.toLowerCase().replace(" ", "") == "rollperson5") {
            for (const grupp in config.fardighetgrupper) {
                for (const fardighet in game.EON.fardigheter5[grupp]) {
                    let itemData = await this.SkapaFardighetItem(actor, grupp, game.EON.fardigheter5[grupp][fardighet], fardighet, version);
                    await actor.createEmbeddedDocuments("Item", [itemData]);
                }
            }       
        } 
        else {
            let itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['vildmark']['genomsoka'], 'genomsoka', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['vildmark']['jakt'], 'jakt', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['vildmark']['orientering'], 'orientering', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['rorelse']['gomma'], 'gomma', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['rorelse']['hoppa'], 'hoppa', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['rorelse']['klattra'], 'klattra', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['rorelse']['simma'], 'simma', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['rorelse']['smyga'], 'smyga', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['vildmark']['spara'], 'spara', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);

            itemData = await this.SkapaFardighetItem(actor, 'allman', game.EON.fardigheter['vildmark']['speja'], 'speja', version, false, true);
            await actor.createEmbeddedDocuments("Item", [itemData]);
        }     
    }

    static async SkapaVandningar() {
        let vandningar = [];
        let vandning = {};

        vandning = {
            skada: "1-4",
            utmattning: "0",
            vandning: false,
            bonus: "0"
        };    
        vandningar.push(vandning);  

        for (let i = 1; i < 9; i++) {
            let min = i * 5;
            let max = min + 4;

            let value = `${min}-${max}`;

            vandning = {
                skada: value,
                utmattning: "0",
                vandning: false,
                bonus: "0"
            };
            vandningar.push(vandning);
        }

        vandning = {
            skada: "(+5)",
            utmattning: "(0)",
            vandning: false,
            bonus: "0"
        };    
        vandningar.push(vandning);

        return vandningar;     
    }

    static async SkapaKaraktarsdrag(actorData) {
        let drag;

        if (actorData.system.installningar.eon === "eon4") {
            drag = {
                namn: "",
                niva1: {
                    vald: 0,
                    text: ""
                },
                niva2: {
                    vald: 0,
                    text: ""
                },
                niva3: {
                    vald: 0,
                    text: ""
                },
                last: 0,
                svaghet: 0,
                tvivel: 0
            };
        }
        else if (actorData.system.installningar.eon === "eon5") {
            drag = {
                namn: "",
                niva1: {
                    vald: 0,
                    text: ""
                },
                niva2: {
                    vald: 0,
                    text: ""
                },
                niva3: {
                    vald: 0,
                    text: ""
                },
                last: 0,
                svaghet: 0,
                tvivel: 0,
                storning: 0
            };
        }        

        actorData.system.egenskap.karaktärsdrag.push(drag);
    }

    static async SkapaKroppsdelar(config, version) {
        let bok = "grund";
        let kroppsdelar = [];

        if (config.settings.bookCombat) {
            bok = "strid";
        }

        for (const kroppsdel in config.kroppsdelar[bok]) {
            let del = {
                namn: config.kroppsdelar[bok][kroppsdel],
                kroppsdel: kroppsdel,
                version: version,
                material: "",                
                stick: 0,
                kross: 0,
                hugg: 0,
                belastning: 0
            };

            kroppsdelar.push(del);
        }  

        return kroppsdelar;
    }

    static async SkapaNarstridsvapen(actor, vapennamn, vapenlista, version, buren = false) {
        for (const vapen in vapenlista) {
            if (vapenlista[vapen].system.mall == vapennamn) {
                const itemData = foundry.utils.duplicate(vapenlista[vapen]);
                await actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            }
        }
    }

    static async SkapaFardighetItem(actor, grupp, fardighet, nyckel, worldVersion, baschans = true, tabort = false) {
        let tvgrund = 0;
        let bonusgrund = 0;
        let attribut = "";

        if (baschans)
        {
            tvgrund = parseInt(fardighet.grund.tvarde);
            bonusgrund = fardighet.grund.bonus;
        }

        if (actor.system.installningar.eon === "eon4") {
            attribut = fardighet.attribut;
        }

        let itemData = {
            name: fardighet.namn,
            type: "Färdighet",
            
            system: {
                installningar: {
                    skapad: true,
                    eon: actor.system.installningar.eon,
                    version: worldVersion,
                    kantabort: tabort
                },
                attribut: attribut,
                referens: fardighet.referens,
                id: nyckel,
                grupp: grupp,
                varde: {
                    tvarde: tvgrund,
                    bonus: bonusgrund
                }
            }
        };

        return itemData;
    }

    // static async _SkapaNarstridsvapenItem(vapen, nyckel, version, buren = false) {

    //     let itemData = {
    //         name: vapen.namn,
    //         type: "Närstridsvapen",
            
    //         system: {
    //             installningar: {
    //                 skapad: true,
    //                 version: version,
    //                 buren: buren
    //             },
    //             mall: nyckel,
    //             enhand: vapen.enhand,
    //             tvahand: vapen.tvahand,
    //             grupp: vapen.grupp,
    //             referens: vapen.referens,
    //             hugg: vapen.hugg,
    //             kross: vapen.kross,
    //             stick: vapen.stick,
    //             langd: vapen.langd,
    //             vikt: vapen.vikt,
    //             egenskaper: vapen.egenskaper                    
    //         }
    //     };

    //     return itemData;
    // }
}