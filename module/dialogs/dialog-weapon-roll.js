import DiceHelper, {
    DiceRollContainer,
    RollDice,
    buildSmartaModifierHtml,
    buildWoundInLimbHtml
} from "../dice-helper.js";
import {
    appliceraKroppsbyggnadVapenAvdrag,
    formatT6Pool,
    getKroppsbyggnadVapenAvdragContext,
    resolveDefaultFattning
} from "../apps/eon5-weapon-kroppsbyggnad.js";
import { CombatAttackFlow, EON_ATTACK_FLAG } from "../combat-attack-flow.js";
import { CombatAttackChat } from "../combat-attack-chat.js";
import CalculateHelper from "../calculate-helper.js";

export class WeaponRoll {

    /**
     * Smärtavdrag (berakning sätts bara när rollformulär renderas).
     * @param {Actor} actor
     */
    static getActorSmarta(actor) {
        return Number(
            actor?.system?.berakning?.svarighet?.smarta
            ?? actor?.system?.skada?.smarta
            ?? 0
        );
    }

    /**
     * @param {Actor} actor
     * @returns {Item[]}
     */
    static getStridSkills(actor) {
        const fromSheet = actor?.system?.listdata?.fardigheter?.strid;
        if (Array.isArray(fromSheet) && fromSheet.length) return fromSheet;
        return actor?.items?.filter((item) => item.type === "Färdighet" && item.system?.grupp === "strid") ?? [];
    }

    /**
     * @param {Actor} actor
     * @returns {Item[]}
     */
    static getCreatureSkills(actor) {
        const fromSheet = actor?.system?.listdata?.fardigheter;
        if (Array.isArray(fromSheet) && fromSheet.length) return fromSheet;
        return actor?.items?.filter((item) => item.type === "Färdighet") ?? [];
    }

    #_isPC = false;

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

    /** @type {{ tvarde: number, bonus: number }|null} */
    #_cachedGrundskadaTotalt = null;

    #_harSmarta = false;
    #_harSar = false;
    #_visaSar = false;

    #_attacktype = 'normal';

    #_lastAttackType = 'normal';

    /** @type {"enhand"|"tvahand"|null} */
    #_fattning = null;

    #_valbarFattning = false;

    constructor(actor, item) {
        if (!item) {
            throw new Error("WeaponRoll requires a weapon item");
        }

        if (CombatAttackFlow.isFolkslagActor(actor)) {
            actor.system.berakning = CalculateHelper.byggRollBerakning(actor);
        }

        if (CombatAttackFlow.isPlayerCharacter(actor)) {
            this.#_isPC = true;
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

        const weaponData = item.system;

        this.vapen.isRangedWeapon = item.type === "Avståndsvapen";

        if (item.type == "Sköld") {            
            this.#_isattack = false;
            this.#_isdefence = true;             
        }

        this.actorAttribut = item.system?.traffa ?? { tvarde: 0, bonus: 0 };
        this.actorAttributNamn = item.name;

        if (CombatAttackFlow.isFolkslagActor(actor)) {
            if (WeaponRoll.getActorSmarta(actor) > 0) {
                this.#_harSmarta = true;
            }

            const sar = actor.system?.skada?.sar ?? {};
            const harArmsar = Number(sar.hogerarm) > 0 || Number(sar.vansterarm) > 0;
            if (harArmsar) {
                if (CombatAttackFlow.isPlayerCharacter(actor)) {
                    this.#_harSar = false;
                    this.#_visaSar = true;
                } else {
                    this.#_harSar = true;
                    this.#_visaSar = false;
                }
            }

            if (CombatAttackFlow.isMotstandareActor(actor)) {
                let skillVal = null;
                let skillNamn = "";
                for (const fardighet of WeaponRoll.getStridSkills(actor)) {
                    if (fardighet.system.id === item.system.grupp) {
                        skillVal = fardighet.system.varde;
                        skillNamn = game.i18n.has(fardighet.name)
                            ? game.i18n.localize(fardighet.name)
                            : fardighet.name;
                        break;
                    }
                }
                const resolved = CalculateHelper.resolveMotstandareStridTraffa(actor, skillVal);
                this.actorAttribut = resolved.varde;
                this.actorAttributNamn = resolved.useAnfallForsvar
                    ? game.i18n.localize("eon.sheets.motstandare.anfallForsvar")
                    : skillNamn;
            } else {
                for (const fardighet of WeaponRoll.getStridSkills(actor)) {
                    if (fardighet.system.id == item.system.grupp) {
                        this.actorAttribut = fardighet.system.varde;
                        this.actorAttributNamn = game.i18n.has(fardighet.name) ? game.i18n.localize(fardighet.name) : fardighet.name;
                        break;
                    }
                }
            }
        }
        else if (item.system.grupp !== "") {
            for (const fardighet of WeaponRoll.getCreatureSkills(actor)) {
                if (fardighet.system.id == item.system.grupp) {
                    this.actorAttribut = fardighet.system.varde;
                    this.actorAttributNamn = game.i18n.has(fardighet.name) ? game.i18n.localize(fardighet.name) : fardighet.name;
                    break;
                }
            }
        }
        else {
            this.actorAttribut = item.system?.traffa ?? { tvarde: 0, bonus: 0 };
            this.actorAttributNamn = item.name;
        }    

        this.setDamageType();

        if (item.type == "Sköld") {
            this.setCombatmode("defence");
        }
        else {
            this.setCombatmode("attack");
        }

        const fattningInit = resolveDefaultFattning(weaponData);
        this.#_fattning = fattningInit.fattning;
        this.#_valbarFattning = fattningInit.valbarFattning;
    }

    get fattning() {
        return this.#_fattning;
    }

    set fattning(value) {
        if (value !== "enhand" && value !== "tvahand") return;
        this.#_fattning = value;
    }

    get valbarFattning() {
        return this.#_valbarFattning;
    }

    get kroppsbyggnadAvdragContext() {
        return getKroppsbyggnadVapenAvdragContext(this.actor, this.vapen, this.#_fattning);
    }

    get harKroppsbyggnadAvdrag() {
        return this.kroppsbyggnadAvdragContext.aktiv;
    }

    get kroppsbyggnadAvdragT6() {
        return this.kroppsbyggnadAvdragContext.avdragT6;
    }

    #applyKroppsbyggnadToPool(pool) {
        const { pool: adjusted } = appliceraKroppsbyggnadVapenAvdrag(
            pool,
            this.actor,
            this.vapen,
            this.#_fattning
        );
        return adjusted;
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        tarning = this.#applyKroppsbyggnadToPool(tarning);

        if (!this.#_isdamage) {
            if (this.#_harSmarta) {
                tarning.tvarde = tarning.tvarde - WeaponRoll.getActorSmarta(this.actor);
    
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
        if (!CombatAttackFlow.isFolkslagActor(this.actor)) {
            return 0;
        }

        const sar = this.actor.system?.skada?.sar ?? {};
        return Number(sar.hogerarm ?? 0) + Number(sar.vansterarm ?? 0);
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

    setGrundskadaTotalt(totalt) {
        if (totalt && typeof totalt === "object" && totalt.tvarde !== undefined) {
            this.#_cachedGrundskadaTotalt = totalt;
        }
    }

    refreshWeaponDamage() {
        if (!this.#_isdamage) return;

        if (this.#_usehugg) {
            this.setWeaponDamage("hugg");
        } else if (this.#_usekross) {
            this.setWeaponDamage("kross");
        } else if (this.#_usestick) {
            this.setWeaponDamage("stick");
        } else {
            this.setWeaponDamage();
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

        if (type == "damage") {
            if (this.vapen.type == "Avståndsvapen" || this.vapen.type == "Sköld") {
                this.setDamageType();
                this.setWeaponDamage();
            }
            else if (this.vapen.type == "Närstridsvapen") {
                const bestDamageType = this.#hamtaBastaSkadetyp();
                if (bestDamageType) {
                    this.setDamageType(bestDamageType);
                    this.setWeaponDamage(bestDamageType);
                }
            }
        }

        this.#_grundTarning = this.grundTarning;
        this.#_grundBonus = this.grundBonus;

        this.#_totalTarning = this.#_grundTarning;
        this.#_totalBonus = this.#_grundBonus;

        this.updateAttackModifiers();
    }

    #hamtaBastaSkadetyp() {
        let highestDamage = -1;
        let bestDamageType = "";

        if (this.vapen.system.hugg.aktiv) {
            const damage = this.vapen.system.hugg.tvarde + (this.vapen.system.hugg.bonus / 3);
            if (damage > highestDamage) {
                highestDamage = damage;
                bestDamageType = "hugg";
            }
        }
        if (this.vapen.system.kross.aktiv) {
            const damage = this.vapen.system.kross.tvarde + (this.vapen.system.kross.bonus / 3);
            if (damage > highestDamage) {
                highestDamage = damage;
                bestDamageType = "kross";
            }
        }
        if (this.vapen.system.stick.aktiv) {
            const damage = this.vapen.system.stick.tvarde + (this.vapen.system.stick.bonus / 3);
            if (damage > highestDamage) {
                highestDamage = damage;
                bestDamageType = "stick";
            }
        }

        return bestDamageType;
    }

    setDamageType(type = "") {
        this.#_usehugg = false;
        this.#_usekross = false;
        this.#_usestick = false;

        // If a specific type is selected, use that
        if (type) {
            if (type === "hugg") this.#_usehugg = true;
            else if (type === "kross") this.#_usekross = true;
            else if (type === "stick") this.#_usestick = true;

            if (this.#_isdamage) {
                this.setWeaponDamage(type);
            }
            return;
        }

        // For ranged weapons and shields, use their fixed damage type
        if ((this.vapen.type == "Avståndsvapen") || (this.vapen.type == "Sköld")) {
            if (this.vapen.system.skadetyp == "hugg") {
                this.#_usehugg = true;
            } else if (this.vapen.system.skadetyp == "kross") {
                this.#_usekross = true;
            } else if (this.vapen.system.skadetyp == "stick") {
                this.#_usestick = true;
            }
            return;
        }

        // For melee weapons, find the highest damage
        if (this.vapen.type == "Närstridsvapen") {
            const bestDamageType = this.#hamtaBastaSkadetyp();
            if (bestDamageType === "hugg") this.#_usehugg = true;
            else if (bestDamageType === "kross") this.#_usekross = true;
            else if (bestDamageType === "stick") this.#_usestick = true;
        }

        if (this.#_isdamage) {
            this.setWeaponDamage();
        }
    }

    setWeaponDamage(type = "") {
        this.#_actorGrundskada = CalculateHelper.grundskadaTotaltForRoll(this.actor, this.#_cachedGrundskadaTotalt);

        if (this.vapen.type == "Avståndsvapen") {
            this.#_vapenskada = this.vapen.system.skada;
        }
        else if (this.vapen.type == "Sköld") {            
            this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.skada, this.#_actorGrundskada);
        }
        else if ((this.vapen.type == "Närstridsvapen") && (type != "")) {
            this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system[type], this.#_actorGrundskada);            
        }
        else if (this.vapen.type == "Närstridsvapen") {
            if (this.vapen.system.hugg.aktiv) {
                this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.hugg, this.#_actorGrundskada);
            } else if (this.vapen.system.kross.aktiv) {
                this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.kross, this.#_actorGrundskada);
            } else if (this.vapen.system.stick.aktiv) {
                this.#_vapenskada = DiceHelper.AdderaVarden(this.vapen.system.stick, this.#_actorGrundskada);
            }
        }   

        this.#_grundTarning = this.#_vapenskada.tvarde;
        this.#_grundBonus = this.#_vapenskada.bonus;

        this.#_totalTarning = this.#_grundTarning;
        this.#_totalBonus = this.#_grundBonus;

        if (this.#_isdamage) {
            this.updateAttackModifiers();
        }
    }

    get attacktype() {
        return this.#_attacktype;
    }

    set attacktype(type) {
        if (this.vapen.isRangedWeapon && type !== 'normal') {
            this.#_attacktype = 'normal';
        } else {
            this.#_attacktype = type;
        }
        this.updateAttackModifiers();
    }

    updateAttackModifiers() {
        this.#_totalTarning = this.grundTarning;
        this.#_totalBonus = this.grundBonus;
        
        if (this.#_isattack) {
            switch(this.#_attacktype) {
                case 'tungt':
                    this.#_totalTarning -= 1;  // -1T6 för att träffa
                    break;
                case 'snabbt':
                    this.#_totalTarning += 1;  // +1T6 för att träffa
                    break;
                case 'grupp':
                    this.#_totalTarning -= 1;  // -1T6 för att träffa
                    break;
            }
        }
        
        if (this.#_isdefence) {
            switch(this.#_attacktype) {
                case 'defensivt':
                    this.#_totalTarning += 1;  // +1T6 för att försvara
                    break;
                case 'kontring':
                    this.#_totalTarning -= 1;  // -1T6 för att försvara
                    break;
            }
        }

        if (this.#_isdamage) {
            let damageDice = this.#_vapenskada.tvarde;

            switch (this.#_lastAttackType) {
                case 'tungt':
                    damageDice += 2;
                    break;
                case 'snabbt':
                    damageDice -= 1;
                    break;
            }

            this.#_totalTarning = Math.max(0, damageDice);
            this.#_totalBonus = this.#_vapenskada.bonus;
        }
        
        if (this.#_totalTarning < 0) {
            this.#_totalTarning = 0;
        }
    }

    get lastAttackType() {
        return this.#_lastAttackType;
    }
}

export class DialogWeaponRoll extends FormApplication {

    #_isPC = false;

    /** @type {string|null} */
    linkedAttackMessageId = null;

    /** @type {number|null} */
    linkedAttackResult = null;

    /** @type {string|null} */
    linkedFlowId = null;

    /** @type {object|null} */
    _targetContext = null;

    /** @type {string|null} */
    selectedTargetCombatantId = null;

    /** @type {{ flowId: string, defenderActorId: string, defenderName: string }|null} */
    _combatAttackFlow = null;

    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});

        if (CombatAttackFlow.isPlayerCharacter(actor)) {
            this.#_isPC = true;
        }

        this.actor = actor;     
        this.config = game.EON.CONFIG;   
        this.isDialog = true;  
        this.options.title = `${actor.name} - ${roll.vapennamn}`;
    }

    static get defaultOptions() {
        //let mode = (game.settings.get('core', 'uiConfig').colorScheme.applications == "dark" ? " eon-theme-dark " : " eon-theme-light ");
        let mode = " eon-theme-light ";

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog eon-weapon-roll-dialog" + mode],
            template: "systems/eon-rpg/templates/dialogs/dialog-weapon-roll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true,
            width: 700,
            height: 500
        });
    }

    async getData() {
        if (CalculateHelper.isEon5Actor(this.actor)) {
            const actorData = foundry.utils.duplicate(this.actor.toObject());
            await CalculateHelper.beraknaGrundrustningOchGrundskadaEon5(actorData);
            const grundskadaTotalt = actorData.system?.harleddegenskaper?.grundskada?.totalt;
            if (grundskadaTotalt) {
                this.object.setGrundskadaTotalt(grundskadaTotalt);
                this.object.refreshWeaponDamage();
            }
        }

        const data = await super.getData();
        if (this.object.isattack && !this.linkedAttackMessageId) {
            this._targetContext = await CombatAttackFlow.buildTargetContext(this.actor, this.object.vapen);
            if (!this.selectedTargetCombatantId && this._targetContext?.defaultTargetId) {
                this.selectedTargetCombatantId = this._targetContext.defaultTargetId;
            }
            data.targetContext = this._targetContext;
            data.selectedTargetCombatantId = this.selectedTargetCombatantId;
        }
        if (!this._combatAttackFlow) {
            const pending = CombatAttackFlow.findPendingHitLocationForAttacker(this.actor.id);
            if (pending) {
                this._combatAttackFlow = pending;
                if (pending.weaponFattning === "enhand" || pending.weaponFattning === "tvahand") {
                    this.object.fattning = pending.weaponFattning;
                }
            }
        }
        data.hasPendingDamageFlow = Boolean(this._combatAttackFlow?.flowId);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".eon-attack-target-select").on("change", (event) => {
            this.selectedTargetCombatantId = event.currentTarget.value || null;
        });

        html
            .find('.mode')
            .click(this._setMode.bind(this));

        html
            .find('.attacktype')
            .click(this._setAttackType.bind(this));

        html
            .find('.fattning')
            .click(this._setFattning.bind(this));

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
        }

        this.render();
    }

    _setFattning(event) {
        event.preventDefault();
        const type = event.currentTarget.dataset.type;
        if (type !== "enhand" && type !== "tvahand") return;
        this.object.fattning = type;
        this.render();
    }

    /* something happened on the sheet */
    _eventclick(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset?.type && element.classList.contains('attacktype')) {
            this.object.attacktype = dataset.type;
        }

        if (dataset?.type && element.classList.contains('fattning')) {
            this.object.fattning = dataset.type;
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
            const difficultyInput = document.getElementById("difficulty");
            let value = "";

            if (dataset.value != "clear") {
                value = difficultyInput.value + dataset.value;
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
            description += buildSmartaModifierHtml(this.actor);
        }

        if ((this.object.harSar) && (!this.object.isdamage)) {
            description += buildWoundInLimbHtml(this.actor.system.skada.sar.hogerarm, "RightArm");
            description += buildWoundInLimbHtml(this.actor.system.skada.sar.vansterarm, "LeftArm");
        }
        if ((this.object.visaSar) && (!this.object.harSar) && (this.#_isPC)) {
            if (this.actor.system.skada.sar.hogerarm > 0) {
                description += `Ignorerar ${this.actor.system.skada.sar.hogerarm} sår i höger arm<br />`;
            }
            if (this.actor.system.skada.sar.vansterarm > 0) {
                description += `Ignorerar ${this.actor.system.skada.sar.vansterarm} sår i vänster arm<br />`;
            }
        }

        if (this.object.harKroppsbyggnadAvdrag) {
            const kroppsbyggnadContext = this.object.kroppsbyggnadAvdragContext;
            const kravText = formatT6Pool(kroppsbyggnadContext.krav);
            const harText = formatT6Pool(kroppsbyggnadContext.aktorKb);
            description += game.i18n.format("eon.dialogs.kroppsbyggnadVapenAvdragChat", {
                avdrag: kroppsbyggnadContext.avdragT6,
                krav: kravText,
                har: harText
            });
            description += "<br />";
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.vapen;
        roll.action = this.object.vapennamn;                       

        roll.info = this.object.vapen.system.egenskaper;
        roll.actorName = this.actor.name;

        let grundvarde = "";

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
            const targetName = this._resolveTargetName();
            roll.action = targetName
                ? game.i18n.format("eon.combatAttack.attackAgainst", {
                    type: this.object.attacktype,
                    weapon: this.object.vapennamn.toLowerCase(),
                    target: targetName
                })
                : `Anfaller ${this.object.attacktype} med ${this.object.vapennamn.toLowerCase()}`;
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

            // Hämta attacktyp från lastAttackType
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
            ui.notifications.error(game.i18n.localize("eon.messages.valdSkadetype"));
            this.object.close = false;
            return;
        }
        else if (this.object.isdefence) {
            let utmattningIncrease = 0;
            let tacticKey = "defenseTacticStandard";

            switch(this.object.attacktype) {
                case 'defensivt':
                    utmattningIncrease = 1;
                    tacticKey = "defenseTacticDefensivt";
                    break;
                case 'kontring':
                    utmattningIncrease = 1;
                    tacticKey = "defenseTacticKontring";
                    break;
                default:
                    tacticKey = "defenseTacticStandard";
            }

            if (utmattningIncrease > 0) {
                const currentUtmattning = Number(this.actor.system?.skada?.utmattning?.varde ?? 0);
                await this.actor.update({
                    "system.skada.utmattning.varde": currentUtmattning + utmattningIncrease
                });
            }

            let attackerName = "?";
            if (this.linkedAttackMessageId) {
                const attackFlags = game.messages.get(this.linkedAttackMessageId)?.flags?.[EON_ATTACK_FLAG];
                attackerName = attackFlags?.attackerName ?? "?";
            }

            const tactic = game.i18n.localize(`eon.combatAttack.${tacticKey}`);
            roll.action = game.i18n.format("eon.combatAttack.defenseWithWeaponAgainst", {
                tactic,
                weapon: this.object.vapennamn.toLowerCase(),
                attacker: attackerName
            });
        }
        else {
            ui.notifications.error(game.i18n.localize("eon.messages.valdVapenanvandning"));
            this.object.close = false;
            return;
        }        

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        if (this.object.isattack && !this._targetContext) {
            this._targetContext = await CombatAttackFlow.buildTargetContext(this.actor, this.object.vapen);
            if (!this.selectedTargetCombatantId && this._targetContext?.defaultTargetId) {
                this.selectedTargetCombatantId = this._targetContext.defaultTargetId;
            }
        }

        if (this.object.isattack && this._targetContext?.requireTarget) {
            const selectEl = this.element?.find?.(".eon-attack-target-select")?.[0]
                ?? this.element?.[0]?.querySelector?.(".eon-attack-target-select");
            const selected = selectEl?.value ?? this.selectedTargetCombatantId;
            if (!selected) {
                ui.notifications.warn(game.i18n.localize("eon.combatAttack.selectTargetRequired"));
                this.object.close = false;
                return;
            }
            this.selectedTargetCombatantId = selected;
        }

        const attackFlowMeta = await this._buildAttackChatFlags();
        if (attackFlowMeta) {
            roll.chatFlags = attackFlowMeta.flags;
            this._combatAttackFlow = attackFlowMeta.flowState;
        }

        let allvarligBaseRoll = null;
        if (this.object.isdamage && this._combatAttackFlow?.flowId) {
            try {
                const allvarligRoll = await (new Roll("1d10")).evaluate();
                allvarligBaseRoll = Number(allvarligRoll.total);
                if (Number.isFinite(allvarligBaseRoll)) {
                    roll.description += game.i18n.format("eon.combatAttack.damageRollAllvarligBase", {
                        roll: allvarligBaseRoll
                    }) + "<br />";
                }
            } catch (err) {
                console.warn("eon-rpg | Kunde inte slå 1T10 för allvarlig skada", err);
            }
        }
        
        const result = await RollDice(roll);

        if (this.linkedAttackMessageId && this.object.isdefence) {
            const attackMsg = game.messages.get(this.linkedAttackMessageId);
            if (attackMsg) {
                await CombatAttackChat.resolveDefense(attackMsg, result, roll.action);
            }
            this.close();
            return;
        }

        if (this.object.isdamage && this._combatAttackFlow?.flowId) {
            let damageType = "hugg";
            if (this.object.usekross) damageType = "kross";
            if (this.object.usestick) damageType = "stick";
            const hitMsgId = this._combatAttackFlow.hitLocationMessageId;
            const hitMsg = hitMsgId
                ? game.messages.get(hitMsgId)
                : this._findHitLocationMessage(this._combatAttackFlow.flowId);
            if (hitMsg) {
                await CombatAttackChat.attachDamageCalculation(hitMsg.id, result, damageType, allvarligBaseRoll);
            }
            this.close();
            return;
        }

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
                const currentUtmattning = Number(this.actor.system?.skada?.utmattning?.varde ?? 0);
                await this.actor.update({
                    "system.skada.utmattning.varde": currentUtmattning + utmattningIncrease
                });
            }

            if (attackFlowMeta) {
                const msg = roll._createdMessageId
                    ? game.messages.get(roll._createdMessageId)
                    : CombatAttackChat.findAttackMessageByFlowId(attackFlowMeta.flowState.flowId);
                if (msg) {
                    await CombatAttackChat.afterAttackRolled(msg, result);
                } else {
                    ui.notifications.warn(game.i18n.localize("eon.combatAttack.attackMessageNotFound"));
                }
                this.close();
                return;
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
        event?.preventDefault();
        this.object.close = true;
        this.close();
    }

    _onAttackTypeClick(event) {
        event.preventDefault();
        if (this.object.isdamage) return;

        const button = event.currentTarget;
        const type = button.dataset.type;
        this.object.attacktype = type;
        this.render(true);
    }

    _resolveTargetName() {
        const targetContext = this._targetContext;
        if (!targetContext?.candidates?.length || !this.selectedTargetCombatantId) return "";
        const targetCandidate = targetContext.candidates.find(
            (candidate) => candidate.id === this.selectedTargetCombatantId
        );
        return targetCandidate?.name ?? "";
    }

    /**
     * @returns {Promise<{ flags: object, flowState: object }|null>}
     */
    async _buildAttackChatFlags() {
        if (!this.object.isattack || !this._targetContext?.showSelector) return null;
        if (!this.selectedTargetCombatantId) return null;

        const combat = game.combat;
        const attackerCombatant = CombatAttackFlow.findCombatantForActor(this.actor);
        const candidate = this._targetContext.candidates.find(
            (combatant) => combatant.id === this.selectedTargetCombatantId
        );
        if (!candidate || !combat) return null;

        if (attackerCombatant) {
            await CombatAttackFlow.saveLastTarget(combat, attackerCombatant.id, candidate.id);
        }

        const flowId = CombatAttackFlow.createFlowId();
        const defenderActor = candidate.actorId ? game.actors.get(candidate.actorId) : null;

        return {
            flowState: {
                flowId,
                defenderActorId: candidate.actorId,
                defenderName: candidate.name
            },
            flags: {
                attackFlowId: flowId,
                flowType: "attack",
                waitingForDefense: true,
                attackerActorId: this.actor.id,
                attackerName: this.actor.name,
                attackerCombatantId: attackerCombatant?.id ?? null,
                defenderCombatantId: candidate.id,
                defenderActorId: candidate.actorId,
                defenderName: candidate.name,
                weaponItemId: this.object.vapen?.id ?? null,
                weaponName: this.object.vapennamn,
                weaponType: this._targetContext.weaponType,
                weaponFattning: (this.object.fattning === "enhand" || this.object.fattning === "tvahand")
                    ? this.object.fattning
                    : null,
                attackResult: null
            }
        };
    }

    /**
     * @param {string} flowId
     * @returns {ChatMessage|undefined}
     */
    _findHitLocationMessage(flowId) {
        for (let messageIndex = game.messages.size - 1; messageIndex >= 0; messageIndex--) {
            const message = game.messages.contents[messageIndex];
            const attackFlags = message.flags?.[EON_ATTACK_FLAG];
            if (
                attackFlags?.attackFlowId === flowId
                && (attackFlags?.flowType === "resolution" || attackFlags?.flowType === "hitLocation")
                && attackFlags?.hit === true
            ) {
                return message;
            }
        }
        return undefined;
    }
}