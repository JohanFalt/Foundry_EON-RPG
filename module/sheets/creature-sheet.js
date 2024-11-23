import DialogHelper from "../dialog-helper.js";
import CalculateHelper from "../calculate-helper.js";
import ItemHelper from "../item-helper.js";
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
            actorData.system.skada.vandning.lista = await CreateHelper.SkapaVandningar();

            actorData.system.installningar.skapad = true;
            actorData.system.installningar.version = version;
            await this.actor.update(actorData);
		}	
        
        const data = await super.getData();	

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;        

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

        data.listData = SelectHelper.SetupActor(this.actor);

        data.enrichedBeskrivning = await TextEditor.enrichHTML(this.actor.system.bakgrund.beskrivning);

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

        // Rollable stuff
		html
            .find(".vrollable")
            .click(this._onRollDialog.bind(this));

        html
            .find('.macroBtn')
            .click(this._onRollDialog.bind(this));

        html
			.find(".item-create")
			.click(this._onItemCreate.bind(this));

        html
			.find(".item-edit")
			.click(this._onItemEdit.bind(this));
    }

    /** @override */
    /**
        * Aktiveras om Item släpps på rollformuläret.
        * @param _event
        * @param data - det släppta item
    */
    async _onDropItem(_event, _data) {
        // if (!this.isEditable || !_data.uuid) {
        //     return false;
        // }

        const droppedItem = await Item.implementation.fromDropData(_data);          

        if (((droppedItem.type.toLowerCase() == "närstridsvapen") || (droppedItem.type.toLowerCase() == "avståndsvapen") || (droppedItem.type.toLowerCase() == "sköld")) && 
                (droppedItem.system.grupp != "")) {

            const version = game.data.system.version;
            const fardighet = droppedItem.system.grupp;
            let found = false;

            for (const item of this.actor.items) {
                if ((item.type.toLowerCase() == "färdighet") && (item.system.id == fardighet)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                let itemData = await CreateHelper.SkapaFardighetItem('allman', game.EON.fardigheter['strid'][fardighet], fardighet, version, false, true);
                await this.actor.createEmbeddedDocuments("Item", [itemData]);
            }            
        }
        
        super._onDropItem(_event, _data);
    }

    /** @override */
    /**
        * Aktiveras om Item släpps på rollformuläret.
        * @param _event
        * @param data - det släppta item
    */
    async _onDropActor(_event, _data) {
        // if (!this.isEditable || !_data.uuid) {
        //     return false;
        // }

        //const droppedItem = await Item.implementation.fromDropData(_data);          
        
        super._onDropActor(_event, _data)
    }

    /**
        * Aktiveras om man klickat på något för att slå ett tärningsslag. Saknas slaget man skickar in får man ett felmeddelande.
        * Finns flera olika typer av tärningsslag man kan slå (source):
        * [attribute], [skill], [mystery], [spell], [weapon], [initiative]
        * @param event
    */
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

        if (dataset.source == "vandning") {
            let bonus = 0;
            
            if (CalculateHelper.isNumeric(dataset.bonus)) {
                bonus = parseInt(dataset.bonus);
            }
             
            DialogHelper.VandningDialog(this.actor, bonus);
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

        return;
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
                // TODO: ja vad göra nu?
                return;
            }
            
            let gruppData = game.EON.djur.varelsemall['ingen'];

            if (grupp.value != "") {
                gruppData = game.EON.djur.varelsemall[grupp.value];
                gruppData.typ = grupp.value;
            }  

            let mallData = game.EON.djur.variant['ingen'];

            if (mall.value != "") {
                mallData = game.EON.djur.variant[mall.value];
            }

            if ((actorData.name == '') && (mallData.namn != '')) {
                actorData.name = mallData.namn;
            }
            
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

                let mallExists = (mallData.harleddegenskaper?.[egenskap] == undefined) ? false : true;
                let mallVarde = false;
                let gruppExists = (gruppData.harleddegenskaper?.[egenskap] == undefined) ? false : true;
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

                    //actorData.system.harleddegenskaper[egenskap] = mall + grupp;
                    actorData.system.harleddegenskaper[egenskap].varde = mall + grupp;
                    actorData.system.harleddegenskaper[egenskap].totalt = mall + grupp;
                }
            }

            actorData.system.strid.aterhamtning = gruppData.strid.aterhamtning;

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

        const itemid = await ItemHelper.CreateItem(this.actor, event);

		if (!itemid) {
            ui.notifications.error("Typen som skall skapas saknar funktion");
        }
        else {
            const item = await this.actor.getEmbeddedDocument("Item", itemid);
            var _a;

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