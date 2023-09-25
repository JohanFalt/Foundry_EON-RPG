export const systemSettings = function() {

    game.settings.register("eon-rpg", "systemVersion", {
		name: "Version",
		hint: "System version",
		scope: "world",
		config: true,
		default: "1",
		type: String,
	});

    /* patch settings */
	game.settings.register("eon-rpg", "patch200", {
		name: "patch200",
		hint: "patch200",
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});

    // "core" is core settings
	// ""eon-rpg"" as system setting
	// "eon" or other then is module settings
	game.settings.register("eon-rpg", "bookCombat", {
		name: "Strid",
		hint: "Skall systemet använda sig av de regler och tillägg som kom i boken Strid?",
		scope: "world",
		config: false,
		default: "Nej",
		type: String,
		choices: {
			//"strid": "Ja",
			"grund": "Nej"
		}
	});

    game.settings.register("eon-rpg", "bookMagic", {
		name: "Magi",
		hint: "Skall systemet använda sig av de regler och tillägg som kom i boken Magi?",
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

    game.settings.register("eon-rpg", "weightRules", {
		name: "Vikt/Belastning",
		hint: "Skall vad man bär på sig utöver rustningar beräknas in i belastning?",
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});    

    /* Groups of settings */
    game.settings.registerMenu("eon-rpg", "bookSettings", {
        name: "Böcker",
        hint: "Vilka böcker skall användas i systemet",
        label: "Bokinställningar",
        icon: "icon fa-solid fa-gear",
        type: Books,
        restricted: true,
    });

    /* Groups of settings */
    game.settings.registerMenu("eon-rpg", "ruleSettings", {
        name: "Regler",
        hint: "Vilka specifika regler skall användas i systemet",
        label: "Regelinställningar",
        icon: "icon fa-solid fa-gear",
        type: Rules,
        restricted: true,
    });
};

export class Books extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "books",
            classes: ["EON setting-dialog"],
            title: "Bokinställningar",
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
                if (s.key == "bookCombat") {
                    // Update setting data
                    const setting = duplicate(s);

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
        if (!menu) return ui.notifications.error("No submenu found for the provided key");
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
        return mergeObject(super.defaultOptions, {
            id: "rules",
            classes: ["EON setting-dialog"],
            title: "Regelinställningar",
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
                if (s.key == "weightRules") {
                    // Update setting data
                    const setting = duplicate(s);

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
        if (!menu) return ui.notifications.error("No submenu found for the provided key");
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