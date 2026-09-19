import ItemHelper from "../item-helper.js";
import DialogHelper from "../dialog-helper.js";
import { DialogPickFardighet } from "../dialogs/dialog-pick-fardighet.js";
import PafrestningHelper from "../pafrestning-helper.js";

/**
 * Byt porträttbild via FilePicker och spara till actor.
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onEditImage(event, target) {
    event.preventDefault();
    if (!this.isEditable) return;

    const field = target.dataset.field || "img";
    const current = foundry.utils.getProperty(this.document, field);
    const FilePickerClass = foundry.applications.apps.FilePicker.implementation;

    const filePicker = new FilePickerClass({
        type: "image",
        current,
        callback: (path) => this.document.update({ [field]: path }),
        top: (this.position?.top ?? 0) + 40,
        left: (this.position?.left ?? 0) + 10
    });
    await filePicker.browse();
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onSkadaResource(event, target) {
    event.preventDefault();
    event.stopPropagation();
    if (target.classList.contains("disabled")) return;

    const dataset = target.dataset;
    const index = Number(dataset.index);
    const type = dataset.type;
    const value = dataset.value;
    const parent = target.closest("[data-name='skada']");
    if (!parent) return;

    const steps = parent.querySelectorAll(".resource-value");
    if (index < 1 || index > steps.length) return;

    let path;
    let current;
    if (type) {
        path = `system.skada.${type}.${value}`;
        current = Number.parseInt(this.actor.system.skada?.[type]?.[value] ?? 0, 10);
    } else {
        path = `system.skada.${value}`;
        current = Number.parseInt(this.actor.system.skada?.[value] ?? 0, 10);
    }

    const newValue = (current === 1 && index === 1) ? 0 : index;
    await this.actor.update({ [path]: newValue });

    for (const el of steps) {
        const stepIndex = Number.parseInt(el.dataset.index, 10);
        el.classList.toggle("active", Number.isFinite(stepIndex) && stepIndex <= newValue);
    }

    await this.render();
}

/**
 * Öppna ett manuellt Chock- eller Dödsslag mot en påfrestningsnivå.
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onPafrestningRoll(event, target) {
    event.preventDefault();
    await PafrestningHelper.openRoll(
        this.actor,
        target.dataset.pafrestning,
        target.dataset.slag
    );
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onPickFardighet(event, target) {
    event.preventDefault();

    const dialog = new DialogPickFardighet(this.actor, {
        onCreated: async (itemId) => {
            const item = await this.actor.getEmbeddedDocument("Item", itemId);
            item?.sheet?.render(true);
            await this.render();
        }
    });
    await dialog.render(true);
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onToggleSprakField(event, target) {
    event.preventDefault();
    if (target.classList.contains("disabled")) return;

    const itemId = target.dataset.itemId ?? target.dataset.itemid;
    const field = target.dataset.field;
    if (!itemId || !field) return;

    const item = await this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;

    await item.update({ [`system.${field}`]: !item.system[field] });
    await this.render();
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onItemCreate(event, target) {
    event.preventDefault();

    const syntheticEvent = { currentTarget: target, preventDefault: () => event.preventDefault() };
    const itemid = await ItemHelper.CreateItem(this.actor, syntheticEvent);
    if (!itemid) {
        ui.notifications.error(game.i18n.localize("eon.messages.typSaknarFunktion"));
        return;
    }
    const item = await this.actor.getEmbeddedDocument("Item", itemid);
    item?.sheet?.render(true);
    await this.render();
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onItemEdit(event, target) {
    event.preventDefault();
    event.stopPropagation();

    const dataset = target.dataset;
    if (dataset.type === "attribute") {
        DialogHelper.AttributeEditDialog(this.actor, dataset.source, dataset.attribute);
        return;
    }

    const itemId = dataset.itemId ?? dataset.itemid;
    if (!itemId) return;

    const item = await this.actor.getEmbeddedDocument("Item", itemId);
    item?.sheet?.render(true);
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onItemDelete(event, target) {
    event.preventDefault();
    const itemId = target.dataset.itemId ?? target.dataset.itemid;
    if (!itemId) return;

    const item = await this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
        title: game.i18n.localize("eon.dialogs.tarBort"),
        content: `<p>${game.i18n.format("eon.messages.bekraftaTaBortItem", { name: item.name })}</p>`
    });
    if (!confirmed) return;

    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onItemActive(event, target) {
    event.preventDefault();
    const itemId = target.dataset.itemId ?? target.dataset.itemid;
    if (!itemId) return;

    const item = await this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;

    const property = target.dataset.property ?? "buren";
    const newValue = !item.system.installningar?.[property];

    await item.update({ [`system.installningar.${property}`]: newValue });

    if (item.type === "Rustning" && property === "buren" && newValue) {
        for (const other of this.actor.items.filter(
            (i) => i.type === "Rustning" && i.id !== item.id && i.system.installningar?.buren
        )) {
            await other.update({ "system.installningar.buren": false });
        }
    }

    await this.render();
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onRollDialog(event, target) {
    event.preventDefault();
    const syntheticEvent = { currentTarget: target, preventDefault: () => event.preventDefault() };
    const dataset = target.dataset;

    if (dataset.type === "fardighet") {
        const itemId = dataset.itemId ?? dataset.itemid;
        if (!itemId) return;
        DialogHelper.SkillDialog({
            preventDefault: () => event.preventDefault(),
            currentTarget: { dataset: { itemid: itemId } }
        }, this.actor);
    } else if (dataset.source === "strid" && dataset.key) {
        const title = game.i18n.localize("eon.sheets.motstandare.anfallForsvar");
        DialogHelper.AttributeDialog(this.actor, "strid", dataset.key, title);
    } else if (dataset.source === "attribute") {
        const title = dataset.title
            ? dataset.title
            : game.i18n.localize(CONFIG.EON.harleddegenskaper?.[dataset.key]?.namn ?? dataset.key);
        DialogHelper.AttributeDialog(this.actor, dataset.type, dataset.key, title, dataset.rollkey ?? "");
    } else if (dataset.type === "vapen") {
        const itemId = dataset.itemId ?? dataset.itemid;
        if (!itemId) return;
        DialogHelper.WeaponDialog({
            preventDefault: () => event.preventDefault(),
            currentTarget: { dataset: { itemid: itemId } }
        }, this.actor);
    } else if (dataset.source === "mystery") {
        const itemId = dataset.itemId ?? dataset.itemid;
        if (!itemId) return;
        DialogHelper.MysteryDialog({
            preventDefault: () => event.preventDefault(),
            currentTarget: { dataset: { itemid: itemId } }
        }, this.actor);
    } else if (dataset.source === "spell") {
        const itemId = dataset.itemId ?? dataset.itemid;
        if (!itemId) return;
        DialogHelper.SpellDialog({
            preventDefault: () => event.preventDefault(),
            currentTarget: { dataset: { itemid: itemId } }
        }, this.actor);
    }
}

/**
 * @param {Event} event
 * @param {HTMLElement} target
 * @this {import("./eon5-actor-sheet-base.js").default}
 */
export async function onAttributeEdit(event, target) {
    event.preventDefault();
    DialogHelper.AttributeEditDialog(this.actor, target.dataset.source, target.dataset.attribute);
}
