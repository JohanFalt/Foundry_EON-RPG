export const systemSettings = function() {
    const L = (key) => game.i18n.localize(key);

    game.settings.register("eon-rpg", "systemVersion", {
		name: L("eon.settings.version"),
		hint: L("eon.settings.versionHint"),
		scope: "world",
		config: true,
		default: "1",
		type: String,
	});

    /* Messages */
    game.settings.register("eon-rpg", "eoncombattrackerbeta", {
		name: L("eon.settings.eonCombatTrackerBeta"),
		hint: "",
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});

    game.settings.register("eon-rpg", "eontranslation", {
		name: L("eon.settings.eontranslation"),
		hint: "",
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});

    game.settings.register("eon-rpg", "eoncreationwizard", {
		name: L("eon.settings.eoncreationwizard"),
		hint: "",
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});

    game.settings.register("eon-rpg", "textfont", {
		name: L("eon.settings.textfont"),
		hint: L("eon.settings.textfontHint"),
		scope: "world",
		config: true,
		default: "eon1",
		type: String,
        choices: {
			"eon1": L("eon.settings.eon1"),
            "normal": L("eon.settings.normalFont")
		}
	});

    game.settings.register("eon-rpg", "headlinefont", {
		name: L("eon.settings.headlinefont"),
		hint: L("eon.settings.headlinefontHint"),
		scope: "world",
		config: true,
		default: "eon1",
		type: String,
        choices: {
			"eon1": L("eon.settings.eonRubrik1"),
            "eon2": L("eon.settings.eonRubrik2"),
            "normal": L("eon.settings.normalFont")
		}
	});

    game.settings.register("eon-rpg", "eonCombatTrackerEnabled", {
        name: L("eon.settings.aktiveraEonCombatTracker"),
        hint: L("eon.settings.aktiveraEonCombatTrackerHint"),
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    /* patch settings */
	// game.settings.register("eon-rpg", "patch200", {
	// 	name: "patch200",
	// 	hint: "patch200",
	// 	scope: "world",
	// 	config: false,
	// 	default: false,
	// 	type: Boolean,
	// });

    // "core" is core settings
	// ""eon-rpg"" as system setting
	// "eon" or other then is module settings

    
    game.settings.register("eon-rpg", "bookEon", {
		name: L("eon.settings.bookEon"),
		hint: L("eon.settings.bookEonHint"),
		scope: "world",
		config: false,
		default: "eon4",
		type: String,
		choices: {
			"eon4": L("eon.settings.eon4"),
			"eon5": L("eon.settings.eon5")
		}
	});

	game.settings.register("eon-rpg", "bookCombat", {
		name: L("eon.settings.bookCombat"),
		hint: L("eon.settings.bookCombatHint"),
		scope: "world",
		config: false,
		default: "Nej",
		type: String,
		choices: {
			//"strid": "Ja",
			"grund": L("eon.settings.nej")
		}
	});

    game.settings.register("eon-rpg", "bookMagic", {
		name: L("eon.settings.bookMagic"),
		hint: L("eon.settings.bookMagicHint"),
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});

    game.settings.register("eon-rpg", "weightRules", {
		name: L("eon.settings.weightRules"),
		hint: L("eon.settings.weightRulesHint"),
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});    

    game.settings.register("eon-rpg", "hinderenceSkillGroupMovement", {
		name: L("eon.settings.hinderenceSkillGroupMovement"),
		hint: L("eon.settings.hinderenceSkillGroupMovementHint"),
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});

    game.settings.register("eon-rpg", "hinderenceAttributeMovement", {
		name: L("eon.settings.hinderenceAttributeMovement"),
		hint: L("eon.settings.hinderenceAttributeMovementHint"),
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

    /* Groups of settings */
    game.settings.registerMenu("eon-rpg", "bookSettings", {
        name: L("eon.settings.bocker"),
        hint: L("eon.settings.bockerHint"),
        label: L("eon.settings.bokinstallningarLabel"),
        icon: "icon fa-solid fa-gear",
        type: Books,
        restricted: true,
    });

    /* Groups of settings */
    game.settings.registerMenu("eon-rpg", "ruleSettings", {
        name: L("eon.settings.regler"),
        hint: L("eon.settings.reglerHint"),
        label: L("eon.settings.regelinstallningarLabel"),
        icon: "icon fa-solid fa-gear",
        type: Rules,
        restricted: true,
    });
};

export class Books extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "books",
            classes: ["EON setting-dialog"],
            title: game.i18n.localize("eon.dialogs.bokinstallningar"),
            template: "systems/eon-rpg/templates/dialogs/dialog-settings.html",
        });
    }
  
    getData(options) {
        const hasPermission = game.user.can("SETTINGS_MODIFY");  
        const data = {
            system: { 
                title: game.system.title, 
                menus: [], 
                settings: [] 
            }
        };

        // Classify all settings
        if (hasPermission) {
            for (let s of game.settings.settings.values()) {
                // // Exclude settings the user cannot change
                if ((s.key == "bookEon") || (s.key == "bookCombat") || (s.key == "bookMagic")) {
                    // Update setting data
                    const setting = foundry.utils.duplicate(s);

                    setting.value = game.settings.get("eon-rpg", setting.key);
                    setting.type = s.type instanceof Function ? s.type.name : "String";
                    setting.scope = "eon-rpg";
                    setting.isBoolean = s.type === Boolean;
                    setting.isSelect = s.choices !== undefined;

                    data.system.settings.push(setting);
                } 
            }
        }
  
        // Return data
        return {
            user: game.user,
            canConfigure: hasPermission,
            systemTitle: game.system.title,
            data: data
        };
    }
  
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".submenu button").click(this._onClickSubmenu.bind(this));
        html.find('button[name="reset"]').click(this._onResetDefaults.bind(this));
    }
  
    /**
     * Handle activating the button to configure User Role permissions
     * @param event {Event} The initial button click event
     * @private
     */
    _onClickSubmenu(event) {
        event.preventDefault();
        const menu = game.settings.menus.get(event.currentTarget.dataset.key);
        if (!menu) return ui.notifications.error(game.i18n.localize("eon.messages.noSubmenuFound"));
        const app = new menu.type();
        return app.render(true);
    }
  
    /**
     * Handle button click to reset default settings
     * @param event {Event} The initial button click event
     * @private
     */
    _onResetDefaults(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const form = button.form;

        for (let [k, v] of game.settings.settings.entries()) {
            if (v.config) {
                let input = form[k];
                if (input.type === "checkbox") input.checked = v.default;
                else if (input) input.value = v.default;
            }
        }
    }
  
    /** @override */
    async _updateObject(event, formData) {
        for (let [k, v] of Object.entries(flattenObject(formData))) {
            let s = game.settings.settings.get(k);
            let current = game.settings.get("eon-rpg", s.key);

            if (v !== current) {
                await game.settings.set("eon-rpg", s.key, v);
            }
        }
    }
}

export class Rules extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "rules",
            classes: ["EON setting-dialog"],
            title: game.i18n.localize("eon.dialogs.regelinstallningar"),
            template: "systems/eon-rpg/templates/dialogs/dialog-settings.html",
        });
    }
  
    getData(options) {
        const hasPermission = game.user.can("SETTINGS_MODIFY");  
        const data = {
            system: { 
                title: game.system.title, 
                menus: [], 
                settings: [] 
            }
        };

        // Classify all settings
        if (hasPermission) {
            for (let s of game.settings.settings.values()) {
                // // Exclude settings the user cannot change
                if ((s.key == "weightRules") || (s.key == "hinderenceSkillGroupMovement") || (s.key == "hinderenceAttributeMovement")) {
                    // Update setting data
                    const setting = foundry.utils.duplicate(s);

                    setting.value = game.settings.get("eon-rpg", setting.key);
                    setting.type = s.type instanceof Function ? s.type.name : "String";
                    setting.scope = "eon-rpg";
                    setting.isBoolean = s.type === Boolean;
                    setting.isSelect = s.choices !== undefined;

                    data.system.settings.push(setting);
                } 
            }
        }
  
        // Return data
        return {
            user: game.user,
            canConfigure: hasPermission,
            systemTitle: game.system.title,
            data: data
        };
    }
  
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".submenu button").click(this._onClickSubmenu.bind(this));
        html.find('button[name="reset"]').click(this._onResetDefaults.bind(this));
    }
  
    /**
     * Handle activating the button to configure User Role permissions
     * @param event {Event} The initial button click event
     * @private
     */
    _onClickSubmenu(event) {
        event.preventDefault();
        const menu = game.settings.menus.get(event.currentTarget.dataset.key);
        if (!menu) return ui.notifications.error(game.i18n.localize("eon.messages.noSubmenuFound"));
        const app = new menu.type();
        return app.render(true);
    }
  
    /**
     * Handle button click to reset default settings
     * @param event {Event} The initial button click event
     * @private
     */
    _onResetDefaults(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const form = button.form;

        for (let [k, v] of game.settings.settings.entries()) {
            if (v.config) {
                let input = form[k];
                if (input.type === "checkbox") input.checked = v.default;
                else if (input) input.value = v.default;
            }
        }
    }
  
    /** @override */
    async _updateObject(event, formData) {
        for (let [k, v] of Object.entries(flattenObject(formData))) {
            let s = game.settings.settings.get(k);
            let current = game.settings.get("eon-rpg", s.key);

            if (v !== current) {
                await game.settings.set("eon-rpg", s.key, v);
            }
        }
    }
}