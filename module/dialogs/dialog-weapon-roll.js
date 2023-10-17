import { DiceRollContainer } from "../dice-helper.js";
import DiceHelper from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class WeaponRoll {
    constructor(actor, item) {
        this.actorAttribut = {
			"tvarde": 0,
			"bonus": 0
		};
        this.totalTarning = 0;
        this.totalBonus = 0;
        this.actorAttributNamn = "";

        this.vapen = item;
        this.vapennamn = item["name"];
        this.vapenskada = {
			"tvarde": 0,
			"bonus": 0
		};

        this.actorGrundskada = {
			"tvarde": 0,
			"bonus": 0
		};

        if (item.type == "Avståndsvapen") {
            this.vapenskada = this.vapen.system.skada;
        }
        else if (item.type == "Sköld") {            
            this.actorGrundskada = actor.system.harleddegenskaper.grundskada.totalt;
            this.vapenskada = DiceHelper.AdderaVarden(this.vapen.system.skada, this.actorGrundskada);
        }
        else {
            this.actorGrundskada = actor.system.harleddegenskaper.grundskada.totalt;
        }

        // läs in värdena för vapenfärdigheten
        for (const fardighet of actor.system.listdata.fardigheter.strid) {
            if (fardighet.system.id == item.system.grupp) {
				this.actorAttribut = fardighet.system.varde;
                this.actorAttributNamn = fardighet.name;
                break;
			}
		}

        this.isattack = false;
        this.isdefense = false;   
        this.isdamage = false;
        
        this.usehugg = false;
        this.usekross = false;
        this.usestick = false;
        
        this.canroll = false;   
        this.close = false;
    }
}

export class DialogWeaponRoll extends FormApplication {
    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;   
        this.isDialog = true;  
        this.options.title = `${actor.name} - ${roll.vapennamn}`;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog"],
            template: "systems/eon-rpg/templates/dialogs/dialog-weapon-roll.html",
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
            .find('.attacktype')
            .click(this._setAttackType.bind(this));

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.eventbutton')
            .click(this._eventclick.bind(this));

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

    _setMode(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
        const type = dataset.type;

        this.object.usehugg = false;
        this.object.usekross = false;
        this.object.usestick = false;

        if (type == "attack") {
            this.object.isattack = true;
            this.object.isdamage = false;
            this.object.isdefense = false;  

            this.object.totalTarning = this.object.actorAttribut.tvarde;
            this.object.totalBonus = this.object.actorAttribut.bonus;

            if ((this.object.vapen.type == "Avståndsvapen") || (this.object.vapen.type == "Sköld")) {
                if (this.object.vapen.system.skadetyp == "hugg") {
                    this.object.usehugg = true;
                }
                if (this.object.vapen.system.skadetyp == "kross") {
                    this.object.usekross = true;
                }
                if (this.object.vapen.system.skadetyp == "stick") {
                    this.object.usestick = true;
                }
            }
        }
        if (type == "damage") {
            this.object.isattack = false;
            this.object.isdamage = true;
            this.object.isdefense = false; 
            
            if ((this.object.vapen.type == "Avståndsvapen") || (this.object.vapen.type == "Sköld")) {
                if (this.object.vapen.system.skadetyp == "hugg") {
                    this.object.usehugg = true;
                }
                if (this.object.vapen.system.skadetyp == "kross") {
                    this.object.usekross = true;
                }
                if (this.object.vapen.system.skadetyp == "stick") {
                    this.object.usestick = true;
                }
            }
        }
        if (type == "defense") {
            this.object.isattack = false;
            this.object.isdamage = false;
            this.object.isdefense = true;   

            this.object.totalTarning = this.object.actorAttribut.tvarde;
            this.object.totalBonus = this.object.actorAttribut.bonus;
        }
        if (type == "hugg") {
            this.object.usehugg = true;
        }
        if (type == "kross") {
            this.object.usekross = true;
        }
        if (type == "stick") {
            this.object.usestick = true;
        }

        this.render();
    }

    _setAttackType(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
        const type = dataset.type;

        if (this.object.isdamage) {
            this.object.vapenskada = DiceHelper.AdderaVarden(this.object.vapen.system[type], this.object.actorGrundskada);

            this.object.totalTarning = this.object.vapenskada.tvarde;
            this.object.totalBonus = this.object.vapenskada.bonus;
        }
        else {
            this.object.vapenskada = {
                "tvarde": 0,
                "bonus": 0
            };

            this.object.totalTarning = 0;
            this.object.totalBonus = 0;
        }

        this.render();
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
    _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.vapen;
        roll.action = this.object.vapennamn;                       

        roll.info = this.object.vapen.system.egenskaper;

        /* if ((this.object.totalTarning != this.object.actorAttribut.tvarde) || (this.object.totalBonus != this.object.actorAttribut.bonus)) {
            if (this.object.actorAttribut.bonus == 0) {
                info.push("Basvärde: Ob " + this.object.actorAttribut.tvarde + "T6");
            }
            else if (this.object.actorAttribut.bonus > 0) {
                info.push("Basvärde: Ob " + this.object.actorAttribut.tvarde + "T6+" + this.object.actorAttribut.bonus);
            }
            else {
                info.push("Basvärde: Ob " + this.object.actorAttribut.tvarde + "T6-" + this.object.actorAttribut.bonus);
            }            
        } */

        roll.number = this.object.totalTarning;
        roll.bonus = this.object.totalBonus;

        if (this.object.isattack)  {
            roll.action = `Anfaller med ${this.object.vapennamn.toLowerCase()}`;   
            
            /* roll.number = parseInt(this.object.actorAttribut.tvarde);
            roll.bonus = parseInt(this.object.actorAttribut.bonus); */
        }
        else if ((this.object.isdamage) && ((this.object.usehugg) || (this.object.usekross) || (this.object.usestick))) {
            let skadetyp = "";

            if (this.object.usehugg) {
                skadetyp = "hugg";
            }
            if (this.object.usekross) {
                skadetyp = "kross";
            }
            if (this.object.usestick) {
                skadetyp = "stick";
            }

            roll.action = `Skadeslag ${this.object.vapennamn.toLowerCase()} (${skadetyp})`;
            roll.number = parseInt(this.object.vapenskada.tvarde);
            roll.bonus = parseInt(this.object.vapenskada.bonus);
        }
        else if (this.object.isdamage) {
            ui.notifications.error("Du måste välja vilken skadetype du använder dig av innan du slår med tärningarna.");
            this.object.close = false;
            return;
        }
        else if (this.object.isdefense) {
            roll.action = `Försvarar med ${this.object.vapennamn.toLowerCase()}`;            
        }
        else {
            ui.notifications.error("Du måste välja sättet du använder ditt vapen för innan du slår med tärningarna.");
            this.object.close = false;
            return;
        }        

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }
        
        const result = RollDice(roll);

        if (this.object.isattack) {
            this.object.isdamage = true;
            this.object.isattack = false;
            this.object.close = false;

            this.object.totalTarning = 0;
            this.object.totalBonus = 0;

            this.render();
            return;
        }
        else {
            this.object.close = true;
        }        
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    
}