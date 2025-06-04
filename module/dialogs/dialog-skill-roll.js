import { DiceRollContainer } from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class AttributeRoll {

    #_totalTarning = 0;
    #_totalBonus = 0;
    #_grundTarning = 0;
    #_grundBonus = 0;
    #_tarningar;

    #_harBelastning = false;
    #_harSmarta = false;
    #_harSar = false;

    /**
        * Konstruktor
        * @param actor - the actual actor in question
        * @param type - what type of attribute
        * @param key - what attribute
        * @param title - title of the roll
    */
    constructor(actor, type, key, title) {
        this.actor = actor;
        this.namn = actor.name;
        this.title = title;
        this.type = type;
        this.key = key;
        this.close = false;

        if ((type == "harleddegenskaper") && ((key == "forflyttning") || (key == "reaktion"))) {
            if ((actor.system.berakning?.belastning?.totaltavdrag?.tvarde > 0) || (actor.system.berakning?.belastning?.totaltavdrag?.bonus > 0)) {
                this.#_harBelastning = true;
            }            
        }
        
        if ((type == "harleddegenskaper") && ((key == "forflyttning") || (key == "kroppsbyggnad") || (key == "reaktion") || (key == "vaksamhet"))) {
            if (actor.system.berakning?.svarighet?.smarta > 0) {
                this.#_harSmarta = true;
            }            
        }

        if (((type == "harleddegenskaper") && (key == "forflyttning")) || (title == "Chockslag") || (title == "Dödsslag")) {
            if (this.hamtaAntalSar > 0) {
                this.#_harSar = true;
            }
        }

        this.#_tarningar = actor.system[type][key].totalt;
        this.#_grundTarning = this.#_tarningar.tvarde;
        this.#_grundBonus = this.tarningar.bonus;
        this.#_totalTarning = this.#_tarningar.tvarde;
        this.#_totalBonus = this.#_tarningar.bonus;        
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        if (this.#_harBelastning) {
            tarning.tvarde = tarning.tvarde - this.actor.system.berakning.belastning.totaltavdrag.tvarde;
            tarning.bonus = tarning.bonus - this.actor.system.berakning.belastning.totaltavdrag.bonus;

            if (tarning.bonus < -1) {
                tarning.tvarde -= 1;
                tarning.bonus = tarning.bonus + 3;               
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }
        }

        if (this.#_harSmarta) {
            tarning.tvarde = tarning.tvarde - this.actor.system.berakning.svarighet.smarta;

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }  
        }

        if (this.#_harSar) {
            if ((this.title == "Chockslag") || (this.title == "Dödsslag")) {
                tarning.tvarde = tarning.tvarde - this.actor.system.berakning.svarighet.antalsar;
            }
            else {
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.hogerben;
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.vansterben;
            }                

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }     
        }

        return tarning;
    }

    get grundTarning() {
        return this.#_grundTarning;
    }

    get grundBonus() {
        return this.#_grundBonus;
    }

    get tarningar() {
        return this.#_tarningar;
    }

    get totalTarning() {
        return this.#_totalTarning;
    }

    get totalBonus() {
        return this.#_totalBonus;
    }

    get harBelastning() {
        return this.#_harBelastning;
    }

    get harSmarta() {
        return this.#_harSmarta;
    }

    get harSar() {
        return this.#_harSar;
    }

    get hamtaAntalSar() {
        if ((this.actor.type.toLowerCase().replace(" ", "") != "rollperson") && (this.actor.type.toLowerCase().replace(" ", "") != "rollperson5")) {
            return 0;
        }

        if ((this.title == "Chockslag") || (this.title == "Dödsslag")) {
            return this.actor.system.berakning.svarighet.antalsar;
        }

        return this.actor.system.skada?.sar?.hogerben + this.actor.system.skada.sar.vansterben;
    }

    addTicToTarning() {
        if (this.#_totalBonus == 3) {
            this.#_totalTarning += 1;
            this.#_totalBonus = 0;
        }
        else {
            this.#_totalBonus += 1;
        }
    }

    addDiceToTarning() {
        this.#_totalTarning += 1;
    }

    removeTicToTarning() {
        if ((this.#_totalBonus == -1) && (this.#_totalTarning > 0)) {
            this.#_totalTarning -= 1;
            this.#_totalBonus = 3;
        }
        else if ((this.#_totalTarning == 0) && (this.#_totalBonus == 0)) {
            // gör inget alls
        }
        else {
            this.#_totalBonus -= 1;
        }
    }

    removeDiceToTarning() {
        if (this.#_totalTarning > 0) {
            this.#_totalTarning -= 1;
        }
    }
}

export class DialogAttributeRoll extends FormApplication {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog"],
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: false
        });
    }

    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;   
        this.isDialog = true;  
        
        let headline = "";
        
        if (roll.type != "skada") {
            headline = game.EON.CONFIG[roll.type][roll.key].namn;
        }
        else {
            headline = actor.system[roll.type][roll.key].namn;
        }

        this.options.title = `Slå ${headline}`;
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-roll.html";
	}     

    getData() {
        const data = super.getData();

        if (data.object.title == "") {
            if (data.object.type != "skada") {
                data.object.namn = game.EON.CONFIG[data.object.type][data.object.key].namn.toLowerCase();
            }
            else {
                data.object.namn = this.actor.system[data.object.type][data.object.key].namn.toLowerCase();
            }
        }
        else {
            data.object.namn = this.object.title;
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.eventbutton')
            .click(this._eventclick.bind(this));

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    }

    async _updateObject(event, formData) {
        if (this.object.close) {
            this.close();
            return;
        }

        event.preventDefault();    
    }

    /* something happened on the sheet */
    _eventclick(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset?.source == "bonus") {
            let value = dataset.value;

            if (dataset?.action == "add") {
                if (value == "1T6") {
                    this.object.addDiceToTarning();
                }
                else {
                    this.object.addTicToTarning();  
                }
            }
            if (dataset?.action == "remove") {
                if (value == "1T6") {
                    this.object.removeDiceToTarning();
                }
                else {
                    this.object.removeTicToTarning();      
                }
            }
        }
        if (dataset?.source == "difficulty") {
            var e = document.getElementById("difficulty");
            let value = "";

            if (dataset.value != "clear") {
                value = e.value + dataset.value;
            }            

            this.object.svarighet = value;
        }

        this.render();
    }

    /* clicked to roll */
    async _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        var info = [];
        var grundvarde = "";
        var visadeTarningar = this.object.visaTarning;
        var description = "";

        if (this.object.harBelastning) {
            if (this.actor.system.berakning.belastning.totaltavdrag.bonus == 0) {
                description += `${this.actor.system.berakning.belastning.totaltavdrag.tvarde}T6 belastning<br />`;
            }
            else if (this.actor.system.berakning.belastning.totaltavdrag.bonus > 0) {
                description += `${this.actor.system.berakning.belastning.totaltavdrag.tvarde}T6+${this.actor.system.berakning.belastning.totaltavdrag.bonus} belastning<br />`;
            }
            else {
                description += `${this.actor.system.berakning.belastning.totaltavdrag.tvarde}T6-${this.actor.system.berakning.belastning.totaltavdrag.bonus} belastning<br />`;
            }            
        }

        if (this.object.harSmarta) {
            description += `${this.actor.system.berakning.svarighet.smarta}T6 smärta<br />`;
        }

        if (this.object.harSar) {
            if ((this.object.title == "Chockslag") || (this.object.title == "Dödsslag")) {
                description += `Har ${this.actor.system.berakning.svarighet.antalsar} sår i kroppen (${this.actor.system.berakning.svarighet.antalsar}T6)<br />`;
            }
            else {
                if (this.actor.system.skada.sar.hogerben > 0) {
                    description += `Har ${this.actor.system.skada.sar.hogerben} sår i höger ben (${this.actor.system.skada.sar.hogerben}T6)<br />`;
                }
                if (this.actor.system.skada.sar.vansterben > 0) {
                    description += `Har ${this.actor.system.skada.sar.vansterben} sår i vänster ben (${this.actor.system.skada.sar.vansterben}T6)<br />`;
                }
            }                
        }

        if ((visadeTarningar.tvarde != this.object.grundTarning) || (visadeTarningar.bonus != this.object.grundBonus)) {
            if (this.object.grundBonus == 0) {
                grundvarde = `${this.object.grundTarning}T6`;
            }
            else if (this.object.grundBonus > 0) {
                grundvarde = `${this.object.grundTarning}T6+${this.object.grundBonus}`;
            }
            else {
                grundvarde = `${this.object.grundTarning}T6${this.object.grundBonus}`;
            }            
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.grundegenskap;
        roll.action = this.object.namn;
        roll.number = visadeTarningar.tvarde;
        roll.bonus = visadeTarningar.bonus;

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        roll.info = info;
        roll.description = description;
        roll.grundvarde = grundvarde;

        const result = await RollDice(roll);
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    
}

export class SkillRoll {

    #_totalTarning = 0;
    #_totalBonus = 0;
    #_grundTarning = 0;
    #_grundBonus = 0;

    #_harBelastning = false;
    #_harSmarta = false;
    #_harSar = false;
    #_visaSar = false;

    /**
        * Konstruktor
        * @param item - skill to roll
        * @param actor - the actual actor in question        
    */
    constructor(item, actor) {
        if (item.type == "Färdighet") {

            if ((item.system.grupp == "rorelse") && (CONFIG.EON.settings.hinderenceSkillGroupMovement)) { 
                if ((actor.system.berakning.belastning.totaltavdrag.tvarde > 0) || (actor.system.berakning.belastning.totaltavdrag.bonus > 0)) {
                    this.#_harBelastning = true;
                }                
            }
            if ((item.system.attribut == "rorlighet") && (CONFIG.EON.settings.hinderenceAttributeMovement)) { 
                if ((actor.system.berakning.belastning.totaltavdrag.tvarde > 0) || (actor.system.berakning.belastning.totaltavdrag.bonus > 0)) {
                    this.#_harBelastning = true;
                }  
            }
        }

        if (item.type == "Färdighet") {
            if ((item.system.grupp == "rorelse") || (item.system.grupp == "mystik") || (item.system.grupp == "strid")) {
                if (actor.system.berakning.svarighet.smarta > 0) {
                    this.#_harSmarta = true;
                }
            }
        }

        if (item.type == "Färdighet") {
            if (actor.system.skada.sar == undefined) {
                this.#_harSar = false;
                this.#_visaSar = false;
            }
            else if (((actor.system.skada.sar.hogerben > 0) || (actor.system.skada.sar.vansterben > 0)) && (item.system.grupp == "rorelse")) {
                this.#_harSar = true;
                this.#_visaSar = true;
            }
            else if (((actor.system.skada.sar.hogerarm > 0) || (actor.system.skada.sar.vansterarm > 0)) && (item.system.grupp == "strid")) {
                this.#_visaSar = true;
            }
        } 

        this.#_grundTarning = item.system.varde["tvarde"];
        this.#_grundBonus = item.system.varde["bonus"];
        this.#_totalTarning = item.system.varde["tvarde"];
        this.#_totalBonus = item.system.varde["bonus"];

        this.close = false;
        this.actor = actor;
        this.typ = "skill";
        this.grupp = item.system.grupp;

        this.namn = item.name;
        this.svarighet = "";
        this.namn = item.name;
        this.hantverk = item.system["hantverk"];
        this.kannetecken = item.system["kannetecken"];
        this.expertis = item.system["expertis"];   
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        if (this.#_harBelastning) {
            tarning.tvarde = tarning.tvarde - this.actor.system.berakning.belastning.totaltavdrag.tvarde;
            tarning.bonus = tarning.bonus - this.actor.system.berakning.belastning.totaltavdrag.bonus;

            if (tarning.bonus < -1) {
                tarning.tvarde -= 1;
                tarning.bonus = tarning.bonus + 3;               
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }
 
        }

        if (this.#_harSmarta) {
            tarning.tvarde = tarning.tvarde - this.actor.system.berakning.svarighet.smarta;

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }       
        }

        if (this.#_harSar) {
            if (this.grupp == "rorelse") {
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.hogerben;
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.vansterben;
            }         
            if (this.grupp == "strid") {
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.hogerarm;
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.vansterarm;
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }   
        }

        return tarning;
    }

    get grundTarning() {
        return this.#_grundTarning;
    }

    get grundBonus() {
        return this.#_grundBonus;
    }

    get totalTarning() {
        return this.#_totalTarning;
    }

    get totalBonus() {
        return this.#_totalBonus;
    }

    get harBelastning() {
        return this.#_harBelastning;
    }

    get harSmarta() {
        return this.#_harSmarta;
    }

    get harSar() {
        return this.#_harSar;
    }

    set harSar(aktiv) {
        this.#_harSar = aktiv;
    }

    get visaSar() {
        return this.#_visaSar;
    }

    get hamtaAntalSar() {
        return this.actor.system.skada.sar.hogerarm + this.actor.system.skada.sar.vansterarm;
    }

    addTicToTarning() {
        if (this.#_totalBonus == 3) {
            this.#_totalTarning += 1;
            this.#_totalBonus = 0;
        }
        else {
            this.#_totalBonus += 1;
        }
    }

    addDiceToTarning() {
        this.#_totalTarning += 1;
    }

    removeTicToTarning() {
        if ((this.#_totalBonus == -1) && (this.#_totalTarning > 0)) {
            this.#_totalTarning -= 1;
            this.#_totalBonus = 3;
        }
        else if ((this.#_totalTarning == 0) && (this.#_totalBonus == 0)) {
            // gör inget alls
        }
        else {
            this.#_totalBonus -= 1;
        }
    }

    removeDiceToTarning() {
        if (this.#_totalTarning > 0) {
            this.#_totalTarning -= 1;
        }
    }
}

export class DialogSkillRoll extends FormApplication {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog"],
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: false
        });
    }

    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;      
        this.isDialog = true;  
        this.options.title = `Slå ${roll.namn.toLowerCase()}`;
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-skill-roll.html";
	}  

    getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.eventbutton')
            .click(this._eventclick.bind(this));

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    }

    async _updateObject(event, formData) {
        if (this.object.close) {
            this.close();
            return;
        }

        event.preventDefault();    
    }

    /* something happened on the sheet */
    _eventclick(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset?.source == "set") {
            this.object[dataset.value] = !this.object[dataset.value];
        }
        if (dataset?.source == "bonus") {
            let value = dataset.value;

            if (dataset?.action == "add") {
                if (value == "1T6") {
                    this.object.addDiceToTarning();
                }
                else {
                    this.object.addTicToTarning();
                }
            }
            if (dataset?.action == "remove") {
                if (value == "1T6") {
                    this.object.removeDiceToTarning();
                }
                else {
                    this.object.removeTicToTarning();
                }
            }
        }
        if (dataset?.source == "difficulty") {
            var e = document.getElementById("difficulty");
            let value = "";

            if (dataset.value != "clear") {
                value = e.value + dataset.value;
            }            

            this.object.svarighet = value;
        }

        this.render();
    }

    /* clicked to roll */
    async _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        var info = [];
        let description = "";

        if (this.object.hantverk) {
            info.push("Hantverk");
        }
        if (this.object.kannetecken) {
            info.push("Kännetecken");
        }
        if (this.object.expertis) {
            info.push("Expertis");
        }

        if (this.object.harBelastning) {
            if (this.actor.system.berakning.belastning.totaltavdrag.bonus == 0) {
                description += `${this.actor.system.berakning.belastning.totaltavdrag.tvarde}T6 belastning</br >`;
            }
            else if (this.actor.system.berakning.belastning.totaltavdrag.bonus > 0) {
                description += `${this.actor.system.berakning.belastning.totaltavdrag.tvarde}T6+${this.actor.system.berakning.belastning.totaltavdrag.bonus} belastning</br >`;
            }
            else {
                description += `${this.actor.system.berakning.belastning.totaltavdrag.tvarde}T6-${this.actor.system.berakning.belastning.totaltavdrag.bonus} belastning</br >`;
            } 
        }

        if (this.object.harSmarta) {
            description += `${this.actor.system.berakning.svarighet.smarta}T6 smärta</br >`;
        }

        if (this.object.harSar) {
            if ((this.actor.system.skada.sar.hogerben > 0) && (this.object.grupp == "rorelse")) {
                description += `Har ${this.actor.system.skada.sar.hogerben} sår i höger ben (${this.actor.system.skada.sar.hogerben}T6)<br />`;
            }
            if ((this.actor.system.skada.sar.vansterben > 0) && (this.object.grupp == "rorelse")) {
                description += `Har ${this.actor.system.skada.sar.vansterben} sår i vänster ben (${this.actor.system.skada.sar.vansterben}T6)<br />`;
            }
            if ((this.actor.system.skada.sar.hogerarm > 0) && (this.object.grupp == "strid")) {
                description += `Har ${this.actor.system.skada.sar.hogerarm} sår i höger arm (${this.actor.system.skada.sar.hogerarm}T6)<br />`;
            }
            if ((this.actor.system.skada.sar.vansterarm > 0) && (this.object.grupp == "strid")) {
                description += `Har ${this.actor.system.skada.sar.vansterarm} sår i vänster arm (${this.actor.system.skada.sar.vansterarm}T6)<br />`;
            }
        }
        if ((this.object.visaSar) && (!this.object.harSar)) {
            if ((this.actor.system.skada.sar.hogerben > 0) && (this.object.grupp == "rorelse")) {
                description += `Ignorerar ${this.actor.system.skada.sar.hogerben} sår i höger ben<br />`;
            }
            if ((this.actor.system.skada.sar.vansterben > 0) && (this.object.grupp == "rorelse")) {
                description += `Ignorerar ${this.actor.system.skada.sar.vansterben} sår i vänster ben<br />`;
            }
            if ((this.actor.system.skada.sar.hogerarm > 0) && (this.object.grupp == "strid")) {
                description += `Ignorerar ${this.actor.system.skada.sar.hogerarm} sår i höger arm<br />`;
            }
            if ((this.actor.system.skada.sar.vansterarm > 0) && (this.object.grupp == "strid")) {
                description += `Ignorerar ${this.actor.system.skada.sar.vansterarm} sår i vänster arm<br />`;
            }
        }

        var grundvarde = "";

        if ((this.object.visaTarning.tvarde != this.object.grundTarning) || (this.object.visaTarning.bonus != this.object.grundBonus)) {
            if (this.object.grundBonus == 0) {
                grundvarde = `${this.object.grundTarning}T6`;
            }
            else if (this.object.grundBonus > 0) {
                grundvarde = `${this.object.grundTarning}T6+${this.object.grundBonus}`;
            }
            else {
                grundvarde = `${this.object.grundTarning}T6-${this.object.grundBonus}`;
            }            
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.fardighet;
        roll.action = this.object.namn;
        roll.number = this.object.visaTarning.tvarde;
        roll.bonus = this.object.visaTarning.bonus;

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        roll.info = info;      
        roll.description = description;
        roll.grundvarde = grundvarde;  

        const result = await RollDice(roll);
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}

export class MysteryRoll {

    #_harSmarta = false;

    constructor(item, actor) {
        this.typ = "mystery";
        this.namn = item.name;
        this.moment = item.system.moment;
        this.magnitud = item.system.magnitud;
        this.close = false;
        this.actor = actor;

        if (actor.system.berakning.svarighet.smarta > 0) {
            this.#_harSmarta = true;
        }      
    }

    get harSmarta() {
        return this.#_harSmarta;
    }
}

export class DialogMysteryRoll extends FormApplication {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog"],
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true
        });
    }

    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;     
        this.EON = game.EON; 
        this.isDialog = true;  
        this.options.title = `${actor.name} - ${roll.namn}`;        
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-skill-roll.html";
	}  

    getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    }

    async _updateObject(event, formData) {
        if (this.object.close) {
            this.close();
            return;
        }

        event.preventDefault();    
    }

    /* clicked to roll */
    async _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }        

        let success = true;
        var grundvarde = "";

        for (const diceroll of this.object.moment) {
            grundvarde = "";

            const roll = new DiceRollContainer(this.actor, this.config);
            roll.typeroll = CONFIG.EON.slag.fardighet;

            if (this.actor.system.installningar.eon === "eon4") {
                roll.action = game.EON.fardigheter.mystik[diceroll.fardighet].namn;
            }
            else if (this.actor.system.installningar.eon === "eon5") {
                roll.action = game.EON.fardigheter5.mystik[diceroll.fardighet].namn;
            }

            let grundTarning = 0;
            let grundBonus = 0;

            for (const item of this.actor.system.listdata.fardigheter.mystik) {
                if (item.system.id == diceroll.fardighet) {
                    grundTarning = item.system.varde.tvarde - this.actor.system.berakning.svarighet.smarta;
                    grundBonus = item.system.varde.bonus;

                    if (grundTarning < 0) {
                        grundTarning = 0;
                        grundBonus = 0;
                    }

                    if ((grundTarning != item.system.varde.tvarde) || (grundBonus != item.system.varde.bonus)) {
                        if (item.system.varde.bonus == 0) {
                            grundvarde = `${item.system.varde.tvarde}T6`;
                        }
                        else if (item.system.varde.bonus > 0) {
                            grundvarde = `${item.system.varde.tvarde}T6+${item.system.varde.bonus}`;
                        }
                        else {
                            grundvarde = `${item.system.varde.tvarde}T6-${item.system.varde.bonus}`;
                        }            
                    }

                    break;
                }
            }

            var info = [];

            if (this.actor.system.berakning.svarighet.smarta > 0) {
                roll.description = `${this.actor.system.berakning.svarighet.smarta}T6 smärta</br >`;
            }

            roll.grundvarde = grundvarde; 

            roll.number = grundTarning;
            roll.bonus = grundBonus;
            roll.svarighet = parseInt(diceroll.svarighet);
            roll.info = info;    
            
            const result = await RollDice(roll);
    
            if (result < parseInt(diceroll.svarighet)) {
                console.log("failed: " + result);
            }
            else {
                console.log("success: " + result);
            }
        }        

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    
}