import { DiceRollContainer } from "../dice-helper.js";
import DiceHelper from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class WeaponRoll {

    #_totalTarning = 0;
    #_totalBonus = 0;
    #_grundTarning = 0;
    #_grundBonus = 0;

    #_isattack = true;
    #_isdamage = false;
    #_isdefence = false;

    #_usehugg = false;
    #_usekross = false;
    #_usestick = false;

    #_vapenskada = {
        "tvarde": 0,
        "bonus": 0
    };

    #_actorGrundskada = {
        "tvarde": 0,
        "bonus": 0
    };

    #_harSmarta = false;
    #_harSar = false;
    #_visaSar = false;

    #_attacktype = 'normal';

    #_lastAttackType = 'normal';

    constructor(actor, item) {
        if (actor.system.berakning.svarighet.smarta > 0) {
            this.#_harSmarta = true;
        }

        if ((actor.system.skada.sar.hogerarm > 0) || (actor.system.skada.sar.vansterarm > 0)) {
            this.#_harSar = false;
            this.#_visaSar = true;
        }

        this.actorAttribut = {
			"tvarde": 0,
			"bonus": 0
		};

        this.actor = actor;
        this.actorAttributNamn = "";
        this.svarighet = "";
        this.typ = "vapen";        
        this.canroll = false;   
        this.close = false;

        this.vapen = item;
        this.vapennamn = item["name"];

        if (item.type == "Sköld") {            
            this.#_isattack = false;
            this.#_isdefence = true;             
        }

        // läs in värdena för vapenfärdigheten
        for (const fardighet of actor.system.listdata.fardigheter.strid) {
            if (fardighet.system.id == item.system.grupp) {
				this.actorAttribut = fardighet.system.varde;
                this.actorAttributNamn = fardighet.name;
                break;
			}
		}     

        this.setDamageType();

        if (item.type == "Sköld") {
            this.setCombatmode("defence");
        }
        else {
            this.setCombatmode("attack");
        }
        
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        if (!this.#_isdamage) {
            if (this.#_harSmarta) {
                tarning.tvarde = tarning.tvarde - this.actor.system.berakning.svarighet.smarta;
    
                if (tarning.tvarde < 0) {
                    tarning.tvarde = 0;
                    tarning.bonus = 0;
                }       
            }
    
            if (this.#_harSar) {
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.hogerarm;
                tarning.tvarde = tarning.tvarde - this.actor.system.skada.sar.vansterarm;
    
                if (tarning.tvarde < 0) {
                    tarning.tvarde = 0;
                    tarning.bonus = 0;
                }   
            }
        }        

        return tarning;
    }

    get visaGrundtarning() {
        return {
            tvarde: this.grundTarning,
            bonus: this.grundBonus
        };
    }

    get grundTarning() {
        if (this.#_isattack) {
            return this.actorAttribut.tvarde;
        }
        if (this.#_isdamage) {
            return this.#_vapenskada.tvarde;
        }
        if (this.#_isdefence) {
            return this.actorAttribut.tvarde;
        }

        return 0;
    }

    set grundTarning(value) {
        this.#_grundTarning = value;
    }

    get grundBonus() {
        if (this.#_isattack) {
            return this.actorAttribut.bonus;
        }
        if (this.#_isdamage) {
            return this.#_vapenskada.bonus;
        }
        if (this.#_isdefence) {
            return this.actorAttribut.bonus;
        }

        return 0;
    }

    set grundBonus(value) {
        this.#_grundBonus = value;
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

    get harSar() {
        return this.#_harSar;
    }

    set harSar(aktiv) {
        this.#_harSar = aktiv;
    }

    get visaSar() {
        return this.#_visaSar;
    }

    get usehugg() {
        return this.#_usehugg;
    }

    get usekross() {
        return this.#_usekross;
    }

    get usestick() {
        return this.#_usestick;
    }

    set usehugg(value) {
        this.#_usehugg = value;
    }

    set usekross(value) {
        this.#_usekross = value;
    }

    set usestick(value) {
        this.#_usestick = value;
    }

    get isattack() {
        return this.#_isattack;
    }

    get isdamage() {
        return this.#_isdamage;
    }

    get isdefence() {
        return this.#_isdefence;
    }

    get hamtaAntalSar() {
        return this.actor.system.skada.sar.hogerarm + this.actor.system.skada.sar.vansterarm;
    }

    get harSar() {
        return this.#_harSar;
    }

    set harSar(aktiv) {
        this.#_harSar = aktiv;
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

    setCombatmode(type = "") {
        if (type == "attack") {
            this.#_lastAttackType = 'normal';
            this.#_attacktype = 'normal';
        }
        else if (type == "damage") {
            this.#_lastAttackType = this.#_attacktype;
        }

        this.#_isattack = false;
        this.#_isdamage = false;
        this.#_isdefence = false;

        if (type == "attack") {
            this.#_isattack = true;
            this.#_visaSar = true;
            this.#_harSar = false;
        }
        else if (type == "damage") {
            this.#_isdamage = true;
            this.#_visaSar = false;
            this.#_harSar = false;
        }
        else if (type == "defence") {
            this.#_usehugg = false;
            this.#_usekross = false;
            this.#_usestick = false;

            this.#_visaSar = true;
            this.#_harSar = false;

            this.#_isdefence = true;
        }

        this.#_grundTarning = this.grundTarning;
        this.#_grundBonus = this.grundBonus;

        this.#_totalTarning = this.#_grundTarning;
        this.#_totalBonus = this.#_grundBonus;

        this.updateAttackModifiers();
    }

    setDamageType(type = "") {
        this.#_usehugg = false;
        this.#_usekross = false;
        this.#_usestick = false;

        if ((this.vapen.type == "Avståndsvapen") || (this.vapen.type == "Sköld")) {
            if (this.vapen.system.skadetyp == "hugg") {
                this.#_usehugg = true;
            }
            if (this.vapen.system.skadetyp == "kross") {
                this.#_usekross = true;
            }
            if (this.vapen.system.skadetyp == "stick") {
                this.#_usestick = true;
            }
        }
        if (this.vapen.type == "Närstridsvapen") {
            let antal = 0;

            if (this.vapen.system.hugg.aktiv) {
                antal += 1;
                this.#_usehugg = true;
            }
            if (this.vapen.system.kross.aktiv) {
                antal += 1;
                this.#_usekross = true;
            }
            if (this.vapen.system.stick.aktiv) {
                antal += 1;
                this.#_usestick = true;
            }

            if (antal != 1) {
                this.#_usehugg = false;
                this.#_usekross = false;
                this.#_usestick = false;
            }
        }
        if (type == "hugg") {
            this.#_usehugg = true;
        }
        if (type == "kross") {
            this.#_usekross = true;
        }
        if (type == "stick") {
            this.#_usestick = true;
        }

        if (this.#_isdamage) {
            this.setWeaponDamage();
        }
    }

    setWeaponDamage(type = "") {
        this.#_actorGrundskada = this.actor.system.harleddegenskaper.grundskada.totalt;

        if (!this.#_isdamage) {
            this.#_vapenskada = {
                "tvarde": 0,
                "bonus": 0
            };
        }
        else if (this.vapen.type == "Avståndsvapen") {
            this.#_vapenskada = this.vapen.system.skada;
        }
        else if (this.vapen.type == "Sköld") {            
            this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.skada, this.#_actorGrundskada);
        }
        else if ((this.vapen.type == "Närstridsvapen") && (type != "")) {
            this.#_vapenskada = this.#_actorGrundskada;
            this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system[type], this.#_actorGrundskada);            
        }
        else if (this.vapen.type == "Närstridsvapen") {
            if (this.#_usehugg) {
                this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.hugg, this.#_actorGrundskada);
            }
            if (this.#_usekross) {
                this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.kross, this.#_actorGrundskada);
            }
            if (this.#_usestick) {
                this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.stick, this.#_actorGrundskada);
            } 
        }   

        if (this.#_isdamage) {
            switch(this.#_lastAttackType) {
                case 'tungt':
                    this.#_vapenskada.tvarde += 2;
                    break;
                case 'snabbt':
                    this.#_vapenskada.tvarde -= 1;
                    break;
                // Group attack has no damage modifier
            }
            
            // Ensure damage doesn't go below 0
            if (this.#_vapenskada.tvarde < 0) {
                this.#_vapenskada.tvarde = 0;
            }
        }

        this.#_grundTarning = this.#_vapenskada.tvarde;
        this.#_grundBonus = this.#_vapenskada.bonus;

        this.#_totalTarning = this.#_grundTarning;
        this.#_totalBonus = this.#_grundBonus;
    }

    get attacktype() {
        return this.#_attacktype;
    }

    set attacktype(type) {
        this.#_attacktype = type;
        this.updateAttackModifiers();
    }

    updateAttackModifiers() {
        this.#_totalTarning = this.grundTarning;
        this.#_totalBonus = this.grundBonus;
        
        // For attack rolls
        if (this.#_isattack) {
            switch(this.#_attacktype) {
                case 'tungt':
                    this.#_totalTarning -= 1;  // -1T6 to hit
                    break;
                case 'snabbt':
                    this.#_totalTarning += 1;  // +1T6 to hit
                    break;
                case 'grupp':
                    this.#_totalTarning -= 1;  // -1T6 to hit
                    break;
            }
        }
        
        // For damage rolls
        if (this.#_isdamage) {
            // Get base weapon damage
            let damageDice = this.#_vapenskada.tvarde;
            
            switch(this.#_attacktype) {
                case 'tungt':
                    damageDice += 2;  // +2T6 damage
                    break;
                case 'snabbt':
                    damageDice -= 1;  // -1T6 damage
                    break;
                // Group attack has no damage modifier
            }
            
            // Update total damage dice
            this.#_vapenskada.tvarde = Math.max(0, damageDice);  // Ensure non-negative
            this.#_totalTarning = this.#_vapenskada.tvarde;
        }
        
        // Ensure we don't go below 0 dice
        if (this.#_totalTarning < 0) {
            this.#_totalTarning = 0;
        }
    }

    get lastAttackType() {
        return this.#_lastAttackType;
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
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog"],
            template: "systems/eon-rpg/templates/dialogs/dialog-weapon-roll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true,
            width: 700,
            height: 500
        });
    }

    async getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        console.log("Activating listeners for weapon roll dialog");

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

        html.find('.attacktype').click(this._onAttackTypeClick.bind(this));
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

        this.object.setCombatmode(type);
        this.object.setDamageType();

        this.render();
    }

    _setAttackType(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
        const type = dataset.type;

        if (this.object.isdamage) {     
            this.object.setDamageType(type);
            this.object.setWeaponDamage(type); 
        }

        this.render();
    }

    /* something happened on the sheet */
    _eventclick(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset?.type && element.classList.contains('attacktype')) {
            console.log("Attack type clicked:", dataset.type);
            this.object.attacktype = dataset.type;
        }

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

        let description = "";

        if ((this.object.harSmarta) && (!this.object.isdamage)) {
            description += `${this.actor.system.berakning.svarighet.smarta}T6 smärta</br >`;
        }

        if (this.object.harSar) {
            if (this.actor.system.skada.sar.hogerarm > 0) {
                description += `Har ${this.actor.system.skada.sar.hogerarm} sår i höger arm (${this.actor.system.skada.sar.hogerarm}T6)<br />`;
            }
            if (this.actor.system.skada.sar.vansterarm > 0) {
                description += `Har ${this.actor.system.skada.sar.vansterarm} sår i vänster arm (${this.actor.system.skada.sar.vansterarm}T6)<br />`;
            }
        }
        if ((this.object.visaSar) && (!this.object.harSar)) {
            if (this.actor.system.skada.sar.hogerarm > 0) {
                description += `Ignorerar ${this.actor.system.skada.sar.hogerarm} sår i höger arm<br />`;
            }
            if (this.actor.system.skada.sar.vansterarm > 0) {
                description += `Ignorerar ${this.actor.system.skada.sar.vansterarm} sår i vänster arm<br />`;
            }
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.vapen;
        roll.action = this.object.vapennamn;                       

        roll.info = this.object.vapen.system.egenskaper;

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

        roll.description = description;
        roll.grundvarde = grundvarde;

        roll.number = this.object.visaTarning.tvarde;
        roll.bonus = this.object.visaTarning.bonus;

        if (this.object.isdamage) {
            this.object.svarighet = "";
        }

        if (this.object.isattack)  {
            roll.action = `Anfaller ${this.object.attacktype} med ${this.object.vapennamn.toLowerCase()}`; 
        }
        else if ((this.object.isdamage) && ((this.object.usehugg) || (this.object.usekross) || (this.object.usestick))) {
            let skadetyp = "";
            let attacktyp = "";

            if (this.object.usehugg) {
                skadetyp = "hugg";
            }
            if (this.object.usekross) {
                skadetyp = "kross";
            }
            if (this.object.usestick) {
                skadetyp = "stick";
            }

            // Get attack type from lastAttackType
            switch(this.object.lastAttackType) {
                case 'tungt':
                    attacktyp = "tungt ";
                    break;
                case 'snabbt':
                    attacktyp = "snabbt ";
                    break;
                case 'grupp':
                    attacktyp = "grupp ";
                    break;
                default:
                    attacktyp = "";
            }

            roll.action = `Skadeslag ${this.object.vapennamn.toLowerCase()} (${attacktyp}${skadetyp})`;
        }
        else if (this.object.isdamage) {
            ui.notifications.error("Du måste välja vilken skadetype du använder dig av innan du slår med tärningarna.");
            this.object.close = false;
            return;
        }
        else if (this.object.isdefence) {
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
        
        const result = await RollDice(roll);

        if (this.object.isattack) {
            let utmattningIncrease = 0;
            switch(this.object.attacktype) {
                case 'tungt':
                    utmattningIncrease = 2;
                    break;
                case 'snabbt':
                case 'grupp':
                    utmattningIncrease = 1;
                    break;
            }

            if (utmattningIncrease > 0) {
                const currentUtmattning = this.actor.system.skada.utmattning.varde;
                await this.actor.update({
                    "system.skada.utmattning.varde": Number(currentUtmattning) + utmattningIncrease
                });
            }

            this.object.setCombatmode("damage");
            this.object.close = false;
        }
        else {
            this.close();
            return;      
        }   

        this.render();
        return;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

    _onAttackTypeClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const type = button.dataset.type;
        this.object.attacktype = type;
        this.render(true);
    }
}