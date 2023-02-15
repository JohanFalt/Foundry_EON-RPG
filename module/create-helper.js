export default class CreateHelper {
    static async SkapaFardigheter(actor, config, version) {

        for (const grupp in config.fardighetgrupper) {
            for (const fardighet in game.EON.fardigheter[grupp]) {
                let itemData = await this._SkapaFardighetItem(grupp, game.EON.fardigheter[grupp][fardighet], fardighet, version);
                await actor.createEmbeddedDocuments("Item", [itemData]);
            }
        }       
    }

    static async SkapaNarstridsvapen(actor, config, vapengrupp, vapennamn, version) {

        for (const grupp in config.narstridsvapen) {
            if (grupp == vapengrupp) {
                for (const vapen in config.narstridsvapen[grupp]) {
                    if (vapen == vapennamn) {
                        let itemData = await this._SkapaNarstridsvapenItem(game.EON.narstridsvapen[grupp][vapen], version);
                        await actor.createEmbeddedDocuments("Item", [itemData]);
                        break;
                    }
                }
                break;
            }
        }       
    }

    static async SkapaForsvarsvapen(actor, config, vapengrupp, vapennamn, version) {

        for (const grupp in config.forsvar) {
            if (grupp == vapengrupp) {
                for (const vapen in config.forsvar[grupp]) {
                    if (vapen == vapennamn) {
                        let itemData = await this._SkapaForsvarsvapenItem(game.EON.forsvar[grupp][vapen], version);
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

    static async _SkapaNarstridsvapenItem(vapen, version) {

        let itemData = {
            name: vapen.namn,
            type: "Närsstridsvapen",
            
            data: {
                installningar: {
                    skapad: true,
                    version: version
                },
                enhand: vapen.enhand,
                tvahand: vapen.tvahand,
                attribut: vapen.attribut,
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

    static async _SkapaForsvarsvapenItem(vapen, version) {

        let itemData = {
            name: vapen.namn,
            type: "Försvar",
            
            data: {
                installningar: {
                    skapad: true,
                    version: version
                },
                enhand: vapen.enhand,
                tvahand: vapen.tvahand,
                attribut: vapen.attribut,
                narstrid: vapen.narstrid,
                avstand: vapen.avstand,
                langd: vapen.langd,
                vikt: vapen.vikt,
                egenskaper: vapen.egenskaper                    
            }
        };

        return itemData;
    }
}