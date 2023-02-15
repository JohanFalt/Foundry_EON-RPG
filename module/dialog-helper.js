import { DialogSkillRoll, SkillRoll } from "./dialogs/dialog-skill-roll.js";

export default class classDialogHelper {
    static async SkillDialog(event, actor) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset; 
        const item = await actor.getEmbeddedDocument("Item", dataset.itemid);

        const roll = new SkillRoll(item);
		let skillRollUse = new DialogSkillRoll(actor, roll);
		skillRollUse.render(true);
    }

}