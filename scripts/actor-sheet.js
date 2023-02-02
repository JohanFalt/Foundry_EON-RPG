export class EonActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["rollperson"],
            tabs: [{
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "skill",
			    },
                {
                    navSelector: ".sheet-mystic-tabs",
                    contentSelector: ".sheet-mystic-body",
                    initial: "magic",
                }
            ]
		});
	}
  
    /** @override */
	constructor(actor, options) {
        super(actor, options);

        this.locked = false;
		this.isCharacter = true;	
		this.isGM = game.user.isGM;	
    }

    /** @override */
	get template() {
        let sheet = "rollperson";

        if ((this.actor.system?.type != undefined)&&(this.actor.system?.type == "")){
            sheet = this.actor.system.type;
        }

		sheet = sheet.toLowerCase().replace(" ", "");
		return `systems/eon-rpg/templates/actors/${sheet}-sheet.html`;
	}

    /** @override */
    async getData() {
        const data = await super.getData();	
        console.log(data.actor);

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
    }
}