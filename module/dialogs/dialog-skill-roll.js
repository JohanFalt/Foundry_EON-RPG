import { API_RollDice } from "/modules/eon-dice-roller/scripts/rollDice.js";

export class GeneralRoll {
    constructor(key, type) {
        this.canRoll = false;
        this.close = false;

        this.difficulty = 6;
        this.bonus = 0;
        this.key = key;
        this.type = type;
        this.name = "";

        this.attributeKey = "";
        this.attributeName = "";
        this.attributeValue = 0;

        this.abilityKey = "";
        this.abilityName = "";
        this.abilityValue = 0;

        this.useSpeciality = false;
        this.hasSpeciality = false;
        this.usepain = true;
        this.specialityText = "";

        this.sheettype = "";

        if (type == "attribute") {
            this.attributeKey = key;

            if (CONFIG.wod.attributeSettings == "20th") {                
                this.attributeName = game.i18n.localize(CONFIG.wod.attributes20[key]);
            }
            else if (CONFIG.wod.attributeSettings == "5th") {
                this.attributeName = game.i18n.localize(CONFIG.wod.attributes[key]);
            }

            this.name = this.attributeName;
        }
        else if (type == "ability") {
            this.abilityKey = key;
        }
        else if (type == "noability") {
            this.attributeKey = key;            
        }
        else if (type == "dice") {
            this.key = "dice";
            this.attributeValue = 3;
        }
    }
}

export class DialogGeneralRoll extends FormApplication {
    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.isDialog = true;  
        this.options.title = `${this.actor.name}`;        
    }

    /**
        * Extend and override the default options used by the 5e Actor Sheet
        * @returns {Object}
    */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["general-dialog"],
            template: "systems/worldofdarkness/templates/dialogs/dialog-generalroll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true
        });
    }

    async getData() {
        const data = super.getData();
        const attributeKey = data.object.attributeKey;
        const abilityKey = data.object.abilityKey;

        let attributeSpeciality = "";
        let abilitySpeciality = "";
        let specialityText = "";

        data.actorData = this.actor.system;   
        data.actorData.type = this.actor.type;
        data.config = CONFIG.wod;
        data.object.hasSpeciality = false; 
        data.object.specialityText = "";
        data.object.ignorepain = CombatHelper.ignoresPain(this.actor);
        data.object.usepain = !data.object.ignorepain;

        if (this.object.type == "attribute") {
            if (await BonusHelper.CheckAttributeBonus(this.actor, this.object.attributeKey)) {
                let bonus = await BonusHelper.GetAttributeBonus(this.actor, this.object.attributeKey);
                this.object.difficulty += parseInt(bonus);
            }
        }

        if (data.actorData.type != CONFIG.wod.sheettype.changingbreed) {
            data.object.sheettype = data.actorData.type.toLowerCase() + "Dialog";
        }
        else {
            data.object.sheettype = "werewolfDialog";
        }        

        if (data.object.type == "dice") {
            data.object.hasSpeciality = this.object.useSpeciality;
        }
        else {
            if (attributeKey != "") {
                if (data.object.type == "noability") {
                    if ((attributeKey == "conscience") || (attributeKey == "selfcontrol") || (attributeKey == "courage")) {
                        data.object.attributeName = game.i18n.localize(data.actorData.advantages.virtues[attributeKey].label);
                        data.object.attributeValue = parseInt(data.actorData.advantages.virtues[attributeKey].roll);
                        data.object.name = data.object.attributeName; 
                    }
                    else {
                        if ((attributeKey == "willpower") && (CONFIG.wod.attributeSettings == "5th")) {
                            if (parseInt(data.actorData.attributes?.composure.value) >= 4) {
                                data.object.hasSpeciality = true;
                                attributeSpeciality = data.actorData.attributes.composure.speciality;
                            }
            
                            if ((parseInt(data.actorData.attributes?.resolve.value) >= 4) && (data.actorData.attributes?.resolve.speciality != "")) {
                                data.object.hasSpeciality = true;
    
                                if (attributeSpeciality != "") {
                                    attributeSpeciality += ", ";
                                }
    
                                attributeSpeciality += data.actorData.attributes.resolve.speciality;
                            }                        
                        }  
    
                        data.object.attributeName = game.i18n.localize(data.actorData.advantages[attributeKey].label);
                        data.object.attributeValue = parseInt(data.actorData.advantages[attributeKey].roll);                    
                        data.object.name = data.object.attributeName; 
                    }         
                }            
                else {
                    data.object.attributeValue = parseInt(data.actorData.attributes[attributeKey].total);

                    if (parseInt(data.actorData.attributes[attributeKey].value) >= 4) {
                        data.object.hasSpeciality = true;
                        attributeSpeciality = data.actorData.attributes[attributeKey].speciality;
                    }
                }
            }

            if (abilityKey != "") {
                let ability = undefined;

                if ((data.actorData.abilities.talent[abilityKey] != undefined) && (data.actorData.abilities.talent[abilityKey].isvisible)) {
                    ability = data.actorData.abilities.talent[abilityKey];
                    ability.issecondary = false;
                }
                else if ((data.actorData.abilities.skill[abilityKey] != undefined) && (data.actorData.abilities.skill[abilityKey].isvisible)) {
                    ability = data.actorData.abilities.skill[abilityKey];
                    ability.issecondary = false;
                }
                else if ((data.actorData.abilities.knowledge[abilityKey] != undefined) && (data.actorData.abilities.knowledge[abilityKey].isvisible)) {
                    ability = data.actorData.abilities.knowledge[abilityKey];
                    ability.issecondary = false;
                }
                else {
                    const item = this.actor.getEmbeddedDocument("Item", abilityKey);

                    ability = {
						issecondary: true,
						isvisible: true,
						label: item.system.label,
						max: item.system.max,
						name: item.name,
						speciality: item.system.speciality,
						value: item.system.value,
						_id: abilityKey
					}
                }

                if (await BonusHelper.CheckAbilityBonus(this.actor, ability._id)) {
                    let bonus = await BonusHelper.GetAbilityBonus(this.actor, ability._id);
                    this.object.difficulty += parseInt(bonus);
                }              
                
                data.object.abilityValue = parseInt(ability.value);

                if (await BonusHelper.CheckAbilityBuff(this.actor, ability._id)) {
                    let bonus = await BonusHelper.GetAbilityBuff(this.actor, ability._id);
                    data.object.abilityValue += parseInt(bonus);
                }
                
                data.object.abilityName = (!ability.issecondary) ? game.i18n.localize(ability.label) : ability.label;
                data.object.name = data.object.abilityName;

                if (parseInt(ability.value) >= 4) {
                    data.object.hasSpeciality = true;
                    abilitySpeciality = ability.speciality;
                }
            }
        }        

        if (data.object.hasSpeciality) {
            if ((attributeSpeciality != "") && (abilitySpeciality != "")) {
                specialityText = attributeSpeciality + ", " + abilitySpeciality;
            }
            else if (attributeSpeciality != "") {
                specialityText = attributeSpeciality;
            }
            else if (abilitySpeciality != "") {
                specialityText = abilitySpeciality;
            }
        }

        data.object.specialityText = specialityText;

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.dialog-numdices-button')
            .click(this._setNumDices.bind(this));

        html
            .find('.dialog-difficulty-button')
            .click(this._setDifficulty.bind(this));   
            
        html
            .find('.dialog-attribute-button')
            .click(this._setAttribute.bind(this));

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
        
        this.object.useSpeciality = formData["specialty"];
        this.object.usepain = formData["usepain"];

        try {
            this.object.bonus = parseInt(formData["bonus"]);
        }
        catch {
            this.object.bonus = 0;
        }

        this.object.canRoll = this.object.difficulty > -1 ? true : false;
    }

    _setDifficulty(event) {
        const element = event.currentTarget;
        const parent = $(element.parentNode);
        const steps = parent.find(".dialog-difficulty-button");
        const index = parseInt(element.value);   

        this.object.difficulty = index;   
        this.object.canRoll = this.object.difficulty > -1 ? true : false;     

        if (index < 0) {
            return;
        }

        steps.removeClass("active");

        steps.each(function (i) {
            if (this.value == index) {
                $(this).addClass("active");
            }
        });
    }

    _setNumDices(event) {
        const element = event.currentTarget;
        const parent = $(element.parentNode);
        const steps = parent.find(".dialog-numdices-button");
        const index = parseInt(element.value);   

        this.object.attributeValue = index;   
        this.object.canRoll = this.object.difficulty > -1 ? true : false;     

        if (index < 0) {
            return;
        }

        steps.removeClass("active");

        steps.each(function (i) {
            if (this.value == index) {
                $(this).addClass("active");
            }
        });

        //this.getData();
    }

    async _setAttribute(event) {
        const element = event.currentTarget;
        const parent = $(element.parentNode);
        const steps = parent.find(".dialog-attribute-button");
        const key = element.value;

        if (key == "") {
            steps.removeClass("active");
            return;
        }

        this.object.attributeKey = element.value;
        this.object.difficulty = 6;

        if (await BonusHelper.CheckAttributeBonus(this.actor, this.object.attributeKey)) {            
            let bonus = await BonusHelper.GetAttributeBonus(this.actor, this.object.attributeKey);
            this.object.difficulty += parseInt(bonus);
        }

        if (CONFIG.wod.attributeSettings == "20th") {                
            this.object.attributeName = game.i18n.localize(CONFIG.wod.attributes20[key]);
        }
        else if (CONFIG.wod.attributeSettings == "5th") {
            this.object.attributeName = game.i18n.localize(CONFIG.wod.attributes[key]);
        }

        this.object.attributeValue = this.actor.system.attributes[key].total;

        steps.removeClass("active");

        steps.each(function (i) {
            if (this.value == key) {
                $(this).addClass("active");
            }
        });

        this.render(false);
    }

    /* clicked to roll */
    _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        this.object.canRoll = this.object.difficulty > -1 ? true : false;     
        let woundPenaltyVal = 0;
        let templateHTML = "";
        let specialityText = "";

        const numDices = parseInt(this.object.attributeValue) + parseInt(this.object.abilityValue) + parseInt(this.object.bonus);

        if (!this.object.canRoll) {
            ui.notifications.warn(game.i18n.localize("wod.dialog.missingdifficulty"));
            return;
        }

        if (this.object.type == "dice") {
            woundPenaltyVal = 0;

            templateHTML = `<h2>${game.i18n.localize("wod.dice.rollingdice")}</h2>`;
        }
        else {            
            templateHTML = `<h2>${this.object.name}</h2>`;
            templateHTML += `<strong>${this.object.attributeName} (${this.object.attributeValue})`;

            if (this.object.abilityName != "") {
                templateHTML += ` + ${this.object.abilityName} (${this.object.abilityValue})`;
            }

            if (this.object.bonus > 0) {
                templateHTML += ` + ${this.object.bonus}`;
            }

            templateHTML += `</strong>`;            
            
            this.object.close = true;

            if (!this.object.hasSpeciality) {
                this.object.useSpeciality = false;
            }

            if (this.object.useSpeciality) {
                specialityText = this.object.specialityText;
            }

            if (CombatHelper.ignoresPain(this.actor)) {
                woundPenaltyVal = 0;	
            }				
            else if ((this.object.type == "dice") || (this.object.type == "noability")) {
                woundPenaltyVal = 0;
            }
            else if (!this.object.usepain) {
                woundPenaltyVal = 0;
            }
            else {
                woundPenaltyVal = parseInt(this.actor.system.health.damage.woundpenalty);
            }
        }

        const generalRoll = new DiceRoll(this.actor);
        generalRoll.attribute = this.object.attributeKey;
        generalRoll.handlingOnes = CONFIG.wod.handleOnes;    
        generalRoll.origin = "general";
        generalRoll.numDices = numDices;
        generalRoll.woundpenalty = parseInt(woundPenaltyVal);
        generalRoll.difficulty = parseInt(this.object.difficulty);          
        generalRoll.templateHTML = templateHTML;        
        generalRoll.speciality = this.object.useSpeciality;
        generalRoll.specialityText = specialityText;

        rollDice(generalRoll);

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}
