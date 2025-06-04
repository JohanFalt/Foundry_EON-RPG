/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class EonActor extends Actor {
    /**
   * Augment the basic actor data with additional dynamic data.
   */
    prepareData() {
        // This exists because if an actor exists from another system,
        // the prepareData function will get stuck in a loop. For some reason Foundry isn't registering
        // those kinds of actors as invalid, and thus this is a quick way to make sure people can
        // still load their worlds with those invalid actors.
        if (game.actors.invalidDocumentIds.has(this.id)) {
            return
        }

        super.prepareData();

        const actorData = this;
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData(actorData);
    }

  /**
   * Prepare Character type specific data
   */
    _prepareCharacterData(actorData) {
        //let listData = [];
        //actorData.listData = listData;
    }

    /**
     * @override
     * Handle data that happens before the creation of a new item document
     */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
    }

  /**
   * @override
   * Post-process a creation operation for a single Document instance. Post-operation events occur for all connected clients.
   * @param data - The initial data object provided to the document creation request
   * @param options - Additional options which modify the creation request
   * @param userId - The id of the User requesting the document update
  */
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);  
    }

    async _onUpdate(updateData, options, user) {
        super._onUpdate(updateData, options, user);  
    }
}

// After defining your class, override the static createDialog:
EonActor.createDialog = function (data = {}, createOptions = [], options = {}) {
  // Add your custom types or UI modifications
  
  const types = ["Rollperson", "Rollperson5", "Varelse"];
  options.types = types;

  //options.types = ["white", "listed", "types"];

  const version = game.settings.get("eon-rpg", "bookEon");

  if (version === "eon4") {
    data.type = data.type || "Rollperson";
  }

  if (version === "eon5") {
    data.type = data.type || "Rollperson5";
  }  

  // Optionally log to confirm this runs
  console.log("Custom createDialog triggered for EonActor");

  // Call the original method from the base Actor class
  return Actor.createDialog.call(this, data, createOptions, options);
};