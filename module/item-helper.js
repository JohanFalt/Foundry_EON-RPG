import { eon } from "./config.js";
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
                            eon: actor.system.installningar.eon,
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
                            eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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
                        eon: actor.system.installningar.eon,
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

    static async AddAncestryProperty(actor, ancenstry) {
        const pack = game.packs.get("eon-rpg.folkslagegenskaper");
        const egenskaper = await pack.getDocuments({type: "Egenskap"});

        for (const egenskap of ancenstry.system.egenskaper) {
            let i = egenskaper.find(e => e.uuid === egenskap.uuid);       
            
            if (i === undefined) {
                // finns den i världen?
                i = game.items.find(e => e.uuid === egenskap.uuid);

                if (i === undefined) {
                    continue;
                }
            }

            const itemData = {
                name: i.name,
                type: "Egenskap",                
                system: {
                    installningar: {
                        skapad: true,
                        eon: actor.system.installningar.eon,
                        version: i.system.installningar.version,
                        kantabort: true,
                        folkslag: true,
                        harniva: i.system.installningar.harniva
                    },
                    niva: i.system.niva,
                    beskrivning: i.system.beskrivning
                }
            };            

            await actor.createEmbeddedDocuments("Item", [itemData]);
        }
    }

    static async AddAncestryLanguage(actor, ancenstry) {
        const pack = game.packs.get("eon-rpg.sprak");
        const sprak = await pack.getDocuments({type: "Språk"});

        for (const s of ancenstry.system.sprak) {
            let i = sprak.find(e => e.uuid === s.uuid);       
            
            if (i === undefined) {
                // finns den i världen?
                i = game.items.find(e => e.uuid === s.uuid);

                if (i === undefined) {
                    continue;
                }
            }

            const itemData = {
                name: i.name,
                type: "Språk",                
                system: {
                    installningar: {
                        skapad: true,
                        eon: actor.system.installningar.eon,
                        version: i.system.installningar.version,
                        kantabort: true,
                    }
                }
            };            

            await actor.createEmbeddedDocuments("Item", [itemData]);
        }
    }

    

    // Användes för att skapa upp vapenegenskaperna i kompendiet
    // Lägg till ItemHelper.CreateWeaponProperty(); i Ready
    static async CreateWeaponProperty() {
        const itemlist = game.EON.egenskaper5;
        const eonversion = "eon5";
        const pack = "eon-rpg.vapenegenskaper5";

        try {
            const itemDataArray = Object.keys(itemlist).map(egenskap => ({
                name: itemlist[egenskap].namn,
                type: "Egenskap",                
                system: {
                    id: egenskap,
                    referens: "sid 97",
                    beskrivning: itemlist[egenskap].beskrivning,
                    installningar: {
                        skapad: true,
                        version: "5.0.0",
                        kantabort: true,
                        vapen: true,
                        eon: eonversion,
                        harniva: itemlist[egenskap].harniva
                    }                    
                }
            }));

            const created = await Item.createDocuments(itemDataArray, {pack: pack});
            console.log(`EON | Lagt till ${created.length} vapenegenskaper i ${pack}`);
        } catch (error) {
            console.error("EON | Fel vid skapande av vapenegenskaper:", error);
            throw error;
        }
    }

    // Användes för att skapa upp närstridsvapnen i kompendiet
    // Lägg till ItemHelper.CreateCloseWeapon(); i Ready
    static async CreateCloseWeapon() {
        const itemlist = game.EON.narstridsvapen5;
        const eonversion = "eon5";
        const pack = "eon-rpg.narstridsvapen5";
        
        // Lookup-map för vapenikoner
        const vapenIkoner = {
            "slagsmal": CONFIG.EON.ikoner.foremal_hand,
            "dolk": CONFIG.EON.ikoner.foremal_dolk,
            "kedjevapen": CONFIG.EON.ikoner.foremal_kedjevapen,
            "klubba": CONFIG.EON.ikoner.foremal_klubba,
            "spjut": CONFIG.EON.ikoner.foremal_spjut,
            "stav": CONFIG.EON.ikoner.foremal_stav,
            "svard": CONFIG.EON.ikoner.foremal_svard,
            "yxa": CONFIG.EON.ikoner.foremal_yxa
        };

        // Samla alla vapen först
        const allaVapen = [];
        for (const grupp in CONFIG.EON.vapengrupper) {
            if (grupp != "yxa") {
                continue;
            }

            if (!game.EON.narstridsvapen5[grupp]) {
                continue;
            }

            for (const vapenmall in itemlist[grupp]) {
                const vapen = itemlist[grupp][vapenmall];
                allaVapen.push({
                    vapen: vapen,
                    vapenmall: vapenmall,
                    grupp: grupp,
                    image: vapenIkoner[grupp] || "icons/svg/item-bag.svg"                    
                });
            }
        }

        // Hämta alla vapenegenskaper parallellt
        const egenskaperPromises = allaVapen.map(v => this.GetWeaponProperty(v.vapen, eonversion));
        const allaEgenskaper = await Promise.all(egenskaperPromises);

        // Skapa alla itemData objekt
        const itemDataArray = allaVapen.map((vapenData, index) => ({
            img: vapenData.image,
            name: vapenData.vapen.namn,
            type: "Närstridsvapen",                
            system: {
                installningar: {
                    skapad: true,
                    version: "5.0.0",
                    eon: eonversion
                },
                typ: "utrustning",
                mall: vapenData.vapenmall,
                grupp: vapenData.vapen.grupp,
                enhand: vapenData.vapen.enhand,
                tvahand: vapenData.vapen.tvahand,
                hugg: vapenData.vapen.hugg,
                stick: vapenData.vapen.stick,
                kross: vapenData.vapen.kross,
                langd: vapenData.vapen.langd,
                vikt: vapenData.vapen.vikt,
                pris: vapenData.vapen.pris,
                egenskaper: allaEgenskaper[index]                  
            }                    
        }));

        // Skapa alla dokument i batch
        await Item.createDocuments(itemDataArray, {pack: pack});

        console.log(`EON | Lagt till ${itemDataArray.length} närstridsvapen i ${pack}`);
    }

    // Användes för att skapa upp avståndsvapen i kompendiet
    // Lägg till ItemHelper.CreateRangeWeapon(); i Ready
    static async CreateRangeWeapon() {
        const itemlist = game.EON.avstandsvapen5;
        const eonversion = "eon5";
        const pack = "eon-rpg.avstandsvapen5";

        // Lookup-map för vapenikoner
        const vapenIkoner = {
            "armborst": CONFIG.EON.ikoner.foremal_armborst,
            "bage": CONFIG.EON.ikoner.foremal_bage,
            "kastvapen": CONFIG.EON.ikoner.foremal_kastvapen
        };

        //"blasror": CONFIG.EON.ikoner.foremal_blasror

        // Samla alla vapen först
        const allaVapen = [];
        for (const grupp in CONFIG.EON.vapengrupper) {
            if (grupp != "blasror") {
                continue;
            }

            if (!itemlist[grupp]) {
                continue;
            }

            for (const vapenmall in itemlist[grupp]) {
                const vapen = itemlist[grupp][vapenmall];
                allaVapen.push({
                    vapen: vapen,
                    vapenmall: vapenmall,
                    grupp: grupp,
                    image: vapenIkoner[grupp] || "icons/svg/item-bag.svg"
                });
            }
        }

        // Hämta alla vapenegenskaper parallellt
        const egenskaperPromises = allaVapen.map(v => this.GetWeaponProperty(v.vapen, eonversion));
        const allaEgenskaper = await Promise.all(egenskaperPromises);

        // Skapa alla itemData objekt
        const itemDataArray = allaVapen.map((vapenData, index) => ({
            img: vapenData.image,
            name: vapenData.vapen.namn,
            type: "Avståndsvapen",
            system: {
                installningar: {
                    skapad: true,
                    version: "5.0.0",
                    eon: eonversion
                },
                typ: "utrustning",
                mall: vapenData.vapenmall,
                grupp: vapenData.vapen.grupp,
                enhand: vapenData.vapen.enhand,
                tvahand: vapenData.vapen.tvahand,
                skada: vapenData.vapen.skada,
                skadetyp: vapenData.vapen.skadetyp,
                rackvidd: vapenData.vapen.rackvidd,
                langd: vapenData.vapen.langd,
                vikt: vapenData.vapen.vikt,
                pris: vapenData.vapen.pris,
                egenskaper: allaEgenskaper[index]
            }
        }));

        // Skapa alla dokument i batch
        await Item.createDocuments(itemDataArray, {pack: pack});

        console.log(`EON | Lagt till ${itemDataArray.length} avståndsvapen i ${pack}`);
    }

    // Användes för att skapa upp sköldar i kompendiet
    // Lägg till ItemHelper.CreateShield(); i Ready
    static async CreateShield() {
        const itemlist = game.EON.forsvar5;
        const pack = "eon-rpg.skoldar5";
        const eonversion = "eon5";

        // Lookup-map för vapenikoner
        const vapenIkoner = {
            "skold": CONFIG.EON.ikoner.foremal_skold
        };

        // Samla alla sköldar först
        const allaSkoldar = [];
        for (const grupp in CONFIG.EON.vapengrupper) {
            if (grupp != "skold") {
                continue;
            }

            if (!itemlist[grupp]) {
                continue;
            }

            for (const vapenmall in itemlist[grupp]) {
                const vapen = itemlist[grupp][vapenmall];
                allaSkoldar.push({
                    vapen: vapen,
                    vapenmall: vapenmall,
                    grupp: grupp,
                    image: vapenIkoner[grupp] || "icons/svg/item-bag.svg"
                });
            }
        }

        // Hämta alla vapenegenskaper parallellt
        const egenskaperPromises = allaSkoldar.map(v => this.GetWeaponProperty(v.vapen, eonversion));
        const allaEgenskaper = await Promise.all(egenskaperPromises);

        // Skapa alla itemData objekt
        const itemDataArray = allaSkoldar.map((vapenData, index) => ({
            img: vapenData.image,
            name: vapenData.vapen.namn,
            type: "Sköld",
            system: {
                installningar: {
                    skapad: true,
                    version: "5.0.0",
                    eon: eonversion
                },
                typ: "utrustning",
                mall: vapenData.vapenmall,
                grupp: vapenData.vapen.grupp,
                enhand: vapenData.vapen.enhand,
                tvahand: vapenData.vapen.tvahand,
                narstrid: vapenData.vapen.narstrid,
                avstand: vapenData.vapen.avstand,
                skydd: vapenData.vapen.skydd,
                skada: vapenData.vapen.skada,
                skadetyp: vapenData.vapen.skadetyp,
                langd: vapenData.vapen.langd,
                vikt: vapenData.vapen.vikt,
                pris: vapenData.vapen.pris,
                egenskaper: allaEgenskaper[index]
            }
        }));

        // Skapa alla dokument i batch
        await Item.createDocuments(itemDataArray, {pack: pack});

        console.log(`EON | Lagt till ${itemDataArray.length} sköldar i ${pack}`);
    }

    // Användes för att skapa upp utrustning i kompendiet
    // Lägg till ItemHelper.CreateEquipment(); i Ready
    static async CreateEquipment() {
        const itemlist = game.EON.utrustning;
        const pack = "eon-rpg.utrustning";
        const image = "icons/svg/item-bag.svg";
        const itemDataArray = [];

        for (const grupp in CONFIG.EON.utrustningsgrupper) {
            if(grupp != "vildmark") {
                continue;
            }

            if (!itemlist[grupp]) {
                continue;
            }

            for (const utrustningmall in itemlist[grupp]) {
                const utrustning = itemlist[grupp][utrustningmall];
                let itemData;

                if (utrustning.installningar?.behallare === true) {
                    itemData = {
                        img: image,
                        name: utrustning.namn,
                        type: "Utrustning",               
                        system: {
                            installningar: {
                                skapad: true,
                                behallare: true,
                                forvaring: false,
                                version: "4.0.0"
                            },
                            volym: {
                                enhet: utrustning?.volym?.enhet,
                                antal: utrustning?.volym?.antal,
                                max: utrustning?.volym?.max
                            },
                            typ: "utrustning",
                            mall: utrustningmall,
                            grupp: grupp,
                            vikt: utrustning.vikt,
                            pris: utrustning.pris
                        }                    
                    };
                }
                else if (utrustning.installningar?.forvaring === true) {
                    itemData = {
                        img: image,
                        name: utrustning.namn,
                        type: "Utrustning",               
                        system: {
                            installningar: {
                                skapad: true,
                                behallare: false,
                                forvaring: true,
                                version: "4.0.0"
                            },
                            typ: "utrustning",
                            mall: utrustningmall,
                            grupp: grupp,
                            vikt: utrustning.vikt,
                            pris: utrustning.pris
                        }                    
                    };
                }
                else {
                    itemData = {
                        img: image,
                        name: utrustning.namn,
                        type: "Utrustning",               
                        system: {
                            installningar: {
                                skapad: true,
                                behallare: false,
                                forvaring: false,
                                version: "4.0.0"
                            },
                            typ: "utrustning",
                            mall: utrustningmall,
                            grupp: grupp,
                            vikt: utrustning.vikt,
                            pris: utrustning.pris
                        }                    
                    };
                }
                itemDataArray.push(itemData);
            }
        }

        await Item.createDocuments(itemDataArray, {pack: pack});
        console.log(`EON | Lagt till ${itemDataArray.length} utrustning i ${pack}`);
    }

    static async DeleteAllCompendiumItems(packName, confirm = true) {
        const pack = game.packs.get(packName);
        
        if (!pack) {
            console.error(`EON | Kompendium "${packName}" hittades inte`);
            return false;
        }

        const documents = await pack.getDocuments();
        
        if (documents.length === 0) {
            console.log(`EON | Kompendium "${packName}" är redan tomt`);
            return true;
        }

        if (confirm) {
            const performDelete = await new Promise((resolve) => {
                Dialog.confirm({
                    title: `Radera alla items från ${packName}`,
                    content: `Är du säker på att du vill radera alla ${documents.length} items från kompendiet "${packName}"?<br><br>Detta går inte att ångra!`,
                    yes: () => resolve(true),
                    no: () => resolve(false),
                });
            });

            if (!performDelete) {
                console.log(`EON | Radering avbruten av användaren`);
                return false;
            }
        }

        try {
            // Använd Item.deleteDocuments() med pack-optionen
            const ids = documents.map(doc => doc.id);
            await Item.deleteDocuments(ids, {pack: packName});

            console.log(`EON | Raderade ${ids.length} items från ${packName}`);
            ui.notifications.info(`Raderade ${ids.length} items från ${packName}`);
            return true;
        } catch (error) {
            console.error(`EON | Fel vid radering från ${packName}:`, error);
            ui.notifications.error(`Fel vid radering från ${packName}`);
            return false;
        }
    }

    static async GetWeaponProperty(vapen, version = false) {
        let pack;
        let eonversion;

        if (!version) {
            eonversion = vapen.system.installningar.eon;
        }
        else {
            eonversion = version;
        }
        
        if (eonversion === "eon4") {
            pack = game.packs.get("eon-rpg.vapenegenskaper");
        }
        else if (eonversion === "eon5") {
            pack = game.packs.get("eon-rpg.vapenegenskaper5");
        }
        else {
            // Fallback till eon4 om värdet är odefinierat eller okänt
            pack = game.packs.get("eon-rpg.vapenegenskaper");
        }
        
        if (!pack) {
            ui.notifications.error("Kunde inte hitta vapenegenskaper-kompendiet");
            return [];
        }
        
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