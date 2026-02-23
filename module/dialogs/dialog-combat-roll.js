import { DiceRollContainer } from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";
import { CombatHelper } from "../combat-helper.js";
import { SubcombatManager } from "../subcombat-manager.js";

export class CombatRoll {
    constructor(actor) {
        this.actorid = actor._id;
        this.grundInitiativ = parseInt(actor.system.harleddegenskaper.initiativ.totalt.tvarde);
        this.bonusInitiativ = parseInt(actor.system.harleddegenskaper.initiativ.totalt.bonus);

        this.isdistance = false;
        this.isclose = false;
        this.ismystic = false;
        this.isother = false;
        this.canroll = false;
        this.canclose = false;
        this.selectedRole = null; // "attacker" or "defender" for close combat
        this.showRoleSelection = false; // Show role selection when close combat is selected
        this.showOpponentSelection = false; // Show opponent selection when attacker is selected
        this.availableOpponents = []; // List of available opponents for subcombat
    }
}

// Use ApplicationV2 with HandlebarsApplicationMixin for template rendering
export class DialogCombat extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(actor, roll, options = {}) {
        // Merge options with title before calling super
        const mergedOptions = foundry.utils.mergeObject(options, { 
            title: actor.name
        });
        super(mergedOptions);
        this.actor = actor; 
        this.object = roll; // Store roll data as object
        this.config = game.EON.CONFIG;    
        this.isDialog = true;  
        this._combatantUpdateHook = null; // Store hook reference for cleanup
    }
    
    /**
     * Register hook to update opponent list when other combatants change phase
     */
    _registerCombatantUpdateHook() {
        // Remove existing hook if any
        if (this._combatantUpdateHook) {
            Hooks.off("updateCombatant", this._combatantUpdateHook);
        }
        
        // Register new hook
        this._combatantUpdateHook = async (combatant, updateData) => {
            // Only update if this dialog is waiting for opponent selection
            if (this.object.showOpponentSelection && this.object.selectedRole === "attacker") {
                // Check if phase was updated to close combat
                if (updateData.flags?.["eon-rpg"]?.phase === "initiative_close") {
                    // Skip if it's our own combatant
                    if (combatant.actor._id === this.actor._id) return;
                    
                    // Preserve selected opponents before reloading
                    const selectedOpponentIds = this.object.availableOpponents
                        .filter(o => o.selected)
                        .map(o => o.id);
                    
                    // Reload opponents list
                    let token = await canvas.tokens.placeables.find(t => t.document.actor._id === this.object.actorid);
                    if (token) {
                        await this._loadAvailableOpponents(token);
                        
                        // Restore selected state for opponents that still exist
                        for (const opponent of this.object.availableOpponents) {
                            if (selectedOpponentIds.includes(opponent.id)) {
                                opponent.selected = true;
                            }
                        }
                        
                        this.render();
                    }
                }
            }
        };
        
        Hooks.on("updateCombatant", this._combatantUpdateHook);
    }
    
    /**
     * Clean up hooks when dialog closes
     */
    async close(options = {}) {
        // Remove combatant update hook
        if (this._combatantUpdateHook) {
            Hooks.off("updateCombatant", this._combatantUpdateHook);
            this._combatantUpdateHook = null;
        }
        
        return super.close(options);
    }

    // static get defaultOptions() {
    //     //let mode = (game.settings.get('core', 'uiConfig').colorScheme.applications == "dark" ? " wod-theme-dark " : " wod-theme-light ");
    //     let mode = " wod-theme-light ";

    //     return foundry.utils.mergeObject(super.defaultOptions, {
    //         classes: ["EON general-dialog" + mode],
    //         title: "",
    //         window: {
    //             resizable: true
    //         },
    //         position: {
    //             width: 600,
    //             height: 700
    //         },
    //         tabs: [],
    //         dragDrop: []
    //     });
    // }

    static DEFAULT_OPTIONS = {
		form: {
		},
		classes: ["EON", "general-dialog", "wod-theme-light"],
		window: {
			icon: 'fa-solid fa-dice-d10',
			resizable: true
		},
		position: {
			width: 600,
			height: 700
		},
		actions: {	},
		dragDrop: [ ]
	}

    static PARTS = {
        content: {
            template: "systems/eon-rpg/templates/dialogs/dialog-combat-roll.html"
        }
    }

    async _prepareContext(options = {}) {
        // Get base context from super (HandlebarsApplicationMixin)
        const data = await super._prepareContext?.(options) || {};
        
        // Merge our data with the context
        return foundry.utils.mergeObject(data, {
            object: this.object,
            actor: this.actor,
            config: this.config,
            cssClass: this.options.classes.join(" ")
        });
    }

    async _preparePartContext(partId, context, options) {
        // Inherit any preparation from the extended class
        context = { ...(await super._preparePartContext?.(partId, context, options) || {}) };

        // Prepare context for the content part
        if (partId === "content") {
            // If attacker role is selected and opponent selection is shown, reload available opponents
            // This ensures the list is updated when other combatants select close combat phase
            if (this.object.showOpponentSelection && this.object.selectedRole === "attacker") {
                let token = await canvas.tokens.placeables.find(t => t.document.actor._id === this.object.actorid);
                if (token) {
                    // Preserve selected opponents before reloading
                    const selectedOpponentIds = this.object.availableOpponents
                        .filter(o => o.selected)
                        .map(o => o.id);
                    
                    await this._loadAvailableOpponents(token);
                    
                    // Restore selected state for opponents that still exist
                    for (const opponent of this.object.availableOpponents) {
                        if (selectedOpponentIds.includes(opponent.id)) {
                            opponent.selected = true;
                        }
                    }
                }
            }
            
            // Merge our data with the context
            return foundry.utils.mergeObject(context, {
                object: this.object,
                actor: this.actor,
                config: this.config,
                cssClass: this.options.classes.join(" ")
            });
        }

        return context;
    }

    _onRender() {
        super._onRender();
        // ApplicationV2 handles size via position object in defaultOptions
        // No need to manually set CSS here
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.mode')
            .click(this._setMode.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
        
        // Role selection buttons (for close combat)
        html
            .find('.role-btn')
            .click(this._setRole.bind(this));
        
        // Opponent selection checkboxes (for attackers)
        html
            .find('.opponent-checkbox')
            .change(this._toggleOpponent.bind(this));
        
        // Create subcombat button
        html
            .find('.create-subcombat-btn')
            .click(this._createSubcombat.bind(this));
    }    

    // V2 Application doesn't use _updateObject, form handling is done via event listeners
    // This method is kept for compatibility but shouldn't be called
    async _updateObject(event, formData) {
        // Form handling is now done via event listeners in activateListeners
        // This method is deprecated but kept for backwards compatibility
    }

    async _setMode(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
        const type = dataset.type;

        this.object.isdistance = false;
        this.object.isclose = false;
        this.object.ismystic = false;
        this.object.isother = false;
        this.object.canroll = false;
        this.object.showRoleSelection = false;
        this.object.showOpponentSelection = false;
        this.object.selectedRole = null;
        this.object.availableOpponents = [];

        if (type == "initiative_distance") {
            this.object.isdistance = true;
            this.object.canroll = true;
        }
        if (type == "initiative_close") {
            this.object.isclose = true;
            this.object.showRoleSelection = true; // Show role selection for close combat
            this.object.canroll = false; // Can't roll until role is selected
        }
        if (type == "initiative_mystic") {
            this.object.ismystic = true;
            this.object.canroll = true;
        }
        if (type == "initiative_other") {
            this.object.isother = true;     
            this.object.canroll = true;       
        }

        let token = await canvas.tokens.placeables.find(t => t.document.actor._id === this.object.actorid);

        if(token) {
            // Save phase first before clearing icons to prevent reset
            await this._savePhaseToCombatant(type, token);
            await this._clearOtherIcons(token, type);
            await this._applyStatusEffect(token, token.actor, type, true);
            
            // Automatically roll initiative for non-close combat phases
            if (type !== "initiative_close") {
                await this._rollInitiativeAutomatically(type, token);
            }
        }

        this.render();
    }

    /**
     * Handle role selection (attacker/defender) for close combat
     * @param {Event} event - Click event
     */
    async _setRole(event) {
        event.preventDefault();
        const role = event.currentTarget.dataset.role;
        this.object.selectedRole = role;
        
        let token = await canvas.tokens.placeables.find(t => t.document.actor._id === this.object.actorid);
        
        if (!token || !game.combat || !token.combatant) {
            this.render();
            return;
        }
        
        // Save role to combatant flags
        await this._saveRoleToCombatant(role, token);
        
        if (role === "defender") {
            // Defender goes to main group, can roll initiative
            this.object.showOpponentSelection = false;
            this.object.canroll = true;
            
            // Update to main group
            await this._updateCombatantGroup(token.combatant, "main", "main", role);
            
            // Apply defender status effect
            await this._applyStatusEffect(token, token.actor, "subcombat_defender", true);
            await this._applyStatusEffect(token, token.actor, "subcombat_attacker", false);
            
            // Automatically roll initiative for defender
            await this._rollInitiativeAutomatically("initiative_close", token);
        } else if (role === "attacker") {
            // Attacker needs to select opponents, load available opponents
            this.object.showOpponentSelection = true;
            this.object.canroll = false; // Can't roll until subcombat is created
            
            // Apply attacker status effect (will be updated when subcombat is created)
            await this._applyStatusEffect(token, token.actor, "subcombat_attacker", true);
            await this._applyStatusEffect(token, token.actor, "subcombat_defender", false);
            
            await this._loadAvailableOpponents(token);
            
            // Register hook to update opponent list when other combatants select close combat
            this._registerCombatantUpdateHook();
        }
        
        this.render();
    }
    
    /**
     * Save role to combatant flags
     * @param {string} role - "attacker" or "defender"
     * @param {Token} token - The token
     */
    async _saveRoleToCombatant(role, token) {
        if (!game.combat || !token || !token.combatant) return;
        
        const combatant = token.combatant;
        const flags = combatant.flags["eon-rpg"] || {};
        
        await combatant.update({
            flags: {
                "eon-rpg": {
                    ...flags,
                    subcombatRole: role
                }
            }
        });
    }
    
    /**
     * Load available opponents for subcombat creation
     * Shows all combatants in close combat phase that can be attacked
     */
    async _loadAvailableOpponents(token) {
        if (!game.combat) return;
        
        const opponents = [];
        const combatants = Array.from(game.combat.combatants);
        
        for (const combatant of combatants) {
            // Skip self
            if (combatant.actor._id === this.actor._id) continue;
            
            // Only show combatants in close combat phase
            const phase = combatant.flags["eon-rpg"]?.phase;
            if (phase !== "initiative_close") continue;
            
            // Can attack if:
            // - They are in main group (not in a subcombat yet), OR
            // - They are defender in another subcombat (can be in multiple subcombats)
            const groupId = combatant.flags["eon-rpg"]?.groupId;
            const groupType = combatant.flags["eon-rpg"]?.groupType;
            
            if (!groupId || groupId === "main" || groupType === "subcombat") {
                opponents.push({
                    id: combatant.id,
                    name: combatant.name,
                    actorId: combatant.actor._id,
                    currentRole: combatant.flags["eon-rpg"]?.subcombatRole || null,
                    currentGroupId: groupId || "main",
                    selected: false
                });
            }
        }
        
        this.object.availableOpponents = opponents;
    }
    
    /**
     * Toggle opponent selection checkbox
     * @param {Event} event - Change event
     */
    _toggleOpponent(event) {
        const checkbox = event.currentTarget;
        const opponentId = checkbox.dataset.opponentId;
        
        const opponent = this.object.availableOpponents.find(o => o.id === opponentId);
        if (opponent) {
            opponent.selected = checkbox.checked;
        }
    }
    
    /**
     * Get selected opponents
     * @returns {Array} Array of selected opponent objects
     */
    _getSelectedOpponents() {
        return this.object.availableOpponents.filter(o => o.selected);
    }
    
    /**
     * Create subcombat with selected opponents
     * @param {Event} event - Click event
     */
    async _createSubcombat(event) {
        event.preventDefault();
        
        const selectedOpponents = this._getSelectedOpponents();
        
        if (selectedOpponents.length === 0) {
            ui.notifications.warn("Välj minst en motståndare!");
            return;
        }
        
        let token = await canvas.tokens.placeables.find(t => t.document.actor._id === this.object.actorid);
        if (!token || !game.combat || !token.combatant) {
            ui.notifications.error("Kunde inte hitta token eller combatant");
            return;
        }
        
        try {
            // Create subcombat
            const subcombatId = await SubcombatManager.createSubcombat(
                this.actor,
                selectedOpponents.map(o => o.id),
                "attacker"
            );
            
            // Update combatant to be in subcombat
            await this._updateCombatantGroup(token.combatant, subcombatId, "subcombat", "attacker");
            
            // Apply status effects to all combatants in subcombat
            await this._applyStatusEffect(token, token.actor, "subcombat_attacker", true);
            
            // Apply defender status effects to opponents
            for (const opponent of selectedOpponents) {
                const opponentToken = canvas.tokens.placeables.find(t => t.document.actor._id === opponent.actorId);
                if (opponentToken) {
                    await this._applyStatusEffect(opponentToken, opponentToken.actor, "subcombat_defender", true);
                }
            }
            
            // Re-sort combatants
            await CombatHelper.sortCombatantsByPhase(game.combat);
            
            // Can now roll initiative
            this.object.canroll = true;
            this.object.showOpponentSelection = false;
            
            ui.notifications.info(`Delstrid skapad: ${this.actor.name} attackerar ${selectedOpponents.length} motståndare`);
            
            // Automatically roll initiative for attacker after subcombat is created
            await this._rollInitiativeAutomatically("initiative_close", token);
            
            this.render();
        } catch (error) {
            console.error("Error creating subcombat:", error);
            ui.notifications.error(`Kunde inte skapa delstrid: ${error.message}`);
        }
    }
    
    /**
     * Update combatant group information
     * @param {Combatant} combatant - The combatant
     * @param {string} groupId - Group ID ("main" or "subcombat_X")
     * @param {string} groupType - Group type ("main" or "subcombat")
     * @param {string} role - Role ("attacker", "defender", or null)
     */
    async _updateCombatantGroup(combatant, groupId, groupType, role) {
        const flags = combatant.flags["eon-rpg"] || {};
        
        await combatant.update({
            flags: {
                "eon-rpg": {
                    ...flags,
                    groupId: groupId,
                    groupType: groupType,
                    subcombatRole: role
                }
            }
        });
    }

    /**
     * Save phase selection to combatant flags
     * @param {string} phaseType - The phase type selected
     * @param {Token} token - The token associated with the combatant
     */
    async _savePhaseToCombatant(phaseType, token) {
        if (!game.combat || !token || !token.combatant) return;
        
        const combatant = token.combatant;
        const existingFlags = combatant.flags["eon-rpg"] || {};
        
        // Preserve existing flags (groupId, groupType, subcombatRole) when updating phase
        // This prevents resetting other important data
        await combatant.update({
            flags: {
                "eon-rpg": {
                    ...existingFlags,
                    phase: phaseType
                }
            }
        });
    }

    /**
     * Get all initiative phase types from CONFIG.EON.statusEffects
     * @returns {string[]} Array of phase type IDs
     */
    _getPhaseTypes() {
        if (!CONFIG.EON?.statusEffects) {
            return ["initiative_distance", "initiative_close", "initiative_mystic", "initiative_other"];
        }
        return Object.keys(CONFIG.EON.statusEffects);
    }

    /**
     * Apply status effect using Actor#toggleStatusEffect (v13 API)
     * Status effects are applied to Actor, and tokens automatically display them
     * @param {Token} token - The token (for reference, not used directly)
     * @param {Actor} actor - The actor to apply effect to
     * @param {string} statusId - The status effect ID
     * @param {boolean} active - Whether to activate (true) or deactivate (false)
     */
    async _applyStatusEffect(token, actor, statusId, active) {
        if (!actor || !actor.toggleStatusEffect) {
            console.warn(`Actor or toggleStatusEffect not available`);
            return;
        }
        
        try {
            await actor.toggleStatusEffect(statusId, {active: active});
        } catch (error) {
            console.error(`Failed to apply status effect ${statusId}:`, error);
            await this._manageActiveEffectDirectly(actor, statusId, active);
        }
    }

    /**
     * Fallback: Manage ActiveEffect directly if toggleStatusEffect fails
     * @param {Actor} actor - The actor to manage effect on
     * @param {string} statusId - The status effect ID
     * @param {boolean} active - Whether to create (true) or remove (false)
     */
    async _manageActiveEffectDirectly(actor, statusId, active) {
        let statusEffect = CONFIG.EON?.statusEffects?.[statusId];
        
        if (!statusEffect && Array.isArray(CONFIG.statusEffects)) {
            statusEffect = CONFIG.statusEffects.find(s => s.id === statusId || s._id === statusId);
        }
        
        if (!statusEffect && CONFIG.statusEffects && typeof CONFIG.statusEffects === 'object' && !Array.isArray(CONFIG.statusEffects)) {
            statusEffect = CONFIG.statusEffects[statusId];
        }
        
        if (!statusEffect || !actor.effects) return;
        
        const existingEffect = actor.effects.find(effect => {
            if (!effect.statuses) return false;
            if (effect.statuses instanceof Set) return effect.statuses.has(statusId);
            if (Array.isArray(effect.statuses)) return effect.statuses.includes(statusId);
            if (typeof effect.statuses === 'object') return effect.statuses[statusId];
            return false;
        });
        
        if (active && !existingEffect) {
            try {
                const effectData = {
                    name: statusEffect.name || statusEffect.label || statusId,
                    icon: statusEffect.icon || statusEffect.img,
                    statuses: { [statusId]: true },
                    disabled: false,
                    origin: actor.uuid,
                    flags: { "eon-rpg": { phase: statusId } }
                };
                await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            } catch (error) {
                console.error(`Failed to create ActiveEffect directly for ${statusId}:`, error);
            }
        } else if (!active && existingEffect) {
            try {
                await existingEffect.delete();
            } catch (error) {
                console.error(`Failed to delete ActiveEffect directly for ${statusId}:`, error);
            }
        }
    }

    async _clearIcon(token) {
        const phaseTypes = this._getPhaseTypes();
        for (const phaseType of phaseTypes) {
            await this._applyStatusEffect(token, token.actor, phaseType, false);
        }
    }

    async _clearOtherIcons(token, excludeType) {
        const phaseTypes = this._getPhaseTypes();
        for (const phaseType of phaseTypes) {
            if (phaseType !== excludeType) {
                await this._applyStatusEffect(token, token.actor, phaseType, false);
            }
        }
    }

    /**
     * Automatically roll initiative when phase is selected
     * @param {string} phaseType - The phase type
     * @param {Token} token - The token
     */
    async _rollInitiativeAutomatically(phaseType, token) {
        if (!game.combat || !token || !token.combatant) return;
        
        // Ensure combatant is in combat
        if (!this._inTurn(token)) {
            await token.document.toggleCombatant();
        }
        
        // Get current combatant data to preserve flags
        const combatant = token.combatant;
        const existingFlags = combatant.flags["eon-rpg"] || {};
        
        // Roll initiative
        const roll = new DiceRollContainer(this.actor, this.config);
        roll.number = parseInt(this.object.grundInitiativ);
        roll.bonus = parseInt(this.object.bonusInitiativ);
        let result = parseInt(await RollDice(roll));

        // Calculate composite initiative with group, phase, and base initiative
        // Create a temporary combatant object with the new initiative for calculation
        const tempCombatant = {
            ...combatant,
            initiative: result,
            flags: {
                "eon-rpg": existingFlags
            }
        };
        const compositeInitiative = CombatHelper.calculateCompositeInitiative(tempCombatant);
        
        // Update initiative while preserving all flags
        await combatant.update({
            initiative: compositeInitiative,
            flags: {
                "eon-rpg": existingFlags
            }
        });
        
        await CombatHelper.sortCombatantsByPhase(game.combat);
        
        // Close dialog after rolling
        this.object.canclose = true;
        await this.close();
    }

    async _rollInitiative(event) {
        this.object.canclose = false;

        event.preventDefault();		

		let foundToken = false;
		let foundEncounter = true;
		let token = await canvas.tokens.placeables.find(t => t.document.actor._id === this.object.actorid);

		if(token) {
            foundToken = true;
        } 

		if (game.combat == null) {
			foundEncounter = false;
	   	}

        if (!foundToken) {
            ui.notifications.error(`Kunde inte hitta ${this.actor.name} token`);
            return;
        }
        if (!foundEncounter) {
            ui.notifications.error(`Finns ingen startad strid i Foundry`);
            return;
        }

        let selectedPhase = null;
        if (this.object.isdistance) selectedPhase = "initiative_distance";
        else if (this.object.isclose) selectedPhase = "initiative_close";
        else if (this.object.ismystic) selectedPhase = "initiative_mystic";
        else if (this.object.isother) selectedPhase = "initiative_other";

        if (!selectedPhase) {
            ui.notifications.warn("Välj en fas innan du slår initiativ!");
            return;
        }

		if ((foundToken) && (foundEncounter)) {
			if (!this._inTurn(token)) {
				await token.document.toggleCombatant();
            }

            await this._savePhaseToCombatant(selectedPhase, token);
            await this._clearOtherIcons(token, selectedPhase);
            await this._applyStatusEffect(token, token.actor, selectedPhase, true);

            const roll = new DiceRollContainer(this.actor, this.config);
            roll.number = parseInt(this.object.grundInitiativ);
            roll.bonus = parseInt(this.object.bonusInitiativ);
            let result = parseInt(await RollDice(roll));

            // Calculate composite initiative with group, phase, and base initiative
            const compositeInitiative = CombatHelper.calculateCompositeInitiative({
                ...token.combatant,
                initiative: result
            });
            
            await token.combatant.update({initiative: compositeInitiative});
            await CombatHelper.sortCombatantsByPhase(game.combat);
            
            // Close dialog after rolling
            this.object.canclose = true;
            await this.close();
		}		
    }

    /* clicked to close form */
    async _closeForm(event) {
        event?.preventDefault();
        await this.close();
    }    
    
    _inTurn(token) {
        for (let count = 0; count < game.combat.combatants.size; count++) {
            if (token.id == game.combat.combatants.contents[count].token.id) {
                return true;
            }
        }
    
        return false;
    }
}