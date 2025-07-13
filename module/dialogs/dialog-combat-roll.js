import { DiceRollContainer } from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class CombatRoll {
    constructor(actor) {
        this.actorid = actor._id;
        this.grundInitiativ = parseInt(actor.system.harleddegenskaper.initiativ.totalt.tvarde);
        this.bonusInitiativ = parseInt(actor.system.harleddegenskaper.initiativ.totalt.bonus);

        this.isdistance = false;
        this.isclose = false;
        this.ismystic = false;
        this.isother = false;
        this.canroll = false;
        this.canclose = false;
    }
}

export class DialogCombat extends FormApplication {
    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor; 
        this.config = game.EON.CONFIG;    
        this.isDialog = true;  
        this.options.title = `${actor.name}`;
    }

    static get defaultOptions() {
        //let mode = (game.settings.get('core', 'uiConfig').colorScheme.applications == "dark" ? " wod-theme-dark " : " wod-theme-light ");
        let mode = " wod-theme-light ";

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog" + mode],
            template: "systems/eon-rpg/templates/dialogs/dialog-combat-roll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true
        });
    }

    async getData() {
        const data = super.getData();

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.mode')
            .click(this._setMode.bind(this));

        html
            .find('.initiativebutton')
            .click(this._rollInitiative.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    }    

    async _updateObject(event, formData) {
        if (this.object.canclose) {
            let token = await canvas.tokens.placeables.find(t => t.data.actorId === this.object.actorid);

            if(token) {
                await this._clearIcon(token);
            }

            this.close();
            return;
        }

        event.preventDefault();    
    }

    async _setMode(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
        const type = dataset.type;

        this.object.isdistance = false;
        this.object.isclose = false;
        this.object.ismystic = false;
        this.object.isother = false;
        this.object.canroll = false;

        if (type == "initiative_distance") {
            this.object.isdistance = true;
            this.object.canroll = true;
        }
        if (type == "initiative_close") {
            this.object.isclose = true;
            this.object.canroll = true;
        }
        if (type == "initiative_mystic") {
            this.object.ismystic = true;
            this.object.canroll = true;
        }
        if (type == "initiative_other") {
            this.object.isother = true;     
            this.object.canroll = true;       
        }

        let token = await canvas.tokens.placeables.find(t => t.data.actorId === this.object.actorid);

        if(token) {
            await this._clearIcon(token);
            await token.document.toggleActiveEffect(await this._getEffectData(type));
        }

        this.render();
    }

    async _clearIcon(token) {
        if (token.document.hasStatusEffect("initiative_distance")) {
            await token.document.toggleActiveEffect(await this._getEffectData("initiative_distance"));
        }
        if (token.document.hasStatusEffect("initiative_close")) {
            await token.document.toggleActiveEffect(await this._getEffectData("initiative_close"));
        }
        if (token.document.hasStatusEffect("initiative_mystic")) {
            await token.document.toggleActiveEffect(await this._getEffectData("initiative_mystic"));
        }
        if (token.document.hasStatusEffect("initiative_other")) {
            await token.document.toggleActiveEffect(await this._getEffectData("initiative_other"));
        }
    }

    async _getEffectData(type) {
        let effectData = "";

        if (type == "initiative_distance") {
            effectData = {
                id: type,
                label: "",
                icon: "systems/eon-rpg/assets/img/icons/bowman.svg"
            }
        }
        if (type == "initiative_close") {
            effectData = {
                id: type,
                label: "",
                icon: "systems/eon-rpg/assets/img/icons/swordman.svg"
            }
        }
        if (type == "initiative_mystic") {
            effectData = {
                id: type,
                label: "",
                icon: "systems/eon-rpg/assets/img/icons/magic-swirl.svg"
            }
        }
        if (type == "initiative_other") {
            effectData = {
                id: type,
                label: "",
                icon: "systems/eon-rpg/assets/img/icons/shrug.svg"
            }
        }

        return effectData;
    }

    async _rollInitiative(event) {
        this.object.canclose = false;

        event.preventDefault();		

		let foundToken = false;
		let foundEncounter = true;
		let token = await canvas.tokens.placeables.find(t => t.data.actorId === this.object.actorid);

		if(token) {
            foundToken = true;
        } 

		if (game.combat == null) {
			foundEncounter = false;
	   	}

        if (!foundToken) {
            ui.notifications.error(`Kunde inte hitta ${this.actor.name} token`);
            return;
        }
        if (!foundEncounter) {
            ui.notifications.error(`Finns ingen startad strid i Foundry`);
            return;
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.number = parseInt(this.object.grundInitiativ);
        roll.bonus = parseInt(this.object.bonusInitiativ);
        let result = parseInt(await RollDice(roll));

		if ((foundToken) && (foundEncounter)) {
			if (!this._inTurn(token)) {
				await token.document.toggleCombatant();
            }

            await token.combatant.update({initiative: result});
		}		
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.canclose = true;
    }    
    
    _inTurn(token) {
        for (let count = 0; count < game.combat.combatants.size; count++) {
            if (token.id == game.combat.combatants.contents[count].token.id) {
                return true;
            }
        }
    
        return false;
    }
}