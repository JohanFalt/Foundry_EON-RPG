//import ActionHelper from "../scripts/action-helpers.js";

export class EonItemSheet extends ItemSheet {
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["itemsheet"]
		});
	}

	constructor(item, options) {
		super(item, options);

		this.isCharacter = false;	
		this.isGM = game.user.isGM;			

		console.log("WoD | Item Sheet constructor");
	}

	/** @override */
	get template() {
		let sheet = this.item.type;
		sheet = sheet.toLowerCase().replace(" ", "");

		return `systems/eon-rpg/templates/items/${sheet}-sheet.html`;
	}

	/** @override */
	get title() {
		let title = this.item.name;
		
		if (this.item.system.namn != undefined) {
			if (this.item.system.namn != "") {
				title = this.item.system.namn;
			}
		}

		return "Editera " + title;
	}

	/** @override */
	async getData() {
		const itemData = duplicate(this.item);		

		if (!itemData.system.iscreated) {
			itemData.system.version = game.data.system.version;
			itemData.system.iscreated = true;
			this.item.update(itemData);
		}

		const data = await super.getData();

		data.isCharacter = this.isCharacter;
		data.EON = game.EON;
		data.EON.CONFIG = CONFIG.EON;

		/* if (this.item.actor != null) {
			data.hasActor = true;
		}
		else {
			data.hasActor = false;
		}
 */
		console.log(data.item.type);
		console.log(data.item);
		
		return data;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		html
            .find('.tic')
            .click(this._ticValue.bind(this));

		html
            .find('.svarighet')
            .click(this._setSvarighet.bind(this));			
	}

	async _ticValue(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemData = duplicate(this.item);

		const ticType = dataset.tictype;

		if (dataset.ticdirection == "up") {
			itemData.system.varde[ticType] += 1;
		}
		if (dataset.ticdirection == "down") {
			itemData.system.varde[ticType] -= 1;			
		}

		if ((itemData.system.varde.bonus > 3) && (itemData.system.varde.tvarde < 5)) {
			itemData.system.varde.tvarde += 1;
			itemData.system.varde.bonus = 0;
		}

		if ((itemData.system.varde.bonus < -1) && (itemData.system.varde.tvarde > 1)) {
			itemData.system.varde.tvarde -= 1;
			itemData.system.varde.bonus = 2;
		}

		if (itemData.system.varde.tvarde > 5) {
			itemData.system.varde.tvarde = 5;
			itemData.system.varde.bonus = 0;
		}
		
		if (itemData.system.varde.tvarde < 0) {
			itemData.system.varde.tvarde = 0;
			itemData.system.varde.bonus = 0;
		}

		await this.item.update(itemData);

		this.render();
	}

	async _setSvarighet(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const itemData = duplicate(this.item);

		itemData.system.installningar.lattlard = false;
		itemData.system.installningar.svarlard = false;
		itemData.system.installningar.normal = true;

		if ((dataset.value == "S") && (!this.item.system.installningar.svarlard)) {
			itemData.system.installningar.svarlard = true;
			itemData.system.installningar.normal = false;
		}
		if ((dataset.value == "L") && (!this.item.system.installningar.lattlard)) {
			itemData.system.installningar.lattlard = true;
			itemData.system.installningar.normal = false;
		}
		
		await this.item.update(itemData);

		this.render();
	}
}
