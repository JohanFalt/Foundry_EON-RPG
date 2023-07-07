import { DiceRollContainer } from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class AttributeRoll {
    constructor(actor, type, key, title) {
        this.grundTarning = parseInt(actor.system[type][key].tvarde);
        this.grundBonus = parseInt(actor.system[type][key].bonus);
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
            resizable: true
        });
    }

    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;   
        this.isDialog = true;  

        this.options.title = `${actor.name}`;        
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
    _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.grundegenskap;
        roll.action = this.object.namn;
        roll.number = parseInt(this.object.grundTarning);
        roll.bonus = parseInt(this.object.grundBonus);
        const result = RollDice(roll);

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}

export class SkillRoll {
    constructor(item) {
        this.grundTarning = item.system.varde["tvarde"];
        this.grundBonus = item.system.varde["bonus"];
        this.namn = item.system["namn"];
        this.close = false;
    }
}

export class DialogSkillRoll extends FormApplication {

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
        this.isDialog = true;  
        this.options.title = `${actor.name}`;        
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
    _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.fardighet;
        roll.action = this.object.namn;
        roll.number = parseInt(this.object.grundTarning);
        roll.bonus = parseInt(this.object.grundBonus);
        const result = RollDice(roll);

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}