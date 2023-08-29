//import DiceHelper from "./dice-helper.js";
import DialogHelper from "../dialog-helper.js";
import CreateHelper from "../create-helper.js";
import CalculateHelper from "../calculate-helper.js";

export default class EonActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
            classes: ["EON rollperson"],
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
		this.isGM = game.user.isGM;	
    }

    /** @override */
	get template() {
        let sheet = "rollperson";

        if ((this.actor.system?.type != undefined)&&(this.actor.system?.type == "")){
            sheet = this.actor.system.type;
        }

		sheet = sheet.toLowerCase().replace(" ", "");
		return `systems/eon-rpg/templates/actors/${sheet}-sheet.html`;
	}

    /** @override */
    async getData() {
        const actorData = duplicate(this.actor);	
        const version = game.data.system.version;	

		if (!actorData.system.installningar.skapad) {
            await CreateHelper.SkapaFardigheter(this.actor, CONFIG.EON, version);
            await CreateHelper.SkapaNarstridsvapen(this.actor, CONFIG.EON, "slagsmal", "obevapnad", version, true);

            actorData.system.installningar.skapad = true;
            actorData.system.installningar.version = version;
            await this.actor.update(actorData);
		}	
        else {
            await CalculateHelper.hanteraBerakningar(actorData);            
            await this.actor.update(actorData);
        }
        
        const data = await super.getData();	

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;

        data.actor.system.listdata = [];
        data.actor.system.listdata.fardigheter = [];
        data.actor.system.listdata.fardigheter.strid = [];
        data.actor.system.listdata.fardigheter.rorelse = [];
        data.actor.system.listdata.fardigheter.mystik = [];
        data.actor.system.listdata.fardigheter.social = [];
        data.actor.system.listdata.fardigheter.kunskap = [];
        data.actor.system.listdata.fardigheter.sprak = [];
        data.actor.system.listdata.fardigheter.vildmark = [];
        data.actor.system.listdata.fardigheter.ovriga = [];
        data.actor.system.listdata.utrustning = [];
        data.actor.system.listdata.utrustning.rustning = [];
        data.actor.system.listdata.utrustning.vapen = [];
        data.actor.system.listdata.utrustning.vapen.narstrid = [];
        data.actor.system.listdata.utrustning.vapen.avstand = [];
        data.actor.system.listdata.utrustning.vapen.skold = [];
        data.actor.system.listdata.utrustning.mynt = [];
        data.actor.system.listdata.utrustning.foremal = [];
        data.actor.system.listdata.kroppsdelar = [];
        data.actor.system.listdata.kroppsdelar = await CreateHelper.SkapaKroppsdelar(CONFIG.EON, version);
        data.actor.system.listdata.skador = [];

        let totalVikt = 0;
        let totalViktVapen = 0;
        let totalViktUtrustning = 0;

        for (const item of this.actor.items) {
            if (item.type == "Färdighet") {
                data.actor.system.listdata.fardigheter[item.system.grupp].push(item);
            }        
            if (item.type == "Språk") {
                data.actor.system.listdata.fardigheter.sprak.push(item);
            }
            if (item.type == "Närstridsvapen") {    
                data.actor.system.listdata.utrustning.vapen.narstrid.push(item);
                if (item.system.installningar.buren) {
                    totalVikt += parseFloat(item.system.vikt);   
                    totalViktVapen += parseFloat(item.system.vikt);               
                }
            }
            if (item.type == "Avståndsvapen") {    
                data.actor.system.listdata.utrustning.vapen.avstand.push(item);
                if (item.system.installningar.buren) {
                    totalVikt += parseFloat(item.system.vikt);   
                    totalViktVapen += parseFloat(item.system.vikt);               
                }
            }
            if (item.type == "Sköld") {    
                data.actor.system.listdata.utrustning.vapen.skold.push(item);
                if (item.system.installningar.buren) {
                    totalVikt += parseFloat(item.system.vikt);    
                    totalViktVapen += parseFloat(item.system.vikt);              
                }
            }
            if (item.type == "Rustning") {    
                data.actor.system.listdata.utrustning.rustning.push(item);
                if (item.system.installningar.buren) {
                    data.actor.system.listdata.kroppsdelar = [];
                    for (const del of item.system.kroppsdel) {
                        data.actor.system.listdata.kroppsdelar.push(del);
                    }                   
                }
            }
            if (item.type == "Utrustning") {
                if (item.system.typ == "mynt") {
                    data.actor.system.listdata.utrustning.mynt.push(item);
                }
                else {
                    data.actor.system.listdata.utrustning.foremal.push(item);
                }                

                if (item.system.installningar.buren) {
                    totalVikt += parseFloat(item.system.vikt);    
                    totalViktUtrustning += parseFloat(item.system.vikt);              
                }
            }
            if (item.type == "Skada") {    
                data.actor.system.listdata.skador.push(item);
            }
            
        }

        for (const grupp in CONFIG.EON.fardighetgrupper) {
            data.actor.system.listdata.fardigheter[grupp] = data.actor.system.listdata.fardigheter[grupp].sort((a, b) => a.name.localeCompare(b.name));
        }

        data.actor.system.listdata.utrustning.vapen.narstrid = data.actor.system.listdata.utrustning.vapen.narstrid.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.vapen.avstand = data.actor.system.listdata.utrustning.vapen.avstand.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.vapen.skold = data.actor.system.listdata.utrustning.vapen.skold.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.rustning = data.actor.system.listdata.utrustning.rustning.sort((a, b) => a.name.localeCompare(b.name));

        data.actor.system.berakning = [];
        data.actor.system.berakning.utmattning = [];
        data.actor.system.berakning.utmattning.perrunda = this.actor.system.skada.blodning;
        data.actor.system.berakning.svarighet = [];
        data.actor.system.berakning.svarighet.smarta = this.actor.system.skada.smarta;   
        data.actor.system.berakning.belastning = [];

        data.actor.system.berakning.belastning.vapen = 0;            
        data.actor.system.berakning.belastning.utrustning = 0;
        data.actor.system.berakning.belastning.rustning = 0;
        data.actor.system.berakning.belastning.riddjur = 0;

        if (data.actor.system.listdata.utrustning.rustning.length > 0) {
            const items = data.actor.system.listdata.utrustning.rustning.filter(rustning => rustning.type === "Rustning" && rustning.system.installningar.buren);
            let varde = 0;
            
            for (const i of items) {
                varde += i.system.belastning;
            }

            data.actor.system.berakning.belastning.rustning = varde;
        }

        if (data.EON.CONFIG.settings.weightRules) {
            if (totalViktVapen > 0) {
                data.actor.system.berakning.belastning.vapen = Math.round(totalViktVapen);
            }
            if (totalViktUtrustning > 0) {
                data.actor.system.berakning.belastning.utrustning = Math.round(totalViktUtrustning);
            }

            const totalVarde = data.actor.system.berakning.belastning.vapen + data.actor.system.berakning.belastning.rustning + data.actor.system.berakning.belastning.utrustning;
            data.actor.system.berakning.belastning.totaltavdrag = CalculateHelper.BeraknaBelastningAvdrag(totalVarde);
        }
        else {
            data.actor.system.berakning.belastning.totaltavdrag = CalculateHelper.BeraknaBelastningAvdrag(data.actor.system.berakning.belastning.rustning);
        }

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
            .find('.tic')
			.click(this._ticValueUp.bind(this));

		html
			.find('.tic')
			.on('contextmenu', this._ticValueDown.bind(this));

        html
            .find('.macroBtn')
            .click(this._onRollDialog.bind(this));

        // Resource dots
		html
            .find(".resource-circle > .resource-value")
            .click(this._clickedCircle.bind(this));

        html
            .find(".resource-box > .resource-value")
            .click(this._clickedCircle.bind(this));

        // Rollable stuff
		html
            .find(".vrollable")
            .click(this._onRollDialog.bind(this));

        // item handling
        html
			.find(".item-create")
			.click(this._onItemCreate.bind(this));

        html
			.find(".item-edit")
			.click(this._onItemEdit.bind(this));

        html
			.find(".item-active")
			.click(this._onItemActive.bind(this));

        html
			.find(".item-alter")
            .change(event => this._onItemAlter(event));
    }

    async _ticValueUp(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        // om Item
        if (dataset.itemid != undefined) {
            const itemid = dataset.itemid;
		    const item = this.actor.getEmbeddedDocument("Item", itemid);

            const itemData = duplicate(item);

            itemData.system.varde.bonus += 1;

            if (itemData.system.varde.bonus > 3)  {
                itemData.system.varde.tvarde += 1;
                itemData.system.varde.bonus = 0;
            }
    
            await item.update(itemData);
            this.render();

			return;
        }

        // om egenskap på Actor
        const property = dataset.property;
        const type = dataset.type;		

		const actorData = duplicate(this.actor);	

		actorData.system[property][type].bonus += 1;
	
        if (actorData.system[property][type].bonus > 3)  {
			actorData.system[property][type].tvarde += 1;
			actorData.system[property][type].bonus = 0;
		}

        await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
		await this.actor.update(actorData);
		this.render();
	}

	async _ticValueDown(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        // om Item
        if (dataset.itemid != undefined) {
            const itemid = dataset.itemid;
		    const item = this.actor.getEmbeddedDocument("Item", itemid);

            const itemData = duplicate(item);

            if ((itemData.system.varde.tvarde == 0) && (itemData.system.varde.bonus == 0)) {
                return;
            }
    
            itemData.system.varde.bonus -= 1;        
    
            if (itemData.system.varde.bonus < -1) {
                itemData.system.varde.tvarde -= 1;
                itemData.system.varde.bonus = 3;
            }
    
            if (itemData.system.varde.tvarde < 0) {
                itemData.system.varde.tvarde = 0;
                itemData.system.varde.bonus = 0;
            }

            await item.update(itemData);
            this.render();

			return;
        }

        // om egenskap på Actor
        const property = dataset.property;
        const type = dataset.type;

		const actorData = duplicate(this.actor);		

        if ((actorData.system[property][type].tvarde == 0) && (actorData.system[property][type].bonus == 0)) {
            return;
        }

		actorData.system[property][type].bonus -= 1;        

		if (actorData.system[property][type].bonus < -1) {
			actorData.system[property][type].tvarde -= 1;
			actorData.system[property][type].bonus = 3;
		}

		if (actorData.system[property][type].tvarde < 0) {
			actorData.system[property][type].tvarde = 0;
			actorData.system[property][type].bonus = 0;
		}

        await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
		await this.actor.update(actorData);
		this.render();
	}

    _onRollDialog(event) {		
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.source == "attribute") {
            let title = "";
            if (dataset.title != undefined) {
                title = dataset.title
            }
            DialogHelper.AttributeDialog(this.actor, dataset.type, dataset.key, title);
            return;
        }

        if (dataset.source == "skill") {
            DialogHelper.SkillDialog(event, this.actor);
			return;
        }   

        if (dataset.source == "weapon") {
            DialogHelper.WeaponDialog(event, this.actor);
			return;
        }

        if (dataset.source == "initiative") {
            DialogHelper.CombatDialog(this.actor);
            return;
        }
        
		ui.notifications.error("Slag saknar funktion");
	}

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
                    name: "ny",
                    type: "Språk",                
                    data: {
                        installningar: {
                            skapad: true,
                            version: version
                        },
                        namn: "Nytt språk"
                    }
                };
            }
            else {
                itemData = {
                    name: "ny",
                    type: "Färdighet",                
                    data: {
                        installningar: {
                            skapad: true,
                            version: version
                        },
                        namn: "Ny färdighet",
                        grupp: skilltype
                    }
                };
            }			
		}

		if (type == "närstridsvapen") {
            found = true;

			itemData = {
                name: "Nytt närstridsvapen",
                type: "Närstridsvapen",                
                data: {
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
                
                data: {
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
                
                data: {
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
                data: {
                    installningar: {
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
                data: {
                    installningar: {
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
                data: {
                    installningar: {
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

        if (type == "skada") {
            found = true;

			itemData = {
                name: "Ny skada",
                type: "Skada",
                
                data: {
                    installningar: {
                        skapad: true,
                        version: version
                    }
                }
            };
		}

        if (found) {
            await this.actor.createEmbeddedDocuments("Item", [itemData]);
            return;
        }

        ui.notifications.error("Typen som skall skapas saknar funktion");
    }

    async _onItemEdit(event) {
		var _a;

		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;
        const itemid = dataset.itemid;
		const item = this.actor.getEmbeddedDocument("Item", itemid);	
        
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

    async _onItemAlter(event) {
		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;
        const itemid = dataset.itemid;			
        
        if (dataset.property != undefined) {
            const fieldStrings = dataset.property;
			const fields = fieldStrings.split(".");

            var value = element.value;

            if (dataset.datatype == "Integer") {
                value = parseInt(value);
            }
            else if (dataset.datatype == "Number") {
                value = parseFloat(value);
            }

            const item = this.actor.getEmbeddedDocument("Item", itemid);
            const itemData = duplicate(item);

            if (fields.length == 1) {
                itemData.system[fields[0]] = value;
            }   
            else if (fields.length == 2) {    
                itemData.system[fields[0]][fields[1]] = value;                    
            }

            await item.update(itemData);
            this.render();
        }
        else {
            return;
        }
	}

    async _onItemActive(event) {		
		event.preventDefault();
        event.stopPropagation();

		const element = event.currentTarget;
		const dataset = element.dataset;

        const itemid = dataset.itemid;
        const property = dataset.property;

		const item = this.actor.getEmbeddedDocument("Item", itemid);
        const itemData = duplicate(item);        
		
		let active = itemData.system.installningar[property];
		itemData.system.installningar[property] = !active;

		await item.update(itemData);

        if (item.type == "Rustning") {
            const activeArmor = this.actor.items.filter(rustning => rustning.type === "Rustning" && rustning.system.installningar.buren && (rustning._id != item._id));

            for (const armor of activeArmor) {
                const otherItem = await this.actor.getEmbeddedDocument("Item", armor._id);
                const otheritemData = duplicate(otherItem);
                otheritemData.system.installningar.buren = false;
                await otherItem.update(otheritemData);
            }
        }

		this.render();
	}

    async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const source = dataset.source;
		const actorData = duplicate(this.actor);

        if (source == "folkslag") {
            var e = document.getElementById("folkslag");
            let data = game.EON.folkslag[e.value];

            if (data?.namn == undefined) {
                return;
            }

            if (this.actor.system.bakgrund.folkslag != "") {
                const performDelete = await new Promise((resolve) => {
                    Dialog.confirm({
                        title: "Varning!",
                        yes: () => resolve(true),
                        no: () => resolve(false),
                        content: "Om du byter folkslag kommer alla ändringar du gjort på dina grundegenskaper att nollställas enligt det nya folkslaget"
                    });
                });

                if (!performDelete)
                    return;
            }

            for (const egenskap in data.grundegenskaper) {
                actorData.system.grundegenskaper[egenskap].tvarde = data.grundegenskaper[egenskap].tvarde;
                actorData.system.grundegenskaper[egenskap].bonus = data.grundegenskaper[egenskap].bonus;
            }

            await CalculateHelper.BeraknaHarleddEgenskaper(actorData);

            actorData.system.strid.lakningstakt = parseInt(data.lakningstakt);
            actorData.system.bakgrund.folkslag = e.value;            

            await this.actor.update(actorData);
		    this.render();
            return;
        }		
        if (source == "valmaende") {
            let ruta = document.getElementById("fokus_varde");

            const oldIndex = Number(dataset.value);
            const newIndex = Number(ruta.value);

            if (newIndex < oldIndex) {

                actorData.system.egenskap.fokus.varde = newIndex;
                actorData.system.egenskap.fokus.max = newIndex;
                
                await this.actor.update(actorData);
                this.render();
                return;                
            }            
        }
	}

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

    async _clickedCircle(event) {
        event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

        // om det var ett item
        if (dataset.itemid != undefined) {
            const itemid = dataset.itemid;
            const item = this.actor.getEmbeddedDocument("Item", itemid);
            const itemData = duplicate(item);
            let found = false;

            if (dataset.type == "boolean") {
                found = true;
                itemData.system[dataset.field] = !itemData.system[dataset.field];
            }

            if (found) {
                await item.update(itemData);
                this.render();
            }
            else {
                ui.notifications.error("Datatypen ["+dataset.type+"] som skall ändras saknar funktion");
            }

            return;
        }

		const type = dataset.type;
        const value = dataset.value

        const index = Number(dataset.index);
		const parent = $(element.parentNode);
		const steps = parent.find(".resource-value");

        const fieldStrings = parent[0].dataset.name;

        if (index < 0 || index > steps.length) {
            return;
        }

        const actorData = duplicate(this.actor);
        steps.removeClass("active");

        if (type != undefined) {
            if ((parseInt(actorData.system[fieldStrings][type][value]) == 1) && (parseInt(index) == 1)) {
                actorData.system[fieldStrings][type][value] = 0;
            }
            else {
                actorData.system[fieldStrings][type][value] = parseInt(index);
            }
        }
        else if ((actorData.system[fieldStrings][value] == 1) && (parseInt(index) == 1)) {
            actorData.system[fieldStrings][value] = 0;
        }
        else {
            actorData.system[fieldStrings][value] = parseInt(index);
        }

        steps.each(function (i) {
            if (i <= index - 1) {
                $(this).addClass("active");
            }
        });
        
        this.actor.update(actorData);
    }
}

