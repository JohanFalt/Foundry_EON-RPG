import { DiceRollContainer } from "../dice-helper.js";
import DiceHelper from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class AttributeRoll {
    constructor(actor, type, key, title) {
        this.tarningar = actor.system[type][key].totalt;
        this.grundTarning = this.tarningar.tvarde;
        this.grundBonus = this.tarningar.bonus;
        this.totalTarning = this.tarningar.tvarde;
        this.totalBonus = this.tarningar.bonus;

        this.bonusLista = actor.system[type][key].bonuslista;        
        this.namn = actor.name;
        this.title = title;
        this.type = type;
        this.key = key;
        this.attributenamn = "";
        this.close = false;
    }
}

export class DialogAttributeRoll extends FormApplication {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
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

        this.options.title = `${actor.name} - ${roll.namn}`;
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-roll.html";
	}     

    getData() {
        const data = super.getData();

        if (data.object.title == "") {
            data.object.namn = CONFIG.EON[data.object.type][data.object.key].namn;
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
                    this.object.totalTarning += 1;
                }
                else {
                    if (this.object.totalBonus == 3) {
                        this.object.totalTarning += 1;
                        this.object.totalBonus = 0;
                    }
                    else {
                        this.object.totalBonus += 1;
                    }                    
                }
            }
            if (dataset?.action == "remove") {
                if (value == "1T6") {
                    if (this.object.totalTarning > 0) {
                        this.object.totalTarning -= 1;
                    }
                }
                else {
                    if ((this.object.totalBonus == -1) && (this.object.totalTarning > 0)) {
                        this.object.totalTarning -= 1;
                        this.object.totalBonus = 3;
                    }
                    else if ((this.object.totalTarning == 0) && (this.object.totalBonus == 0)) {
                        // gör inget alls
                    }
                    else {
                        this.object.totalBonus -= 1;
                    }                   
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

        if ((this.object.totalTarning != this.object.grundTarning) || (this.object.totalBonus != this.object.grundBonus)) {
            if (this.object.grundBonus == 0) {
                info.push("Basvärde: Ob " + this.object.grundTarning + "T6");
            }
            else if (this.object.grundBonus > 0) {
                info.push("Basvärde: Ob " + this.object.grundTarning + "T6+" + this.object.grundBonus);
            }
            else {
                info.push("Basvärde: Ob " + this.object.grundTarning + "T6-" + this.object.grundBonus);
            }            
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.grundegenskap;
        roll.action = this.object.namn;
        roll.number = this.object.totalTarning;
        roll.bonus = this.object.totalBonus;

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        roll.info = info;

        const result = await RollDice(roll);
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    
}

export class SkillRoll {
    constructor(item) {
        this.typ = "skill";
        this.grundTarning = item.system.varde["tvarde"];
        this.grundBonus = item.system.varde["bonus"];
        this.totalTarning = item.system.varde["tvarde"];
        this.totalBonus = item.system.varde["bonus"];
        this.svarighet = "";
        this.namn = item.name;
        this.hantverk = item.system["hantverk"];
        this.kannetecken = item.system["kannetecken"];
        this.expertis = item.system["expertis"];
        this.close = false;
    }
}

export class DialogSkillRoll extends FormApplication {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
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
        //this.options.title = `${actor.name}`;        
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
                    this.object.totalTarning += 1;
                }
                else {
                    if (this.object.totalBonus == 3) {
                        this.object.totalTarning += 1;
                        this.object.totalBonus = 0;
                    }
                    else {
                        this.object.totalBonus += 1;
                    }                    
                }
            }
            if (dataset?.action == "remove") {
                if (value == "1T6") {
                    if (this.object.totalTarning > 0) {
                        this.object.totalTarning -= 1;
                    }
                }
                else {
                    if ((this.object.totalBonus == -1) && (this.object.totalTarning > 0)) {
                        this.object.totalTarning -= 1;
                        this.object.totalBonus = 3;
                    }
                    else if ((this.object.totalTarning == 0) && (this.object.totalBonus == 0)) {
                        // gör inget alls
                    }
                    else {
                        this.object.totalBonus -= 1;
                    }                   
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

        if (this.object.hantverk) {
            info.push("Hantverk");
        }
        if (this.object.kannetecken) {
            info.push("Kännetecken");
        }
        if (this.object.expertis) {
            info.push("Expertis");
        }

        if ((this.object.totalTarning != this.object.grundTarning) || (this.object.totalBonus != this.object.grundBonus)) {
            if (this.object.grundBonus == 0) {
                info.push("Basvärde: Ob " + this.object.grundTarning + "T6");
            }
            else if (this.object.grundBonus > 0) {
                info.push("Basvärde: Ob " + this.object.grundTarning + "T6+" + this.object.grundBonus);
            }
            else {
                info.push("Basvärde: Ob " + this.object.grundTarning + "T6-" + this.object.grundBonus);
            }            
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.fardighet;
        roll.action = this.object.namn;
        roll.number = parseInt(this.object.totalTarning);
        roll.bonus = parseInt(this.object.totalBonus);

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        roll.info = info;        

        const result = await RollDice(roll);
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}

export class MysteryRoll {
    constructor(item) {
        this.typ = "mystery";
        this.namn = item.name;
        this.moment = item.system.moment;
        this.magnitud = item.system.magnitud;
        this.close = false;
    }
}

export class DialogMysteryRoll extends FormApplication {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
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
        //this.options.title = `${actor.name}`;        
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

        for (const diceroll of this.object.moment) {
            const roll = new DiceRollContainer(this.actor, this.config);
            roll.typeroll = CONFIG.EON.slag.fardighet;
            roll.action = game.EON.fardigheter.mystik[diceroll.fardighet].namn;

            let grundTarning = 0;
            let grundBonus = 0;

            for (const item of this.actor.system.listdata.fardigheter.mystik) {
                if (item.system.id == diceroll.fardighet) {
                    grundTarning = item.system.varde.tvarde;
                    grundBonus = item.system.varde.bonus;
                    break;
                }
            }

            var info = [];

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

        //roll.typeroll = CONFIG.EON.slag.mysterium;

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    
}