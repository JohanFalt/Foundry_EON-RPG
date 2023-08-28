export default class EonCreatureSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["EON varelse"]
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
        let sheet = "varelse";

        if ((this.actor.system?.type != undefined)&&(this.actor.system?.type == "")){
            sheet = this.actor.system.type;
        }

		sheet = sheet.toLowerCase().replace(" ", "");
		return `systems/eon-rpg/templates/actors/${sheet}-sheet.html`;
	}

    /** @override */
    async getData() {
        const actorData = duplicate(this.actor);	
        const version = game.data.system.version;	

		if (!actorData.system.installningar.skapad) {
            
		}	
        else {
            
        }
        
        const data = await super.getData();	

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;

        console.log(data.actor);
        console.log(data.EON);

        return data;
    }
}