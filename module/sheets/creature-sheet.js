import DialogHelper from "../dialog-helper.js";
import CalculateHelper from "../calculate-helper.js";
import CreateHelper from "../create-helper.js";
import SelectHelper from "../select-helpers.js"

export default class EonCreatureSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["EON varelse"],
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "skill",
            }]
		});
	}
  
    /** @override */
	constructor(actor, options) {
        super(actor, options);

        this.locked = false;
		this.isCharacter = true;	
        this.isPC = false;
		this.isGM = game.user.isGM;	
    }

    /** @override */
	get template() {
        let sheet = "varelse";

        if ((this.actor.system?.type != undefined)&&(this.actor.system?.type == "")){
            sheet = this.actor.system.type;
        }

		sheet = sheet.toLowerCase().replace(" ", "");
		return `systems/eon-rpg/templates/actors/${sheet}-sheet.html`;
	}

    /** @override */
    async getData() {
        const actorData = foundry.utils.duplicate(this.actor);	
        const version = game.data.system.version;	

		if (!actorData.system.installningar.skapad) {
            await CreateHelper.SkapaFardigheter(this.actor, CONFIG.EON, version);
            actorData.system.installningar.skapad = true;
            actorData.system.installningar.version = version;
            await this.actor.update(actorData);
		}	
        else {
            //await CalculateHelper.hanteraBerakningar(actorData);            
            //await this.actor.update(actorData);
        }
        
        const data = await super.getData();	

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;

        data.listData = SelectHelper.SetupActor(this.actor);

        data.actor.system.listdata = [];
        data.actor.system.listdata.fardigheter = [];
        data.actor.system.listdata.vapen = [];
        data.actor.system.listdata.vapen.narstrid = [];
        data.actor.system.listdata.vapen.avstand = [];
        data.actor.system.listdata.egenskaper = [];

        for (const item of this.actor.items) {
            if (item.type == "Färdighet") {
                data.actor.system.listdata.fardigheter.push(item);
            }
            if (item.type == "Språk") {
                data.actor.system.listdata.fardigheter.push(item);
            }
            if (item.type == "Egenskap") {
                data.actor.system.listdata.egenskaper.push(item);
            }
            if (item.type == "Närstridsvapen") {    
                data.actor.system.listdata.vapen.narstrid.push(item);
            }
            if (item.type == "Avståndsvapen") {
                data.actor.system.listdata.vapen.avstand.push(item);
            }
        }

        data.actor.system.listdata.fardigheter = data.actor.system.listdata.fardigheter.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.vapen.narstrid = data.actor.system.listdata.vapen.narstrid.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.vapen.avstand = data.actor.system.listdata.vapen.avstand.sort((a, b) => a.name.localeCompare(b.name));

        console.log(data.actor.name);
        console.log(data.actor);
        console.log(data.EON);

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        this._setupDotCounters(html);

        html
			.find('.inputdata')
			.change(event => this._onsheetChange(event));

        html
			.find(".item-create")
			.click(this._onItemCreate.bind(this));

        html
			.find(".item-edit")
			.click(this._onItemEdit.bind(this));
    }

    /**
        * Körs när något blir ändrat på rollformuläret som kan få vidare effekt för andra saker. Att man t ex ställer in något på Skräddarsytt.
        * @param _event
    */
    async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const source = dataset.source;
		const actorData = foundry.utils.duplicate(this.actor);	        

        if ((source == "varelsegrupp") || (source == "varelsemall"))  {
            var grupp = document.getElementById("varelsegrupp");
            var mall = document.getElementById("varelsemall");

            if (mall.value == "custom") {
                // ja vad göra nu?
                return;
            }

            let gruppData = game.EON.djur.varelsemall[grupp.value];
            gruppData.typ = grupp.value;
            let mallData = game.EON.djur.variant[mall.value];

            if ((gruppData == undefined) || (gruppData?.namn == undefined)) {
                return;
            }
            if ((mallData == undefined) || (mallData?.namn == undefined)) {
                return;
            }

            /* if (this.actor.system.installningar.varelsemall != "") {
                const performDelete = await new Promise((resolve) => {
                    Dialog.confirm({
                        title: "Varning!",
                        yes: () => resolve(true),
                        no: () => resolve(false),
                        content: "Om du byter varelsemall kommer alla ändringar du gjort på dina härledda grundegenskaper att nollställas enligt den nya varelsemallen"
                    });
                });

                if (!performDelete)
                    return;
            }
 */
            actorData.name = mallData.namn;
            actorData.system.bakgrund.beskrivning = mallData.beskrivning;
            actorData.system.referens = mallData.referens;

            actorData.system.installningar.varelsegrupp = mallData.typ;

            if ((gruppData.typ != "") && (mallData.typ != gruppData.typ)) {
                actorData.system.installningar.varelsegrupp = gruppData.typ;
            }

            for (const egenskap in actorData.system.harleddegenskaper) {
                if (actorData.system.harleddegenskaper[egenskap] == undefined) {
                    continue;
                }

                let mallExists = (mallData.harleddegenskaper[egenskap] == undefined) ? false : true;
                let mallVarde = false;
                let gruppExists = (gruppData.harleddegenskaper[egenskap] == undefined) ? false : true;
                let gruppVarde = false;

                if (mallExists) {
                    mallVarde = mallData.harleddegenskaper[egenskap];
                }
                if (gruppExists) {
                    gruppVarde = gruppData.harleddegenskaper[egenskap];
                }

                if (actorData.system.harleddegenskaper[egenskap].grund?.tvarde != undefined) {
                    if (!mallVarde) {
                        mallVarde = {
                            tvarde: 0,
                            bonus: 0
                        };
                    }
                    if (!gruppVarde) {
                        gruppVarde = {
                            tvarde: 0,
                            bonus: 0
                        };
                    }     
                    
                    actorData.system.harleddegenskaper[egenskap].grund.tvarde = mallVarde.tvarde + gruppVarde.tvarde;
                    actorData.system.harleddegenskaper[egenskap].grund.bonus = mallVarde.bonus + gruppVarde.bonus;
                    actorData.system.harleddegenskaper[egenskap].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system.harleddegenskaper[egenskap]);
                }
                else {
                    let mall = (!mallVarde) ? 0 : parseInt(mallVarde);
                    let grupp = (!gruppVarde) ? 0 : parseInt(gruppVarde);

                    actorData.system.harleddegenskaper[egenskap] = mall + grupp;
                }
            }

            await this.actor.update(actorData);
            this.render();
            return;
        }
	}

    /**
        * Körs när något blir skapat. Om typen skaknas visas ett felmeddelande.
        * @param _event
        * @return Boolean - om typen skapades eller ej.
    */
    async _onItemCreate(event) {
		event.preventDefault();

		const header = event.currentTarget;
		const type = header.dataset.type;
        const version = game.data.system.version;
        let found = false;

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

        if (type == "mynt") {
            found = true;

			itemData = {
                name: "Silvermynt",
                type: "Utrustning",                
                system: {
                    installningar: {
                        skapad: true,
                        version: version,
                        behallare: true
                    },
                    typ: "mynt",
                    volym: {
                        enhet: "st",
                        antal: 0,
                        max: 50
                    }
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

    /**
        * Körs när något skall blir editerat och dess Item formulär öppnas.
        * @param _event
    */
    async _onItemEdit(event) {
		var _a;

		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.type == "attribute") {
            DialogHelper.AttributeEditDialog(this.actor, dataset.source, dataset.attribute);
            return;
        }
        if (dataset.type == "skada") {
            DialogHelper.AttributeEditDialog(this.actor, dataset.type, dataset.attribute);
            return;
        }

        const itemid = dataset.itemid;
		const item = await this.actor.getEmbeddedDocument("Item", itemid);	
        
        if (dataset.property != undefined) {
            return;
        }

		if (item instanceof Item) {
            _a = item.sheet;

            if ((_a === null) || (_a === void 0)) {
                void 0;
            }                
            else {
                _a.render(true);  
            }
		}
	}

    /**
        * Funktion som säkerställer att alla rutor och boxar fylls i mer rätt grafik.
        * @param _event
    */
    _setupDotCounters(html) {
		html.find(".resource-circle").each(function () {
			const value = Number(this.dataset.value);
			$(this)
				.find(".resource-value")
				.each(function (i) {
					if (i <= value - 1) {
						$(this).addClass("active");
					}
				});
		});

        html.find(".resource-box").each(function () {
			const value = Number(this.dataset.value);
			$(this)
				.find(".resource-value")
				.each(function (i) {
					if (i <= value - 1) {
						$(this).addClass("active");
					}
				});
		});
	}
}