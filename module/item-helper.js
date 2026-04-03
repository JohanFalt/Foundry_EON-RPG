import { eon } from "./config.js";
import CreateHelper from "./create-helper.js";
import {
    CCW_EGENSKAP_SOURCE_UUID_FLAG,
    CCW_FOLKSLAG_MANAGED_FLAG,
    collectAllEgenskapRefsForFinish,
    loadFolkslag5Doc,
    normalizeEgenskapRefKey,
    partitionFolkslagEgenskaper,
    FOLKSLAGSEGENSKAPER5_PACK,
    SPRAK5_PACK
} from "./apps/folkslag-wizard-helper.js";

const ITEM_FLAG_SCOPE = "eon-rpg";

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
                    name: game.i18n.localize("eon.items.nyttSprak"),
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
                name: game.i18n.localize("eon.items.nyEgenskap"),
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
                name: game.i18n.localize("eon.items.nyttMysterie"),
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
                name: game.i18n.localize("eon.items.nyAvvisning"),
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
                name: game.i18n.localize("eon.items.nyBesvarjelse"),
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
                name: game.i18n.localize("eon.items.nyttNarstridsvapen"),
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
                name: game.i18n.localize("eon.items.nyttAvstandsvapen"),
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
                name: game.i18n.localize("eon.items.nySkold"),
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
                name: game.i18n.localize("eon.items.nyRustning"),
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
                name: game.i18n.localize("eon.items.nyttForemal"),
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
                label: game.i18n.localize("eon.sheets.item.magnitud"),
                varde: 0
            }

            const properties = [];
            properties.push(magnitud);

			itemData = {
                name: game.i18n.localize("eon.items.kongelat"),
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
                name: game.i18n.localize("eon.items.nySkada"),
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
                name: game.i18n.localize("eon.items.faltstorning"),
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

    /**
     * Ta bort alla items som skapats av CCW-folkslagsynken (egenskap + startspråk).
     * @param {Actor} actor
     */
    static async removeCcwFolkslagManagedItems(actor) {
        const ids = actor.items
            .filter((item) => item.getFlag(ITEM_FLAG_SCOPE, CCW_FOLKSLAG_MANAGED_FLAG) === true)
            .map((item) => item.id);
        if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
    }

    /**
     * Seriell kö per actor: två parallella _prepareContext/sync-anrop annars kan båda se inga ccw-flaggade items och skapa dubletter.
     * @type {Map<string, Promise<void>>}
     */
    static #ccwFolkslagSyncChains = new Map();

    /**
     * Actor-id under aktiv #syncCcwFolkslagItemsFromDraftInner (från remove tills finally).
     * Förhindrar att CharacterCreationWizard._prepareContext startar ny sync när deleteEmbeddedDocuments
     * redan tagit bort ccw-items men create inte körts (actor-uppdatering → render → guard).
     * @type {Set<string>}
     */
    static #ccwFolkslagSyncActorIds = new Set();

    /**
     * @param {string} [actorId]
     * @returns {boolean}
     */
    static isCcwFolkslagSyncInProgressForActor(actorId) {
        return !!(actorId && this.#ccwFolkslagSyncActorIds.has(actorId));
    }

    /**
     * Byter ut CCW-folkslags-items på actorn mot aktuellt Folkslag5-utkast (obligatoriska + valfria + startspråk).
     * @param {Actor} actor
     * @param {object} mergedDraft
     */
    static async syncCcwFolkslagItemsFromDraft(actor, mergedDraft) {
        const actorId = actor?.id;
        if (!actorId) return;

        const prev = this.#ccwFolkslagSyncChains.get(actorId) ?? Promise.resolve();
        const next = prev
            .catch(() => {})
            .then(() => this.#syncCcwFolkslagItemsFromDraftInner(actor, mergedDraft));
        this.#ccwFolkslagSyncChains.set(actorId, next);
        return next;
    }

    /**
     * @param {Actor} actor
     * @param {object} mergedDraft
     */
    static async #syncCcwFolkslagItemsFromDraftInner(actor, mergedDraft) {
        const syncActorId = actor?.id;
        if (!syncActorId) return;
        this.#ccwFolkslagSyncActorIds.add(syncActorId);
        try {
            await this.removeCcwFolkslagManagedItems(actor);

            const primarFolkslagId = (mergedDraft?.folkslag ?? "").toString().trim();
            if (!primarFolkslagId) return;

            const primarDoc = await loadFolkslag5Doc(primarFolkslagId);
            if (!primarDoc) return;

            const kulturFolkslagId = mergedDraft.harKulturfolkslag ? (mergedDraft.kulturfolkslag ?? "").toString().trim() : "";
            const kulturDoc = kulturFolkslagId ? await loadFolkslag5Doc(kulturFolkslagId) : null;
            const harKulturfolkslagEffective = !!(mergedDraft.harKulturfolkslag && kulturDoc);

            const { listedRefs, valfriaPoolRefs } = partitionFolkslagEgenskaper(
                primarDoc,
                kulturDoc,
                harKulturfolkslagEffective
            );
            const allRefs = collectAllEgenskapRefsForFinish(listedRefs, valfriaPoolRefs, mergedDraft.folkValfriaValda ?? []);

            const egenskapPack = game.packs.get(FOLKSLAGSEGENSKAPER5_PACK);
            if (!egenskapPack) {
                console.warn(`[eon-rpg] syncCcwFolkslagItemsFromDraft: saknar pack ${FOLKSLAGSEGENSKAPER5_PACK}`);
            } else {
                /** @type {Item[]} */
                let kallaEgenskaper = [];
                try {
                    kallaEgenskaper = await egenskapPack.getDocuments({ type: "Egenskap" });
                } catch (err) {
                    console.warn(err);
                    kallaEgenskaper = [];
                }
                /** @type {object[]} */
                const egenskapCreates = [];
                const skapadeEgenskapNycklar = new Set();

                for (const ref of allRefs) {
                    const refUuid = normalizeEgenskapRefKey(ref);
                    if (!refUuid || skapadeEgenskapNycklar.has(refUuid)) continue;
                    skapadeEgenskapNycklar.add(refUuid);
                    let kallaEgenskap = kallaEgenskaper.find((candidate) => candidate.uuid === refUuid);
                    if (kallaEgenskap === undefined) {
                        kallaEgenskap = game.items.find((candidate) => candidate.uuid === refUuid);
                    }
                    if (kallaEgenskap === undefined) continue;
                    const beskrivning = (kallaEgenskap.system.beskrivning ?? "").toString();
                    egenskapCreates.push({
                        name: kallaEgenskap.name,
                        type: "Egenskap",
                        flags: {
                            [ITEM_FLAG_SCOPE]: {
                                [CCW_FOLKSLAG_MANAGED_FLAG]: true,
                                [CCW_EGENSKAP_SOURCE_UUID_FLAG]: refUuid
                            }
                        },
                        system: {
                            installningar: {
                                skapad: true,
                                eon: actor.system.installningar.eon,
                                version: kallaEgenskap.system.installningar.version,
                                kantabort: true,
                                folkslag: true,
                                harniva: kallaEgenskap.system.installningar.harniva
                            },
                            niva: kallaEgenskap.system.niva,
                            beskrivning
                        }
                    });
                }
                if (egenskapCreates.length) {
                    await actor.createEmbeddedDocuments("Item", egenskapCreates);
                }
            }

            const sprakKallaDoc =
                mergedDraft.harKulturfolkslag && kulturFolkslagId ? kulturDoc : primarDoc;
            const sprakList = sprakKallaDoc?.system?.sprak;
            if (!sprakList?.length) return;

            const sprakPack = game.packs.get(SPRAK5_PACK);
            if (!sprakPack) {
                console.warn(`[eon-rpg] syncCcwFolkslagItemsFromDraft: saknar pack ${SPRAK5_PACK}`);
                return;
            }
            /** @type {Item[]} */
            let sprakDocs = [];
            try {
                sprakDocs = await sprakPack.getDocuments({ type: "Språk" });
            } catch (err) {
                console.warn(err);
                return;
            }
            /** @type {object[]} */
            const sprakCreates = [];
            const sprakSkapadeNycklar = new Set();
            for (const sprakRad of sprakList) {
                const sprakUuid = (sprakRad.uuid ?? "").toString().trim();
                if (!sprakUuid || sprakSkapadeNycklar.has(sprakUuid)) continue;
                let kallaSprak = sprakDocs.find((candidate) => candidate.uuid === sprakUuid);
                if (kallaSprak === undefined) {
                    kallaSprak = game.items.find((candidate) => candidate.uuid === sprakUuid);
                }
                if (kallaSprak === undefined) continue;
                sprakSkapadeNycklar.add(sprakUuid);
                sprakCreates.push({
                    name: kallaSprak.name,
                    type: "Språk",
                    flags: {
                        [ITEM_FLAG_SCOPE]: {
                            [CCW_FOLKSLAG_MANAGED_FLAG]: true,
                            [CCW_EGENSKAP_SOURCE_UUID_FLAG]: sprakUuid
                        }
                    },
                    system: {
                        installningar: {
                            skapad: true,
                            eon: actor.system.installningar.eon,
                            version: kallaSprak.system.installningar.version,
                            kantabort: true
                        }
                    }
                });
            }
            if (sprakCreates.length) {
                await actor.createEmbeddedDocuments("Item", sprakCreates);
            }
        } finally {
            this.#ccwFolkslagSyncActorIds.delete(syncActorId);
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
        const itemlist = game.EON.utrustning5;
        const eonversion = "eon5";
        const pack = "eon-rpg.utrustning5";
        const defaultImage = "icons/svg/item-bag.svg";

        // Samla alla utrustningsföremål först
        const allaUtrustning = [];
        for (const grupp in CONFIG.EON.utrustningsgrupper5) {
            if (grupp != "religios") {
                continue;
            }

            if (!itemlist[grupp]) {
                continue;
            }

            for (const utrustningmall in itemlist[grupp]) {
                const utrustning = itemlist[grupp][utrustningmall];
                allaUtrustning.push({
                    utrustning: utrustning,
                    utrustningmall: utrustningmall,
                    grupp: grupp,
                    image: defaultImage
                });
            }
        }

        // Skapa alla itemData objekt
        const itemDataArray = allaUtrustning.map(({ utrustning, utrustningmall, grupp, image }) => {
            const isBehallare = utrustning.installningar?.behallare === true;
            const isForvaring = utrustning.installningar?.forvaring === true;
            const system = {
                installningar: {
                    skapad: true,
                    behallare: isBehallare,
                    forvaring: isForvaring,
                    version: "5.0.0",
                    eon: eonversion
                },
                typ: "utrustning",
                mall: utrustningmall,
                grupp: grupp,
                vikt: utrustning.vikt,
                pris: utrustning.pris
            };
            if (isBehallare && utrustning.volym) {
                system.volym = {
                    enhet: utrustning.volym.enhet,
                    antal: utrustning.volym.antal,
                    max: utrustning.volym.max
                };
            }
            return {
                img: image,
                name: utrustning.namn,
                type: "Utrustning",
                system: system
            };
        });

        // Skapa alla dokument i batch
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
            ui.notifications.info(game.i18n.format("eon.messages.raderadeItems", { count: ids.length, pack: packName }));
            return true;
        } catch (error) {
            console.error(`EON | Fel vid radering från ${packName}:`, error);
            ui.notifications.error(game.i18n.format("eon.messages.felVidRadering", { pack: packName }));
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
            ui.notifications.error(game.i18n.localize("eon.messages.kundeInteHittaVapenegenskaper"));
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

        return vapen.find(e => e._id === id);
    }

    static async GetWeapon5(vapentyp, id) {
        let kompendie = "";

        if (vapentyp == "narstridsvapen") {
            kompendie = "eon-rpg.narstridsvapen5";
        }
        else if (vapentyp == "avstandsvapen") {
            kompendie = "eon-rpg.avstandsvapen5";
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

        return vapen.find(e => e._id === id);
    }

    /**
     * Hittar första närstridsvapen i kompendium eon-rpg.narstridsvapen5 (via GetWeapon5).
     * @param {{ grupp?: string, mall?: string }} [filter]
     * @returns {Promise<Item|null>}
     */
    static async findNarstridsvapen5InCompendium(filter = {}) {
        const grupp = filter.grupp ?? "slagsmal";
        const mall = filter.mall ?? "obevapnad";
        const vapen = await this.GetWeapon5("narstridsvapen");
        if (!Array.isArray(vapen) || !vapen.length) return null;
        return (
            vapen.find(
                (i) =>
                    i.type === "Närstridsvapen" &&
                    i.system?.grupp == grupp &&
                    i.system?.mall == mall
            ) ?? null
        );
    }
}