import CalculateHelper from "../calculate-helper.js";
import CreateHelper from "../create-helper.js";
import DialogHelper from "../dialog-helper.js";
import {
    onAttributeEdit,
    onItemActive,
    onItemCreate,
    onItemDelete,
    onItemEdit,
    onPickFardighet,
    onRollDialog,
    onSkadaResource,
    onToggleSprakField
} from "./eon5-sheet-actions.js";
import { MOTSTANDARE_FARDIGHET_GRUPPER } from "../dialogs/dialog-pick-fardighet.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Gemensam ApplicationV2-bas för Eon 5 actor sheets (Motstandare5, senare Rollperson5).
 */
export default class Eon5ActorSheetBase extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
    constructor(options = {}) {
        super(options);
        this.locked = false;
        this.isPC = false;
        this.isCharacter = true;
        this.isGM = game.user.isGM;
    }

    get title() {
        return this.actor.name;
    }

    static DEFAULT_OPTIONS = {
        form: {
            submitOnChange: true,
            closeOnSubmit: false,
            handler: Eon5ActorSheetBase.onSubmitActorForm
        },
        window: {
            icon: "fa-solid fa-dice-d10",
            resizable: true
        },
        classes: ["EON", "EON5", "eon-theme-light"],
        position: {
            width: 920,
            height: 720
        },
        actions: {
            itemCreate: onItemCreate,
            itemEdit: onItemEdit,
            itemDelete: onItemDelete,
            itemActive: onItemActive,
            pickFardighet: onPickFardighet,
            rollDialog: onRollDialog,
            skadaResource: onSkadaResource,
            toggleSprakField: onToggleSprakField,
            attributeEdit: onAttributeEdit
        },
        dragDrop: [{
            dragSelector: "[data-drag]",
            dropSelector: "form"
        }]
    };

    tabGroups = {
        primary: "oversikt"
    };

    tabs = {};

    getTabs() {
        const tabs = this.tabs;

        for (const key in tabs) {
            if (tabs[key].hidden) delete tabs[key];
        }

        for (const tab of Object.values(tabs)) {
            tab.active = this.tabGroups[tab.group] === tab.id;
            tab.cssClass = tab.active ? "active" : "";
        }

        return tabs;
    }

    /**
     * @param {Actor} actor
     */
    buildListData(actor) {
        const listdata = {
            fardigheter: {
                strid: [], rorelse: [], mystik: [], social: [],
                kunskap: [], sprak: [], vildmark: [], ovriga: []
            },
            utrustning: {
                vapen: { narstrid: [], avstand: [], skold: [] },
                rustning: []
            },
            religion: {
                mysterie: []
            },
            magi: {
                besvarjelse: [],
                kongelat: []
            },
            skador: []
        };

        for (const item of actor.items) {
            if (item.type === "Färdighet" && listdata.fardigheter[item.system.grupp]) {
                listdata.fardigheter[item.system.grupp].push(item);
            }
            if (item.type === "Språk") {
                listdata.fardigheter.sprak.push(item);
            }
            if (item.type === "Närstridsvapen") {
                listdata.utrustning.vapen.narstrid.push(item);
            }
            if (item.type === "Avståndsvapen") {
                listdata.utrustning.vapen.avstand.push(item);
            }
            if (item.type === "Sköld") {
                listdata.utrustning.vapen.skold.push(item);
            }
            if (item.type === "Rustning") {
                listdata.utrustning.rustning.push(item);
            }
            if (item.type === "Skada") {
                listdata.skador.push(item);
            }
            if (item.type === "Mysterie") {
                listdata.religion.mysterie.push(item);
            }
            if (item.type === "Besvärjelse") {
                listdata.magi.besvarjelse.push(item);
            }
            if (item.type === "Utrustning" && item.system?.typ === "kongelat") {
                listdata.magi.kongelat.push(item);
            }
        }

        const skillDisplayName = (name) =>
            name && game.i18n.has(name) ? game.i18n.localize(name) : (name || "");

        for (const grupp of Object.keys(listdata.fardigheter)) {
            listdata.fardigheter[grupp].sort((a, b) =>
                skillDisplayName(a.name).localeCompare(skillDisplayName(b.name))
            );
        }

        listdata.utrustning.vapen.narstrid.sort((a, b) => a.name.localeCompare(b.name));
        listdata.utrustning.vapen.avstand.sort((a, b) => a.name.localeCompare(b.name));
        listdata.utrustning.vapen.skold.sort((a, b) => a.name.localeCompare(b.name));
        listdata.utrustning.rustning.sort((a, b) => a.name.localeCompare(b.name));
        listdata.religion.mysterie.sort((a, b) => a.name.localeCompare(b.name));
        listdata.magi.besvarjelse.sort((a, b) => a.name.localeCompare(b.name));
        listdata.magi.kongelat.sort((a, b) => a.name.localeCompare(b.name));
        listdata.skador.sort((a, b) => a.name.localeCompare(b.name));

        const fardigheterFlat = [];
        for (const item of actor.items) {
            if (item.type === "Färdighet" || item.type === "Språk") {
                fardigheterFlat.push(item);
            }
        }
        listdata.fardigheterFlat = fardigheterFlat.sort((a, b) =>
            skillDisplayName(a.name).localeCompare(skillDisplayName(b.name))
        );

        listdata.fardigheterStandard = MOTSTANDARE_FARDIGHET_GRUPPER
            .flatMap((grupp) => listdata.fardigheter[grupp] ?? []);
        listdata.fardigheterStandard.sort((a, b) =>
            skillDisplayName(a.name).localeCompare(skillDisplayName(b.name))
        );

        return listdata;
    }

    async ensureActorInitialized() {
        if (this.actor.system?.installningar?.skapad) {
            const actorData = foundry.utils.duplicate(this.actor.toObject());
            await CalculateHelper.hanteraBerakningar(actorData);

            const updates = {};

            if (actorData.system.egenskap?.fokus?.max !== this.actor.system.egenskap?.fokus?.max) {
                updates["system.egenskap.fokus.max"] = actorData.system.egenskap.fokus.max;
            }
            if (actorData.system.egenskap?.fokus?.varde !== this.actor.system.egenskap?.fokus?.varde) {
                updates["system.egenskap.fokus.varde"] = actorData.system.egenskap.fokus.varde;
            }
            if (actorData.system.skada?.utmattning?.grund !== this.actor.system.skada?.utmattning?.grund) {
                updates["system.skada.utmattning.grund"] = actorData.system.skada.utmattning.grund;
            }
            if (actorData.system.skada?.utmattning?.varde !== this.actor.system.skada?.utmattning?.varde) {
                updates["system.skada.utmattning.varde"] = actorData.system.skada.utmattning.varde;
            }

            if (actorData.system.harleddegenskaper?.grundskada && JSON.stringify(actorData.system.harleddegenskaper.grundskada) !== JSON.stringify(this.actor.system.harleddegenskaper?.grundskada)) {
                updates["system.harleddegenskaper.grundskada"] = actorData.system.harleddegenskaper.grundskada;
            }
            if (actorData.system.harleddegenskaper?.grundrustning && JSON.stringify(actorData.system.harleddegenskaper.grundrustning) !== JSON.stringify(this.actor.system.harleddegenskaper?.grundrustning)) {
                updates["system.harleddegenskaper.grundrustning"] = actorData.system.harleddegenskaper.grundrustning;
            }
            if (Object.keys(updates).length > 0) {
                await this.actor.update(updates);
            }

            return;
        }

        const version = game.system.version;
        const update = {
            "system.installningar.skapad": true,
            "system.installningar.eon": "eon5",
            "system.installningar.version": version
        };

        if (this.actor.type === "Motstandare5") {
            update["system.installningar.motstandare"] = true;
        }

        await this.actor.update(update);

        if (this.actor.type !== "Motstandare5"
            && !this.actor.items.some(i => i.type === "Färdighet")) {
            await CreateHelper.SkapaFardigheter(this.actor, CONFIG.EON, version);
        }
    }

    async _prepareContext(options) {
        await this.ensureActorInitialized();

        const context = await super._prepareContext(options);
        const actor = this.actor;
        actor.system.berakning = CalculateHelper.byggRollBerakning(actor);

        context.tabs = this.getTabs();
        context.EON = game.EON;
        context.EON.CONFIG = CONFIG.EON;
        context.actor = actor;
        context.data = actor;
        const listdata = this.buildListData(actor);
        context.listdata = listdata;
        actor.system.listdata = listdata;
        context.locked = this.locked;
        context.isPC = this.isPC;
        context.isGM = this.isGM;
        context.isEditable = this.isEditable;

        context.beskrivning = actor.system?.bakgrund?.beskrivning ?? "";
        context.enrichedBeskrivning = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            context.beskrivning
        );
        context.enrichedRelationer = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            actor.system?.bakgrund?.relationer ?? ""
        );

        return context;
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        context = { ...context, ...partContext };
        context.actor = context.actor ?? this.actor;
        context.data = context.data ?? this.actor;

        if (context.tabs?.[partId]) {
            context.tab = context.tabs[partId];
        }

        return context;
    }

    /** Rot-element för sheet-DOM (ApplicationV2: element kan vara form eller wrapper). */
    _getSheetRoot() {
        if (!this.element) return null;
        if (this.element.tagName === "FORM") return this.element;
        return this.element.querySelector("form") ?? this.element;
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        this._bindMacroButtons();
        this._setupResourceBoxes();
    }

    /** Sätter active-klass på resursrutor (smärta, blödning, sår m.m.). */
    _setupResourceBoxes() {
        const root = this._getSheetRoot();
        if (!root) return;

        for (const box of root.querySelectorAll("[data-name='skada'][data-value], .resource-circle[data-value]")) {
            const value = Number.parseInt(box.dataset.value, 10);
            if (!Number.isFinite(value)) continue;

            for (const el of box.querySelectorAll(":scope > .resource-value")) {
                const index = Number.parseInt(el.dataset.index, 10);
                if (!Number.isFinite(index)) continue;
                el.classList.toggle("active", index <= value);
            }
        }
    }

    /** Chock-/dödsslag i headern (samma mönster som Varelse). */
    _bindMacroButtons() {
        const root = this._getSheetRoot();
        if (!root) return;

        for (const btn of root.querySelectorAll(".macroBtn:not([data-eon-bound])")) {
            btn.dataset.eonBound = "true";
            btn.addEventListener("click", (event) => {
                event.preventDefault();
                const dataset = btn.dataset;
                if (dataset.source !== "attribute") return;
                const title = dataset.title ?? "";
                DialogHelper.AttributeDialog(this.actor, dataset.type, dataset.key, title);
            });
        }
    }

    static async onSubmitActorForm(event, form, formData) {
        const target = event.target;
        if (!target?.name) return;

        if (this.locked && target.name !== "name") {
            ui.notifications.warn(game.i18n.localize("eon.sheets.actor.last"));
            return;
        }

        if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
            let value = target.value;
            if (target.type === "number") {
                value = target.value === "" ? 0 : Number(target.value);
            } else if (target.type === "checkbox") {
                value = target.checked;
            }
            await this.actor.update({ [target.name]: value });
            return;
        }

        const submitData = this._prepareSubmitData(event, form, formData);
        const overrides = foundry.utils.flattenObject(this.actor.overrides ?? {});
        for (const key of Object.keys(overrides)) {
            delete submitData[key];
        }

        const submitDataFlat = foundry.utils.flattenObject(submitData);
        if (!(target.name in submitDataFlat)) return;

        await this.actor.update(
            foundry.utils.expandObject({ [target.name]: submitDataFlat[target.name] })
        );
    }

    /** @override */
    async _onDrop(event) {
        if (!this.isEditable) return;
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (!data?.uuid) return;

        const dropped = await foundry.utils.fromUuid(data.uuid);
        if (!(dropped instanceof Item)) return;

        if (dropped.type === "Folkslag" || dropped.type === "Folkslag5") {
            ui.notifications.warn(game.i18n.format("eon.messages.folkslagKanInteLaggasTill", { type: this.actor.type }));
            return;
        }

        const itemData = foundry.utils.duplicate(dropped.toObject());
        itemData.system.installningar = itemData.system.installningar ?? {};
        itemData.system.installningar.eon = "eon5";
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
}
