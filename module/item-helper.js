import CreateHelper from "create-helper.js";

export class ItemHelper {

    get sprakItem() {
        return {
            name: "Nytt språk",
            type: "Språk",                
            system: {
                installningar: {
                    skapad: true,
                    version: version,
                    kantabort: true
                }
            
            }
        }
    }

    get fardighetItem() {
        return {
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
        }
    } 

    static async createItem(actor, type, version) {
        let found = false;

		let itemData;        

        if (type == "färdighet") {
            const skilltype = header.dataset.subtype;
            found = true;

            if (skilltype == "sprak") {
                itemData = this.sprakItem;
            }
            else {
                itemData = this.fardighetItem;
            }			
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
            const actorData = foundry.utils.duplicate(this.actor);
            await CreateHelper.SkapaKaraktarsdrag(actorData);
            await this.actor.update(actorData);
            return;
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
                    const currency = Object.values(this.datavaluta.valuta)
                        .find(currency => currency.namn === currencyName);
                    if (currency) return currency;
                }
            
                const firstCurrency = Object.values(this.datavaluta.valuta)[0];
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
            await this.actor.createEmbeddedDocuments("Item", [itemData]);
            return true;
        }

        ui.notifications.error("Typen som skall skapas saknar funktion");

        return false;
    }
}