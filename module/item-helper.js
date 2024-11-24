import CreateHelper from "./create-helper.js";

export default class ItemHelper {

    /**
        * Generell funktion för att skapa ett nytt item.
        * @param actor
        * @param type
        * @param version
        * @return Det skapade itemid om det lyckas, false om misslyckas.
    */
    static async CreateItem(actor, event) {
        let found = false;
        const header = event.currentTarget;
		const type = header.dataset.type;
        const version = game.data.system.version;
		let itemData;        

        if (type == "färdighet") {
            const skilltype = header.dataset.subtype;
            found = true;

            if (skilltype == "sprak") {
                itemData = {
                    name: "Nytt språk",
                    type: "Språk",                
                    system: {
                        installningar: {
                            skapad: true,
                            version: version,
                            kantabort: true
                        }
                    }
                };
            }
            else {
                itemData = {
                    name: "Ny färdighet",
                    type: "Färdighet",                
                    system: {
                        installningar: {
                            skapad: true,
                            version: version,
                            kantabort: true
                        },
                        grupp: skilltype
                    }
                };
            }			
		}

        if (type == "egenskap") {
            found = true;

            itemData = {
                name: "Ny egenskap",
                type: "Egenskap",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version,
                        kantabort: true
                    }
                }
            };
        }

        if (type == "mysterie") {
            found = true;

            itemData = {
                name: "Nytt mysterie",
                type: "Mysterie",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    magnitud: 0
                }
            };
        }

        if (type == "avvisning") {
            found = true;

            itemData = {
                name: "Ny avvisning",
                type: "Avvisning",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    magnitud: 0
                }
            };
        }

        if (type == "besvärjelse") {
            found = true;

            itemData = {
                name: "Ny besvärjelse",
                type: "Besvärjelse",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    }
                }
            };
        }

        if (type == "karaktärsdrag") {
            const actorData = foundry.utils.duplicate(actor);
            await CreateHelper.SkapaKaraktarsdrag(actorData);
            await actor.update(actorData);
            return true;
        }

		if (type == "närstridsvapen") {
            found = true;

			itemData = {
                name: "Nytt närstridsvapen",
                type: "Närstridsvapen",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "utrustning"                    
                }
            };
		}

        if (type == "avståndsvapen") {
            found = true;

			itemData = {
                name: "Nytt avståndsvapen",
                type: "Avståndsvapen",
                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "utrustning"
                }
            };
		}        

        if (type == "sköld") {
            found = true;

			itemData = {
                name: "Ny sköld",
                type: "Sköld",
                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "utrustning",
                    grupp: "skold"
                }
            };
		}

        if (type == "rustning") {
            found = true;
            const kroppsdelar = await CreateHelper.SkapaKroppsdelar(CONFIG.EON, game.data.system.version);

			itemData = {
                name: "Ny rustning",
                type: "Rustning",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "utrustning",
                    kroppsdel: kroppsdelar
                }
            };
		}

        if (type == "utrustning") {
            found = true;

			itemData = {
                name: "Nytt föremål",
                type: "Utrustning",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "utrustning"
                }
            };
		}

        if (type == "valuta") {
            found = true;

            const getCurrencyData = (currencyName) => {
                if (currencyName) {
                    const currency = Object.values(CONFIG.EON.datavaluta.valuta)
                        .find(currency => currency.namn === currencyName);
                    if (currency) return currency;
                }
            
                const firstCurrency = Object.values(CONFIG.EON.datavaluta.valuta)[0];
                return firstCurrency;
            };

            const currencyData = getCurrencyData('Denar');

            itemData = {
                name: currencyData.namn,
                type: "Valuta",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version,
                        buren: false
                    },

                    ursprung: currencyData.ursprung,
                    metall: currencyData.metall,
                    silver_varde: currencyData.silver_varde,
                    vikt: currencyData.vikt,
                    antal: 0
                }
            };
		}

        if (type == "kongelat") {
            found = true;

            let magnitud = {
                namn: "magnitud",
                label: "Magnitud",
                varde: 0
            }

            const properties = [];
            properties.push(magnitud);

			itemData = {
                name: "Kongelat",
                type: "Utrustning",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version,
                        behallare: false
                    },
                    typ: "kongelat",
                    egenskaper: properties
                }
            };
		}        

        if (type == "skada") {
            found = true;

			itemData = {
                name: "Ny skada",
                type: "Skada",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "skada"
                }
            };
		}

        if (type == "fältstörning") {
            found = true;

			itemData = {
                name: "Fältstörning",
                type: "Skada",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version
                    },
                    typ: "faltstorning"
                }
            };
		}

        if (found) {
            let item = await actor.createEmbeddedDocuments("Item", [itemData]);
            return  item[0]._id;
        }

        return false;
    }

    // Användes för att skapa upp vapenegenskaperna i kompendiet
    static async CreateWeaponProperty() {
        const version = game.data.system.version;

        for (const egenskap in game.EON.egenskaper) {
            let itemData = {
                name: game.EON.egenskaper[egenskap].namn,
                type: "Egenskap",                
                system: {
                    id: egenskap,
                    referens: "sid 241",
                    beskrivning: game.EON.egenskaper[egenskap].beskrivning,
                    installningar: {
                        skapad: true,
                        version: "3.1.0",
                        kantabort: true,
                        vapen: true,
                        harniva: game.EON.egenskaper[egenskap].harniva
                    }                    
                }
            };

            Item.createDocuments([itemData], {pack: "eon-rpg.vapenegenskaper"});
        }
    }

    static async CreateCloseWeapon() {
        for (const grupp in CONFIG.EON.vapengrupper) {
            for (const vapenmall in game.EON.narstridsvapen[grupp]) {
                const vapen = game.EON.narstridsvapen[grupp][vapenmall]
                let image = "icons/svg/item-bag.svg";

                if (grupp == "slagsmal") image = CONFIG.EON.ikoner.foremal_hand;
                if (grupp == "dolk") image = CONFIG.EON.ikoner.foremal_dolk;
                if (grupp == "kedjevapen") image = CONFIG.EON.ikoner.foremal_kedjevapen;
                if (grupp == "klubba") image = CONFIG.EON.ikoner.foremal_klubba;
                if (grupp == "spjut") image = CONFIG.EON.ikoner.foremal_spjut;
                if (grupp == "stav") image = CONFIG.EON.ikoner.foremal_stav;
                if (grupp == "svard") image = CONFIG.EON.ikoner.foremal_svard;
                if (grupp == "yxa") image = CONFIG.EON.ikoner.foremal_yxa;

                let itemData = {
                    img: image,
                    name: vapen.namn,
                    type: "Närstridsvapen",                
                    system: {
                        installningar: {
                            skapad: true,
                            version: "3.1.0"
                        },
                        typ: "utrustning",
                        mall: vapenmall,
                        grupp: vapen.grupp,
                        enhand: vapen.enhand,
                        tvahand: vapen.tvahand,
                        hugg: vapen.hugg,
                        stick: vapen.stick,
                        kross: vapen.kross,
                        langd: vapen.langd,
                        vikt: vapen.vikt,
                        pris: vapen.pris,
                        egenskaper: await this.GetWeaponProperty(vapen)                  
                    }                    
                };

                Item.createDocuments([itemData], {pack: "eon-rpg.narstridsvapen"});
            }
        }
    }

    static async CreateRangeWeapon() {
        for (const grupp in CONFIG.EON.vapengrupper) {
            for (const vapenmall in game.EON.avstandsvapen[grupp]) {
                const vapen = game.EON.avstandsvapen[grupp][vapenmall]
                let image = "icons/svg/item-bag.svg";

                if (grupp == "armborst") image = CONFIG.EON.ikoner.foremal_armborst;
                if (grupp == "bage") image = CONFIG.EON.ikoner.foremal_bage;
                if (grupp == "kastvapen") image = CONFIG.EON.ikoner.foremal_kastvapen;

                let itemData = {
                    img: image,
                    name: vapen.namn,
                    type: "Avståndsvapen",                
                    system: {
                        installningar: {
                            skapad: true,
                            version: "3.1.0"
                        },
                        typ: "utrustning",
                        mall: vapenmall,
                        grupp: vapen.grupp,
                        enhand: vapen.enhand,
                        tvahand: vapen.tvahand,
                        
                        skada: vapen.skada,
                        skadetyp: vapen.skadetyp,
                        rackvidd: vapen.rackvidd,

                        langd: vapen.langd,
                        vikt: vapen.vikt,
                        pris: vapen.pris,
                        egenskaper: await this.GetWeaponProperty(vapen)                  
                    }                    
                };

                Item.createDocuments([itemData], {pack: "eon-rpg.avstandsvapen"});
            }
        }
    }

    static async CreateShield() {
        for (const grupp in CONFIG.EON.vapengrupper) {
            for (const vapenmall in game.EON.forsvar[grupp]) {
                const vapen = game.EON.forsvar[grupp][vapenmall]
                let image = "icons/svg/item-bag.svg";

                if (grupp == "skold") image = CONFIG.EON.ikoner.foremal_skold;

                let itemData = {
                    img: image,
                    name: vapen.namn,
                    type: "Sköld",                
                    system: {
                        installningar: {
                            skapad: true,
                            version: "3.1.0"
                        },
                        typ: "utrustning",
                        mall: vapenmall,
                        grupp: vapen.grupp,
                        enhand: vapen.enhand,
                        tvahand: vapen.tvahand,

                        narstrid: vapen.narstrid,
                        avstand: vapen.avstand,
                        skydd: vapen.skydd,
                        skada: vapen.skada,
                        skadetyp: vapen.skadetyp,

                        langd: vapen.langd,
                        vikt: vapen.vikt,
                        pris: vapen.pris,
                        egenskaper: await this.GetWeaponProperty(vapen)                  
                    }                    
                };

                Item.createDocuments([itemData], {pack: "eon-rpg.skoldar"});
            }
        }
    }

    static async GetWeaponProperty(vapen) {
        const pack = game.packs.get("eon-rpg.vapenegenskaper");
        const egenskaper = await pack.getDocuments({type: "Egenskap"});
        let nylista = [];
        
        for (const vapenegenskap of vapen.egenskaper) {
            const i = egenskaper.find(e => e.system.id === vapenegenskap.namn);

            let egenskap = {
                uuid: i.uuid,
                _id: i._id,
                label: i.name, 
                namn: i.system.id, 
                varde: vapenegenskap.varde, 
                beskrivning: i.system.beskrivning,
                harniva: i.system.installningar.harniva
            };

            nylista.push(egenskap);
        }

        return nylista;
    }

    static async GetCreatureCombatTurn(id) {
        const pack = game.packs.get("eon-rpg.vandningar");
        const vandningar = await pack.getDocuments();

        if (id == undefined) {
            vandningar.sort((a, b) => a.name.localeCompare(b.name));
            return vandningar;
        }        

        return vandningar.find(e => e._id === id);
    }

    static async GetWeapon(vapentyp, id) {
        let kompendie = "";

        if (vapentyp == "narstridsvapen") {
            kompendie = "eon-rpg.narstridsvapen";
        }
        else if (vapentyp == "avstandsvapen") {
            kompendie = "eon-rpg.avstandsvapen";
        }
        else {
            return [];
        }
        const pack = game.packs.get(kompendie);
        const vapen = await pack.getDocuments();

        if (id == undefined) {
            vapen.sort((a, b) => a.name.localeCompare(b.name));
            return vapen;
        }        

        return vandningar.find(e => e._id === id);
    }
}