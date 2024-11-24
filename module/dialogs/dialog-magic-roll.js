import { DiceRollContainer } from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";
import CalculateHelper from "../calculate-helper.js";

export class SpellRoll {

    #_totalTarning = 0;
    #_totalBonus = 0;
    #_grundTarning = 0;
    #_grundBonus = 0;
    #_tarningar;

    #_harSmarta = false;

    constructor(item, actor) {
        this.actor = actor;
        this.typ = "spell";
        this.namn = item.name;
        this.svarighet = item.system.svarighet;
        this.improvisation = 0;
        this.aspekt = item.system.aspekt;

        if (actor.system.berakning.svarighet.smarta > 0) {
            this.#_harSmarta = true;
        }

        for (const fardighet of actor.system.listdata.fardigheter.mystik) {
            if (fardighet.system.id == item.system.aspekt) {
                this.#_tarningar = fardighet.system.varde
                this.#_grundTarning = this.#_tarningar.tvarde;
                this.#_grundBonus = this.tarningar.bonus;
                this.#_totalTarning = this.#_tarningar.tvarde;
                this.#_totalBonus = this.#_tarningar.bonus;  
                break;
            }
        }

        if (item.system.forsvar != "") {
            this.forsvar = item.system.forsvar;
            this.anfall = item.system.anfall
        }
        else {
            this.forsvar = "";
        }

        // Varaktighet
        this.varaktighet = item.system.varaktighet.tid > 0;

        this.varaktighettyptext = "";
        if (this.varaktighet) {
            this.varaktighettyptext = CONFIG.EON.magi.varaktighet[item.system.varaktighet.tid];
        }
        else {
            if (item.system.varaktighet.koncentration) {
                this.varaktighettyptext = "Koncentration";
            }
            if (item.system.varaktighet.momentan) {
                this.varaktighettyptext = "Momentan";
            }
            if (item.system.varaktighet.immanent) {
                this.varaktighettyptext = "Immanent";
            }            
        }

        this.varaktighettyp = item.system.varaktighet.tid;
        this.koncentration = item.system.varaktighet.koncentration;
        this.momentan = item.system.varaktighet.momentan;
        this.immanent = item.system.varaktighet.immanent;

        // Omfång
        this.omfang = item.system.omfang.yta > 0;        
        
        this.omfangtyptext = "";
        if (this.omfang) {
            this.omfangtyptext = CONFIG.EON.magi.omradesomfang[item.system.omfang.yta];
        }
        else {
            this.omfangtyptext = `${item.system.omfang.antal} ${item.system.omfang.text}`;
        }

        this.omfangtyp = item.system.omfang.yta;
        this.omfangantal = item.system.omfang.antal;
        this.omfangtext = item.system.omfang.text;

        // Räckvidd
        this.rackvidd = item.system.rackvidd.stracka > 0;        
        this.rackviddtyptext = "";
        if (this.rackvidd) {
            this.rackviddtyptext = CONFIG.EON.magi.rackvidd[item.system.rackvidd.stracka];
        }
        else {
            this.rackviddtyptext = `${item.system.rackvidd.antal} ${item.system.rackvidd.text}`;
        }

        this.rackviddtyp = item.system.rackvidd.stracka;
        this.rackviddlangd = item.system.rackvidd.antal;
        this.rackviddenhet = item.system.rackvidd.text;

        this.overflod = 0;

        this.beskrivning = item.system.beskrivning;

        this.close = false;
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        if (this.#_harSmarta) {
            tarning.tvarde = tarning.tvarde - this.actor.system.berakning.svarighet.smarta;

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

    get harSmarta() {
        return this.#_harSmarta;
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

export class DialogSpellRoll extends FormApplication {

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
        return "systems/eon-rpg/templates/dialogs/dialog-magic-roll.html";
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
            .find('.fa-square-plus')
            .click(this._ticImprovisationUp.bind(this));

        html
            .find('.fa-minus-square')
            .click(this._ticImprovisationDown.bind(this));

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this)); 
    }

    _ticImprovisationUp(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        this._setImprovisation(dataset, "up");
    }

    _ticImprovisationDown(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        this._setImprovisation(dataset, "down");
    }

    _setImprovisation(dataset, direction) {

        if (dataset.source == "anfall") {

            if (CalculateHelper.isNumeric(this.object.anfall)) {
                let varde = parseInt(this.object.anfall);

                if (direction == "up") {
                    varde += 1;
                }
                else if (direction == "down") {
                    varde -= 1;
                }

                if (varde < 1) {
                    varde = 1;
                    return;
                }            

                this.object.anfall = varde;
                this._setImprovisationDifficulty(direction, 1);
            }
        }

        if ((dataset.source == "varaktighet") && (this.object.varaktighet)) {
            
            if (this.object.varaktighet) {
                if(direction == "up") {
                    this.object.varaktighettyp += 1;
                }
                else if (direction == "down") {
                    this.object.varaktighettyp -= 1;
                }
    
                if (this.object.varaktighettyp < 1) {
                    this.object.varaktighettyp = 1;
                    return;
                }

                if (this.object.varaktighettyp > 11) {
                    const tidsvarde = Math.pow(2, (this.object.varaktighettyp - 11));
                    this.object.varaktighettyptext = `${String(tidsvarde)} år`;
                }
                else {
                    this.object.varaktighettyptext = CONFIG.EON.magi.varaktighet[this.object.varaktighettyp];
                }
            }    

            this._setImprovisationDifficulty(direction, 2);
        }

        if (dataset.source == "omfang") {
            
            if (this.object.omfang) {
                if(direction == "up") {
                    this.object.omfangtyp += 1;
                }
                else if (direction == "down") {
                    this.object.omfangtyp -= 1;
                }

                if (this.object.omfangtyp < 1) {
                    this.object.omfangtyp = 1;
                    return;
                }
                if (this.object.omfangtyp > 7) {
                    const tidsvarde = Math.pow(2, (this.object.omfangtyp - 7));
                    this.object.omfangtyptext = `${String(tidsvarde)} kilometer`;
                }
                else {
                    this.object.omfangtyptext = CONFIG.EON.magi.omradesomfang[this.object.omfangtyp];
                }                
            }
            else {
                if(direction == "up") {
                    this.object.omfangantal += 1;
                }
                else if (direction == "down") {
                    this.object.omfangantal -= 1;
                }

                if (this.object.omfangantal < 1) {
                    this.object.omfangantal = 1;
                    return;
                }

                this.object.omfangtyptext = `${this.object.omfangantal} st. ${this.object.omfangtext}`;
            } 

            this._setImprovisationDifficulty(direction, 4);
        }

        if (dataset.source == "rackvidd") {
            
            if (this.object.rackvidd) {
                if(direction == "up") {
                    this.object.rackviddtyp += 1;
                }
                else if (direction == "down") {
                    this.object.rackviddtyp -= 1;
                }

                if (this.object.rackviddtyp < 1) {
                    this.object.rackviddtyp = 1;
                    return;
                }
                if (this.object.rackviddtyp > 7) {
                    const tidsvarde = Math.pow(2, (this.object.rackviddtyp - 7));
                    this.object.rackviddtyptext = `${String(tidsvarde)} kilometer`;
                }
                else {
                    this.object.rackviddtyptext = CONFIG.EON.magi.rackvidd[this.object.rackviddtyp];
                }                
            }
            else {
                if(direction == "up") {
                    this.object.rackviddlangd += 1;
                }
                else if (direction == "down") {
                    this.object.rackviddlangd -= 1;
                }

                if (this.object.rackviddlangd < 1) {
                    this.object.rackviddlangd = 1;
                    return;
                }

                this.object.rackviddtyptext = `${this.object.rackviddlangd} ${this.object.rackviddenhet}`;
            } 

            this._setImprovisationDifficulty(direction, 4);
        }

        if (dataset.source == "overflod") {
            if(direction == "up") {
                this.object.overflod += 1;
            }
            else if (direction == "down") {
                this.object.overflod -= 1;
            }

            if (this.object.overflod < 0) {
                this.object.overflod = 0;
                return;
            }
            this.object.overflod

            this._setImprovisationDifficulty(direction, 1);
        }

        this.render();
    }

    _setImprovisationDifficulty(direction, modifier) {
        if (direction == "up") {
            this.object.improvisation += modifier;
        }
        if (direction == "down") {
            this.object.improvisation -= modifier;
        }
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
            let value = "";

            if (dataset.value != "clear") {
                value = String(this.object.svarighet) + String(dataset.value);
            }            

            this.object.svarighet = value;
        }

        this.render();
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

        var info = [];
        var grundvarde = "";
        var visadeTarningar = this.object.visaTarning;
        var description = "";

        if (this.object.harSmarta) {
            description += `${this.actor.system.berakning.svarighet.smarta}T6 smärta<br />`;
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
        roll.typeroll = CONFIG.EON.slag.fardighet;
        roll.action = this.object.namn;
        roll.number = this.object.visaTarning.tvarde;
        roll.bonus = this.object.visaTarning.bonus;

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet) + parseInt(this.object.improvisation);
        }
        else {
            roll.svarighet = 0;
        }

        roll.info = info; 
        roll.description = description;
        roll.grundvarde = grundvarde;

        // Omfång
        roll.description += `<b>Omfång:</b> ${this.object.omfangtyptext}<br />`;
        // Räckvidd
        roll.description += `<b>Räckvidd:</b> ${this.object.rackviddtyptext}<br />`;
        // Varaktighet
        roll.description += `<b>Varaktighet:</b> ${this.object.varaktighettyptext}<br />`;
        // Överflöd
        if (this.object.overflod > 0) {
            roll.description += `<b>Överflöd:</b> ${this.object.overflod}<br />`;
        }        

        // Försvar
        if (this.object.forsvar != "") {
            roll.description += `<br />${this.object.forsvar} mot ${this.object.anfall}<br />`;
        }

        roll.description += this.object.beskrivning;       

        const result = await RollDice(roll);
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    
}