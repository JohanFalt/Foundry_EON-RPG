import ActorHelper from "../actor-helper.js";
import DialogHelper from "../dialog-helper.js";
import CreateHelper from "../create-helper.js";
import ItemHelper from "../item-helper.js";
import CalculateHelper from "../calculate-helper.js";
import SelectHelper from "../select-helpers.js"
import { SendMessage } from "../dice-helper.js";
import { datavaluta } from '../../packs/valuta.js';

export default class Eon5ActorSheet extends foundry.appv1.sheets.ActorSheet {

    /** @override */
    static get defaultOptions() {
        //let mode = (game.settings.get('core', 'uiConfig').colorScheme.applications == "dark" ? " wod-theme-dark " : " wod-theme-light ");
        let mode = " wod-theme-light ";

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON EON5 rollperson" + mode],
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
        this.isPC = true;
        this.isGM = game.user.isGM;	
        this.datavaluta = datavaluta;	

        // sortering
        this.sortState = {
            utrustning_foremal: { key: 'name', asc: true },
            abilities: { key: 'type', asc: false },
            spells: { key: 'level', asc: true }
        };
    }

    /** @override */
    get template() {
        let sheet = "rollperson5";

        if ((this.actor.system?.type != undefined)&&(this.actor.system?.type == "")){
            sheet = this.actor.system.type;
        }

        sheet = sheet.toLowerCase().replace(" ", "");
        return `systems/eon-rpg/templates/actors/${sheet}-sheet.html`;
    }

    /** @override */
    async getData() {
        /* let bok = "grund";
        // Lägg till grundrustning på kroppsdelarna
        if (CONFIG.EON.settings.bookCombat) {
            bok = "strid";
        } */

        const actorData = foundry.utils.duplicate(this.actor);	
        const version = game.data.system.version;	

        if (!actorData.system.installningar.skapad) {
            if (actorData.system.installningar.eon != "eon5") {
                actorData.system.installningar.eon = "eon5";
            } 

            await CreateHelper.SkapaFardigheter(this.actor, CONFIG.EON, version);
            await CreateHelper.SkapaKaraktarsdrag(actorData);
            await CreateHelper.SkapaKaraktarsdrag(actorData);
            const vapenlista = await ItemHelper.GetWeapon("narstridsvapen");
            await CreateHelper.SkapaNarstridsvapen(this.actor, "obevapnad", vapenlista, version, true);

            actorData.system.installningar.skapad = true;
            actorData.system.installningar.version = version;            
            await this.actor.update(actorData);
        }	
        else {
            await CalculateHelper.hanteraBerakningar(actorData);            
            await this.actor.update(actorData);
        }

        const data = await super.getData();	

        // sortering
        const sortList = (items, state) => {
            const { key, asc } = state || {};
            if (!key) return items;

            return items.sort((a, b) => {
                let valA = getProperty(a, key) ?? '';
                let valB = getProperty(b, key) ?? '';

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return asc ? -1 : 1;
                if (valA > valB) return asc ? 1 : -1;
                return 0;
            });
        };

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
        data.actor.system.listdata.religion = [];
        data.actor.system.listdata.religion.mysterie = [];
        data.actor.system.listdata.religion.avvisning = [];
        data.actor.system.listdata.magi = [];
        data.actor.system.listdata.magi.besvarjelse = [];
        data.actor.system.listdata.magi.kongelat = [];
        data.actor.system.listdata.magi.faltstorning = [];
        data.actor.system.listdata.utrustning = [];
        data.actor.system.listdata.utrustning.rustning = [];
        data.actor.system.listdata.utrustning.vapen = [];
        data.actor.system.listdata.utrustning.vapen.narstrid = [];
        data.actor.system.listdata.utrustning.vapen.avstand = [];
        data.actor.system.listdata.utrustning.vapen.skold = [];
        data.actor.system.listdata.utrustning.foremal = [];
        data.actor.system.listdata.kroppsdelar = [];
        data.actor.system.listdata.kroppsdelar = await CreateHelper.SkapaKroppsdelar(CONFIG.EON, version);
        data.actor.system.listdata.skador = [];
        data.actor.system.listdata.datavaluta = this.datavaluta;

        data.actor.system.listdata.valuta = [];
        data.actor.system.altvarde = [];

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
            if (item.type == "Mysterie") {
                data.actor.system.listdata.religion.mysterie.push(item);
            }
            if (item.type == "Avvisning") {
                data.actor.system.listdata.religion.avvisning.push(item);
            }
            if (item.type == "Besvärjelse") {
                data.actor.system.listdata.magi.besvarjelse.push(item);
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
                if (item.system.typ == "kongelat") {
                    data.actor.system.listdata.magi.kongelat.push(item);
                }                
                else {
                    data.actor.system.listdata.utrustning.foremal.push(item);
                }                

                if (item.system.installningar.buren) {
                    totalVikt += parseFloat(item.system.vikt) * parseFloat(item.system.antal);    
                    totalViktUtrustning += parseFloat(item.system.vikt) * parseFloat(item.system.antal);                 
                }
            }
            if (item.type == "Valuta") {
                data.actor.system.listdata.valuta.push(item);
                if (item.system.installningar.buren) {
                    totalVikt += parseFloat(item.system.vikt) * parseFloat(item.system.antal);    
                    totalViktUtrustning += parseFloat(item.system.vikt) * parseFloat(item.system.antal);                 
                }
            }
            if (item.type == "Skada") {    
                if (item.system.typ == "skada") {
                    data.actor.system.listdata.skador.push(item);
                }
                else if (item.system.typ == "faltstorning") {
                    data.actor.system.listdata.magi.faltstorning.push(item);
                }
            }
            // if ((item.type == "Folkslag") && (data.actor.system.bakgrund.folkslag == "custom")) {
            //     data.actor.system.altvarde.folkslag = item.name;
            // }            
        }

        for (const grupp in CONFIG.EON.fardighetgrupper) {
            data.actor.system.listdata.fardigheter[grupp] = data.actor.system.listdata.fardigheter[grupp].sort((a, b) => a.name.localeCompare(b.name));
        }

        data.actor.system.listdata.utrustning.vapen.narstrid = data.actor.system.listdata.utrustning.vapen.narstrid.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.vapen.avstand = data.actor.system.listdata.utrustning.vapen.avstand.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.vapen.skold = data.actor.system.listdata.utrustning.vapen.skold.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.rustning = data.actor.system.listdata.utrustning.rustning.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.utrustning.foremal = sortList(
            data.actor.system.listdata.utrustning.foremal,
            this.sortState.utrustning_foremal
        );

        data.actor.system.listdata.valuta = data.actor.items
            .filter(item => item.type === "Valuta")
            .sort((a, b) => a.name.localeCompare(b.name));

        // Beräkna utmattning och belastning
        data.actor.system.berakning = [];
        data.actor.system.berakning.utmattning = [];
        data.actor.system.berakning.utmattning.perrunda = this.actor.system.skada.blodning;
        data.actor.system.berakning.svarighet = [];
        data.actor.system.berakning.svarighet.smarta = this.actor.system.skada.smarta;   
        data.actor.system.berakning.svarighet.antalsar = 0; 
        
        for (const kroppsdel in this.actor.system.skada.sar) {
            data.actor.system.berakning.svarighet.antalsar += this.actor.system.skada.sar[kroppsdel];
        }
        
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
            data.actor.system.berakning.belastning.totaltavdrag = CalculateHelper.BeraknaBelastningAvdrag(totalVarde, actorData.system.installningar.eon);
        }
        else {
            data.actor.system.berakning.belastning.totaltavdrag = CalculateHelper.BeraknaBelastningAvdrag(data.actor.system.berakning.belastning.rustning, actorData.system.installningar.eon);
        }

        data.listData = SelectHelper.SetupActor(data.actor);
        data.enrichedBeskrivning = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.bakgrund.beskrivning);

        // sortering
        data.sheet = this;

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

        html
            .find(".item-delete")
            .click(this._onItemDelete.bind(this));

        html
            .find(".item-send")
            .click(this._onItemSend.bind(this));

        html
            .find('.weapon-count')
            .click(this._onWeaponCountChange.bind(this));

        html.find('.draggable').each((i, element) => {
            ActorHelper.HandleDragDrop(this, this.actor, html, element);
        }); 

        html.find('.sortable').click(ev => {
            const header = event.currentTarget;
            const key = header.dataset.sort;
            const listName = header.dataset.list;

            if (!key || !listName) return;

            const currentState = this.sortState[listName] || {};
            const isSameKey = currentState.key === key;
            const asc = isSameKey ? !currentState.asc : true;

            this.sortState[listName] = { key, asc };

            this.render(false);
        });
    }
 
    /** @override */
    /**
        * Aktiveras om Item släpps på rollformuläret.
        * @param _event
        * @param data - det släppta item
    */
    async _onDropItem(_event, _data) {
        if (!this.isEditable || !_data.uuid) {
            return false;
        }

        let update = false;
        let itemData = undefined;

        const droppedItem = await Item.implementation.fromDropData(_data);
        
        if ((droppedItem.type == "Utrustning") && (droppedItem.system.installningar.behallare) && (this.actor.type.toLowerCase().replace(" ", "") == "rollperson")) {
            itemData = foundry.utils.duplicate(droppedItem);            
            itemData.system.antal = parseInt(droppedItem.system.volym.antal);     
            update = true;       
        }  
        else if (droppedItem.type == "Folkslag") {
            ui.notifications.warn(`Folkslag kan inte läggas till denna typ av Actor '${this.actor.type}'.`);
            return false;
        }  
        
        if (droppedItem.system.installningar.eon !== "eon5") {           
            update = true;
        }

        if (update) {
            if (itemData == undefined) {
                itemData = foundry.utils.duplicate(droppedItem);            
            }
            itemData.system.installningar.eon = "eon5";
            await this.actor.createEmbeddedDocuments('Item', [itemData])
        }
    }

    /** @override */
    /**
        * Aktiveras om Actor släpps på rollformuläret.
        * @param _event
        * @param data - det släppta actor
    */
    async _onDropActor(_event, _data) {
        if (!this.isEditable || !_data.uuid) {
            return false;
        }

        const droppedItem = await Actor.implementation.fromDropData(_data);          
        
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

        if (dataset.source == "mystery") {
            DialogHelper.MysteryDialog(event, this.actor);
            return;
        }        

        if (dataset.source == "spell") {
            DialogHelper.SpellDialog(event, this.actor);
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

        if (dataset.type === "strid") {
            DialogHelper.AttributeEditDialog(this.actor, dataset.type, dataset.attribute);
            return;
        }
        else if (dataset.type == "attribute") {
            DialogHelper.AttributeEditDialog(this.actor, dataset.source, dataset.attribute);
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
        * Körs när någon egenskap blir ändrad.
        * @param _event
    */
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

            const item = await this.actor.getEmbeddedDocument("Item", itemid);
            const itemData = foundry.utils.duplicate(item);

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

    /**
        * Körs när något item blir aktiverat. Används främst när man klickar för ett föremål så det blir aktivt/buret/etc.
        * @param _event
    */
    async _onItemActive(event) {	
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
        const dataset = element.dataset;

        const itemid = dataset.itemid;
        const property = dataset.property;

        const item = await this.actor.getEmbeddedDocument("Item", itemid);
        const itemData = foundry.utils.duplicate(item);        
        
        let active = itemData.system.installningar[property];
        itemData.system.installningar[property] = !active;

        await item.update(itemData);                

        if (item.type == "Rustning") {
            const activeArmor = this.actor.items.filter(rustning => rustning.type === "Rustning" && rustning.system.installningar.buren && (rustning._id != item._id));

            for (const armor of activeArmor) {
                const otherItem = await this.actor.getEmbeddedDocument("Item", armor._id);
                const otheritemData = foundry.utils.duplicate(otherItem);
                otheritemData.system.installningar.buren = false;
                await otherItem.update(otheritemData);
            }
        }

        this.render();
    }

    /**
        * Körs när något item blir borttaget
        * @param _event
        * @return Boolean - om föremålet togs bort eller ej
    */
    async _onItemDelete(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
        const dataset = element.dataset;  
        const source = dataset.source;
        const index = Number(dataset.index);
        
        // gäller item i sig
        const performDelete = await new Promise((resolve) => {
            Dialog.confirm({
                title: "Tar bort " + source,
                yes: () => resolve(true),
                no: () => resolve(false),
                content: "Är du säker du vill ta bort " + source,
            });
        });

        if (!performDelete) {
            return false;
        }     

        const actorData = foundry.utils.duplicate(this.actor);
        actorData.system.egenskap[source].splice(index, 1);
        await this.actor.update(actorData);

        return true;
    }

    async _onItemSend(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemid = dataset.itemid;
        const item = await this.actor.getEmbeddedDocument("Item", itemid);

        const headline = `${item.name} (${item.type.toLowerCase()})`;
        const message = item.system.beskrivning;
        
        const enrichedMessage = await foundry.applications.ux.TextEditor.implementation.enrichHTML(`${message}`, { async: true });

        SendMessage(this.actor, CONFIG.EON, headline, enrichedMessage);        
    }

    /**
        * Körs när något blir ändrat på rollformuläret som kan få vidare effekt för andra saker. Att man t ex ställer in något på Skräddarsytt.
        * @param event
    */
    async _onsheetChange(event) {
        event.preventDefault();		

        if (await ActorHelper.OnsheetChange(event, this.actor) === true) {
            this.render();
        }        
    }

    /**
        * Funktion som säkerställer att alla rutor och boxar fylls i mer rätt grafik.
        * @param html
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

    /**
        * Körs när man klickar i en av cirklarna
        * @param _event
    */
    async _clickedCircle(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // om det var ett item
        if (dataset.itemid != undefined) {
            const itemid = dataset.itemid;
            const item = await this.actor.getEmbeddedDocument("Item", itemid);
            const itemData = foundry.utils.duplicate(item);
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

        const actorData = foundry.utils.duplicate(this.actor);
        steps.removeClass("active");

        if (type != undefined) {
            if (type == "karaktarsdrag") {
                let fields = dataset.name.split(".");
                let newvalue = Number(dataset.value);

                if (newvalue == 0) {
                    newvalue = 1;
                }
                else {
                    newvalue = 0;
                }

                if (fields.length == 2) {
                    const setting = fields[0];
                    const property = fields[1];
                    actorData.system.egenskap.karaktärsdrag[index][setting][property] = newvalue;
                }
                else {
                    const property = fields;
                    actorData.system.egenskap.karaktärsdrag[index][property] = newvalue;
                }    
                
                await this.actor.update(actorData);

                this.render();
                return;
            }
            else {
                if ((parseInt(actorData.system[fieldStrings][type][value]) == 1) && (parseInt(index) == 1)) {
                    actorData.system[fieldStrings][type][value] = 0;
                }
                else {
                    actorData.system[fieldStrings][type][value] = parseInt(index);
                }
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

    async _onWeaponCountChange(event) {
        event.preventDefault();
        
        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemId = dataset.itemid;
        const action = dataset.action;
        
        const item = this.actor.items.get(itemId);
        if (!item) return;

        const itemData = item.toObject();
        
        if (action === "increase") {
            itemData.system.antal += 1;
        } else if (action === "decrease" && itemData.system.antal > 0) {
            itemData.system.antal -= 1;
        }

        await item.update(itemData);
    }
}