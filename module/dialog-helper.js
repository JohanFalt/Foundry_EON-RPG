import { DialogSkillRoll, SkillRoll } from "./dialogs/dialog-skill-roll.js";
import { DialogMysteryRoll, MysteryRoll } from "./dialogs/dialog-skill-roll.js";
import { DialogSpellRoll, SpellRoll } from "./dialogs/dialog-magic-roll.js";
import { DialogAttributeRoll, AttributeRoll } from "./dialogs/dialog-skill-roll.js";
import { DialogWeaponRoll, WeaponRoll } from "./dialogs/dialog-weapon-roll.js";
import { CombatRoll, DialogCombat } from "./dialogs/dialog-combat-roll.js";

import { DialogAttribute, DialogAttributeEdit } from "./dialogs/dialog-attribute-edit.js";

import ItemHelper from "./item-helper.js";

export default class classDialogHelper {
    static async SkillDialog(event, actor) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset; 
        const item = await actor.getEmbeddedDocument("Item", dataset.itemid);

        const roll = new SkillRoll(item, actor);
        let skillRollUse = new DialogSkillRoll(actor, roll);
        skillRollUse.render(true);
    }

    static async MysteryDialog(event, actor) {
		const element = event.currentTarget;
		const dataset = element.dataset; 
        const item = await actor.getEmbeddedDocument("Item", dataset.itemid);

        const roll = new MysteryRoll(item, actor);
        let mysteryRollUse = new DialogMysteryRoll(actor, roll);
        mysteryRollUse.render(true);
    }

    static async SpellDialog(event, actor) {
		const element = event.currentTarget;
		const dataset = element.dataset; 
        const item = await actor.getEmbeddedDocument("Item", dataset.itemid);

        const roll = new SpellRoll(item, actor);
		let spellRollUse = new DialogSpellRoll(actor, roll);
		spellRollUse.render(true);
    }

    static async AttributeDialog(actor, type, key, title) {
        const roll = new AttributeRoll(actor, type, key, title);
		let attributeRollUse = new DialogAttributeRoll(actor, roll);
		attributeRollUse.render(true);
    }

    static AttributeEditDialog(actor, type, key) {
        const attribute = new DialogAttribute(actor, type, key);
		let attributeRollUse = new DialogAttributeEdit(actor, attribute);
		attributeRollUse.render(true);
    }

    static async WeaponDialog(event, actor) {
		const element = event.currentTarget;
		const dataset = element.dataset; 
        const item = await actor.getEmbeddedDocument("Item", dataset.itemid);

        const roll = new WeaponRoll(actor, item);
		let weaponRollUse = new DialogWeaponRoll(actor, roll);
		weaponRollUse.render(true);
    }

    static async CombatDialog(actor) {
        const roll = new CombatRoll(actor);
        let combatRollUse = new DialogCombat(actor, roll);
		combatRollUse.render(true);
    }

    static async VandningDialog(actor, bonus) {
        const vandningid = actor.system.skada?.vandning?.listaid;

        if ((vandningid != undefined) && (vandningid != "")) {
            let table = await ItemHelper.GetCreatureCombatTurn(vandningid);

            // Template for the dialog form
            const template = `
                <form>
                    <div class="form-group">
                        <label>Modifiering</label>
                        <input id="numberValue" value="${bonus}" />
                    </div>
                </form>`;

            // Define dialog buttons
            const buttons = {
                submit: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Skicka',
                    callback: async (html) => {
                        let value = html.find('#numberValue')[0].value;
                        let formula = "1d10";

                        if (value != "") {
                            formula = `1d10+${value}`;
                        }

                        const roll = await new Roll(formula);
                        // #243
                        //const table = game.tables.find(i => i._id === vandning);
                        await table.draw({roll});
                    }
                }
            }

            // Display the dialog
            new Dialog({
                title: 'Slå för vändning',
                content: template,
                buttons,
                default: 'submit'
            }, {
                classes: ['eon']
            }).render(true);
        }
    }
}