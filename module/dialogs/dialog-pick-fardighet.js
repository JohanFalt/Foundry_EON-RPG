import CreateHelper from "../create-helper.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Färdighetsgrupper från data5fardigheter (exkl. språk och övriga). */
export const MOTSTANDARE_FARDIGHET_GRUPPER = [
    "strid", "rorelse", "social", "kunskap", "vildmark", "mystik"
];

/**
 * Dialog för att välja en systemfärdighet till Motstandare5 (grupp → färdighet).
 */
export class DialogPickFardighet extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, options = {}) {
        super(options);
        this.actor = actor;
        this.step = "group";
        this.selectedGroup = null;
        this.selectedSkill = null;
        this._onCreated = options.onCreated ?? null;
        this.options.window.title = game.i18n.localize("eon.dialogs.valjFardighet");
    }

    static DEFAULT_OPTIONS = {
        id: "eon-pick-fardighet",
        tag: "form",
        classes: ["EON", "EON5", "general-dialog", "eon-theme-light"],
        window: {
            icon: "fa-solid fa-book-open",
            resizable: true
        },
        position: {
            width: 420,
            height: "auto"
        },
        actions: {
            next: function (event) {
                event.preventDefault();
                const select = this.element?.querySelector('select[name="grupp"]');
                if (!select?.value) return;
                this.selectedGroup = select.value;
                this.selectedSkill = null;
                this.step = "skill";
                this.render();
            },
            back: function (event) {
                event.preventDefault();
                this.step = "group";
                this.selectedSkill = null;
                this.render();
            },
            save: async function (event) {
                event.preventDefault();
                const select = this.element?.querySelector('select[name="fardighet"]');
                if (!select?.value || !this.selectedGroup) return;

                const nyckel = select.value;
                const fardighet = game.EON.fardigheter5?.[this.selectedGroup]?.[nyckel];
                if (!fardighet) return;

                if (this.#actorHasSkill(this.selectedGroup, nyckel)) {
                    ui.notifications.warn(game.i18n.localize("eon.messages.fardighetFinnsRedan"));
                    return;
                }

                const version = game.system.version;
                const itemData = await CreateHelper.SkapaFardighetItem(
                    this.actor,
                    this.selectedGroup,
                    fardighet,
                    nyckel,
                    version
                );
                const created = await this.actor.createEmbeddedDocuments("Item", [itemData]);
                const itemId = created?.[0]?.id;

                if (this._onCreated && itemId) {
                    await this._onCreated(itemId);
                }

                await this.close();
            },
            cancel: function (event) {
                event.preventDefault();
                this.close();
            }
        }
    };

    static PARTS = {
        body: {
            template: "systems/eon-rpg/templates/dialogs/dialog-pick-fardighet.hbs"
        }
    };

    #actorHasSkill(grupp, nyckel) {
        return this.actor.items.some(
            (item) => item.type === "Färdighet"
                && item.system.grupp === grupp
                && item.system.id === nyckel
        );
    }

    #buildGrupper() {
        const grupper = [];
        for (const key of MOTSTANDARE_FARDIGHET_GRUPPER) {
            const label = CONFIG.EON.fardighetgrupper?.[key];
            if (!label || !game.EON.fardigheter5?.[key]) continue;
            grupper.push({ key, label });
        }
        return grupper;
    }

    #buildFardigheter(grupp) {
        const fardigheter = [];
        const catalog = game.EON.fardigheter5?.[grupp];
        if (!catalog) return fardigheter;

        for (const [key, data] of Object.entries(catalog)) {
            if (this.#actorHasSkill(grupp, key)) continue;
            fardigheter.push({ key, namn: data.namn });
        }

        fardigheter.sort((a, b) => {
            const nameA = game.i18n.has(a.namn) ? game.i18n.localize(a.namn) : a.namn;
            const nameB = game.i18n.has(b.namn) ? game.i18n.localize(b.namn) : b.namn;
            return nameA.localeCompare(nameB);
        });

        return fardigheter;
    }

    async _prepareContext() {
        const context = await super._prepareContext();
        const isGroupStep = this.step === "group";
        const grupper = this.#buildGrupper();
        const fardigheter = this.selectedGroup ? this.#buildFardigheter(this.selectedGroup) : [];

        if (!this.selectedGroup && grupper.length) {
            this.selectedGroup = grupper[0].key;
        }
        if (!this.selectedSkill && fardigheter.length) {
            this.selectedSkill = fardigheter[0].key;
        }

        return {
            ...context,
            isGroupStep,
            grupper,
            fardigheter,
            selectedGroup: this.selectedGroup,
            selectedSkill: this.selectedSkill,
            selectedGroupLabel: CONFIG.EON.fardighetgrupper?.[this.selectedGroup] ?? "",
            hasFardigheter: fardigheter.length > 0
        };
    }
}
