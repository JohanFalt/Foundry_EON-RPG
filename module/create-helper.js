export default class CreateHelper {
    static async SkapaFardigheter(actor, config, version) {

        for (const grupp in config.fardighetgrupper) {
            for (const fardighet in game.EON.fardigheter[grupp]) {
                let itemData = await this._SkapaFardighetItem(grupp, game.EON.fardigheter[grupp][fardighet], fardighet, version);
                await actor.createEmbeddedDocuments("Item", [itemData]);
            }
        }       
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

    static async SkapaNarstridsvapen(actor, config, vapengrupp, vapennamn, version, buren = false) {

        for (const grupp in config.vapengrupper) {
            if (grupp == vapengrupp) {
                for (const vapen in game.EON.narstridsvapen[grupp]) {
                    if (vapen == vapennamn) {
                        let itemData = await this._SkapaNarstridsvapenItem(game.EON.narstridsvapen[grupp][vapen], vapen, version, buren);
                        await actor.createEmbeddedDocuments("Item", [itemData]);
                        break;
                    }
                }
                break;
            }
        }       
    }

    static async _SkapaFardighetItem(grupp, fardighet, nyckel, worldVersion) {

        let itemData = {
            name: nyckel,
            type: "Färdighet",
            
            data: {
                installningar: {
                    skapad: true,
                    version: worldVersion
                },
                namn: fardighet.namn,
                attribut: fardighet.attribut,
                referens: fardighet.referens,
                grupp: grupp,
                varde: {
                    tvarde: parseInt(fardighet.grund.tvarde),
                    bonus: parseInt(fardighet.grund.bonus)
                }
            }
        };

        return itemData;
    }

    static async _SkapaNarstridsvapenItem(vapen, nyckel, version, buren = false) {

        let itemData = {
            name: vapen.namn,
            type: "Närstridsvapen",
            
            data: {
                installningar: {
                    skapad: true,
                    version: version,
                    buren: buren
                },
                mall: nyckel,
                enhand: vapen.enhand,
                tvahand: vapen.tvahand,
                grupp: vapen.grupp,
                referens: vapen.referens,
                hugg: vapen.hugg,
                kross: vapen.kross,
                stick: vapen.stick,
                langd: vapen.langd,
                vikt: vapen.vikt,
                egenskaper: vapen.egenskaper                    
            }
        };

        return itemData;
    }

    

    /* static async _SkapaKroppsdelItem(kroppsdel, omrade, version) {

        let itemData = {
            name: kroppsdel,
            type: "Rustning",
            
            data: {
                installningar: {
                    skapad: true,
                    version: version
                },
                kroppsdel: omrade
            }
        };

        return itemData;
    } */
}