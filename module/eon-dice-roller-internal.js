let numberDices = 0;
let diceType = "";
let obRoll = true;

function register$e(namespace) {
  
}

const systemSettings = function() {
    game.settings.register("eon-rpg", "moduleVersion", {
		name: "Version",
		hint: "Modulens version",
		scope: "world",
		config: true,
		default: "1",
		type: String,
	});

    game.settings.register("eon-rpg", "diceColor", {
        name: "FÃ¤rg",
        hint: "Vilken fÃ¤rg skall tÃ¤rningarna ha?",
        scope: "world",
        config: false,
        default: "black-dice",
        type: String,
        choices: {
            "black-dice": "Svarta",
            "red-dice": "RÃ¶da",
            "green-dice": "GrÃ¶na",
            "blue-dice": "BlÃ¥a"
        }
    });

    /* Groups of settings */
    game.settings.registerMenu("eon-rpg", "graphicSettings", {
        name: "Grafik",
        hint: "De olika grafiska instÃ¤llningarna som finns tillgÃ¤ngliga",
        label: "Grafiska instÃ¤llningar",
        icon: "icon fa-solid fa-gear",
        type: Graphics,
        restricted: true,
    });
}

class Graphics extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "graphics",
            classes: ["setting-dialog"],
            title: "GrafikinstÃ¤llningar",
            template: "modules/eon-dice-roller/templates/dialog-settings.html",
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
                if (s.key == "diceColor") {
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
        html.querySelector(".submenu button").click(this._onClickSubmenu.bind(this));
        html.querySelector('button[name="reset"]').click(this._onResetDefaults.bind(this));
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
    async _updateObject(_, formData) {
        for (let [k, v] of Object.entries(flattenObject(formData))) {
            let s = game.settings.settings.get(k);
            let current = game.settings.get("eon-rpg", s.key);

            if (v !== current) {
                await game.settings.set("eon-rpg", s.key, v);
            }
        }
    }
}



Hooks.once('init', async function() {
    // Register System Settings
    systemSettings();

    const dice = {
        'd6': `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
                <svg version="1.1" id="eon_dice_d6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
                    <g>
                        <path d="M 11.5 9 C 10.149212 8.9609669 8.960847 10.149856 9 11.5 L 9 51.195312 C 8.7783001 52.934174 9.4649439 55.027114 11.5 55.199219 L 51.195312 55.199219 C 52.934562 55.433915 55.164599 54.729057 55.099609 52.599609 L 55.099609 12.90625 C 55.334305 11.167 54.629448 8.935012 52.5 9 L 11.5 9 z M 22.671875 13.931641 A 4.3972788 4.3972788 0 0 1 22.705078 13.931641 A 4.3972788 4.3972788 0 0 1 27.101562 18.330078 A 4.3972788 4.3972788 0 0 1 22.705078 22.726562 A 4.3972788 4.3972788 0 0 1 18.306641 18.330078 A 4.3972788 4.3972788 0 0 1 22.671875 13.931641 z M 41.367188 13.931641 A 4.3972788 4.3972788 0 0 1 41.398438 13.931641 A 4.3972788 4.3972788 0 0 1 45.796875 18.330078 A 4.3972788 4.3972788 0 0 1 41.398438 22.726562 A 4.3972788 4.3972788 0 0 1 37.001953 18.330078 A 4.3972788 4.3972788 0 0 1 41.367188 13.931641 z M 22.671875 27.732422 A 4.3972788 4.3972788 0 0 1 22.705078 27.732422 A 4.3972788 4.3972788 0 0 1 27.101562 32.130859 A 4.3972788 4.3972788 0 0 1 22.705078 36.527344 A 4.3972788 4.3972788 0 0 1 18.306641 32.130859 A 4.3972788 4.3972788 0 0 1 22.671875 27.732422 z M 41.367188 27.732422 A 4.3972788 4.3972788 0 0 1 41.398438 27.732422 A 4.3972788 4.3972788 0 0 1 45.796875 32.130859 A 4.3972788 4.3972788 0 0 1 41.398438 36.527344 A 4.3972788 4.3972788 0 0 1 37.001953 32.130859 A 4.3972788 4.3972788 0 0 1 41.367188 27.732422 z M 22.671875 41.751953 A 4.3972788 4.3972788 0 0 1 22.705078 41.751953 A 4.3972788 4.3972788 0 0 1 27.101562 46.150391 A 4.3972788 4.3972788 0 0 1 22.705078 50.546875 A 4.3972788 4.3972788 0 0 1 18.306641 46.150391 A 4.3972788 4.3972788 0 0 1 22.671875 41.751953 z M 41.398438 41.751953 A 4.3972788 -4.3972788 0 0 1 45.796875 46.150391 A 4.3972788 -4.3972788 0 0 1 41.398438 50.546875 A 4.3972788 -4.3972788 0 0 1 37.001953 46.150391 A 4.3972788 -4.3972788 0 0 1 41.398438 41.751953 z " />
                    </g>
                </svg>`,
        'd10': `<?xml version="1.0" encoding="utf-8"?>
                <svg version="1.1" id="eon_dice_d10" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
                <g>
                    <g transform="matrix(1.1679092,0,0,1.1679092,-274.931,-137.53749)">
                        <path d="M263.4,124.6L249.9,153l12.5,8.1l13.5-8.2L263.4,124.6z"/>
                        <path d="M264.1,124.1l12.5,28.6l7.3-2.3l0.5-11.6L264.1,124.1z"/>
                        <path d="M262.7,161.8v4.4l20.9-14.7l-7,2L262.7,161.8z"/>
                        <path d="M262.7,124.2l-13.7,28.5l-7.1-3.1l-0.6-11.6L262.7,124.2z"/>
                        <path d="M261.8,161.7v4.5l-20-15.4l6.9,2.7L261.8,161.7z"/>
                    </g>
                </g>
                </svg>`,
        'd100': `<?xml version="1.0" encoding="utf-8"?>
                <svg version="1.1" id="eon_dice_d100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
                <g>
                    <g transform="matrix(1.1679092,0,0,1.1679092,-274.931,-137.53749)">
                        <polygon points="264.7,150.8 263.7,151.4 262.2,152.3 261.4,152.8 259.6,153.8 253.3,157.7 242.7,150.8 254.2,126.6 258.2,135.9
                            259.9,139.8 262.7,146.1 263.1,147 263.1,147 		"/>
                        <polygon points="271.9,138.7 271.5,148.5 265.4,150.5 263.5,146.2 263.1,145.3 258.8,135.5 257.8,133.3 254.7,126.2 255.8,127
                            263.4,132.5 267.8,135.7 268.3,136 		"/>
                        <polygon points="271.3,149.5 264.9,154.1 264.6,154.2 264.2,154.5 262.3,155.9 253.6,162 253.6,158.2 260.2,154.3 262.1,153.2
                            262.8,152.7 263.9,152 265.4,151.1 		"/>
                        <path d="M253.6,126.3L242,150.5l-6.1-2.6l-0.5-9.9L253.6,126.3z"/>
                        <path d="M252.8,158.2v3.8l-17-13.1l5.9,2.3L252.8,158.2z"/>
                    </g>
                </g>
                <g>
                    <g transform="matrix(1.1679092,0,0,1.1679092,-274.931,-137.53749)">
                        <polygon points="283,151.5 271.5,158.4 265.6,154.5 272.2,149.7 272.6,138.2 268.6,135.3 272.5,127.3 		"/>
                        <path d="M273,126.9l10.6,24.3l6.2-2l0.4-9.8L273,126.9z"/>
                        <path d="M271.9,159v3.7l17.7-12.5l-5.9,1.7L271.9,159z"/>
                        <polygon points="271.9,127 268.1,134.9 264.1,132 		"/>
                        <polygon points="265,155 271.1,158.9 271.1,162.7 262.9,156.4 		"/>
                    </g>
                </g>
                </svg>`};

    CONFIG.DICETRAY = {
        dice: dice
    };

    Handlebars.registerHelper('dtSvgDie', (context, options) => {
        return `${context}Svg`;
    });

    // Register dice partials.
    for (let [die, tpl] of Object.entries(CONFIG.DICETRAY.dice)) {
        Handlebars.registerPartial(`${die}Svg`, tpl);
    }
});

Hooks.once("ready", async () => {
    // Do anything once the system is ready
    const installedVersion = game.settings.get("eon-rpg", "moduleVersion");
    const module = game.data.modules.filter(modul => modul.id == "eon-rpg");	
    const systemVersion = module[0].version;

    if (game.user.isGM) {
        if ((installedVersion !== systemVersion || installedVersion === null)) {
            if (_compareVersion(installedVersion, systemVersion, 3)) {        
                //await doNotice(installedVersion, systemVersion);
                game.settings.set("eon-rpg", "moduleVersion", systemVersion);
            }
        }
    } 
});

Hooks.on('renderSidebar', (app, html, data) => {
    let formula_applier = null;
    const system_behavior_mapper = {
        generic: {
            apply_layout: function(html) {_dtApplyGenericLayout(html)},
            load_dice: function() {return [_objLoadGenericDice()]}
        }
    };
    formula_applier = system_behavior_mapper['generic'];

    // Prepare the dice tray for rendering.
    const template = 'systems/eon-rpg/templates/dice/tray.html';
    const options = {
        dicerows: formula_applier.load_dice()
    };

    foundry.applications.handlebars.renderTemplate(template, options).then(renderedHtml => {
    // Create a new section element for the rendered HTML
        const div = document.createElement('section');
        div.innerHTML = renderedHtml;

        // Find the chat form
        const chatForm = html.querySelector('form.chat-form');

        if (chatForm) {
            // Find the textarea inside the form
            const chatTextarea = chatForm.querySelector('#chat-message');

            if (chatTextarea) {
                // Insert the div right after the textarea
                chatTextarea.insertAdjacentElement('afterend', div);
            } else {
                //console.error('Textarea with id="chat-message" not found inside chat-form!');
                chatForm.appendChild(div); // fallback: append to form end
            }

            // Attach events and apply layout
            attachButtonEvents(div);
            formula_applier.apply_layout(html);
        } else {
            console.error('Chat form not found!');
        }
    });

});

Handlebars.registerHelper("numFromLoop", function (from, num, options) {
    let ret = "";
  
    for (let i = from; i <= num; i++) {
      ret = ret + options.fn(i);
    }
  
    return ret;
  });
  
  Handlebars.registerHelper('eqAny', function () {
    for(let i = 1; i < arguments.length; i++) {
        if(arguments[0] === arguments[i]) {
        return true;
        }
    }
    return false;
  });

// Function to handle events for buttons
function attachButtonEvents(div) {
    // Ensure the content has buttons before attaching event listeners
    const buttons = div.querySelectorAll('.eon-roller__button, .eon-roller__num, .eon-roller__math');
    if (buttons.length === 0) {
        console.warn("No buttons found inside the div:", div);
    }

    // Using event delegation
    div.addEventListener('click', function(event) {
        const button = event.target.closest('.eon-roller__button, .eon-roller__num, .eon-roller__math');

        if (button) {
            handleButtonClick(event, button);  // Handle the button click logic
        }
        else {
            console.log("no button");
        }
    });

    div.addEventListener('contextmenu', function(event) {
        const button = event.target.closest('.eon-roller__button, .eon-roller__num, .eon-roller__math');

        if (button) {
            handleButtonRightClick(event, button);  // Handle the right-click logic
        }
        else {
            console.log("no button");
        }
    });
}




async function doNotice(installedVersion, systemVersion) {
    if (!game.user.isGM) {
        return;
    }

    if (!_compareVersion(installedVersion, systemVersion, 2)) {
        return;
    }
    
    foundry.applications.ux.TextEditor.implementation
    const enrichedMessage = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        /*html*/
        `
        <div class="tray-title-area">Eon dice helper ${systemVersion}</div>
        <div class="tray-action-area">
            Hej! Detta Ã¤r en hjÃ¤lpmodul till det Svenska rollspelet Eon. Den Ã¤r tÃ¤nkt som ett sÃ¤tt att slÃ¥ de tÃ¤rningar som rollspelet behÃ¶ver samt ge mÃ¶jligheten att kunna gÃ¶ra detta pÃ¥ ett enkelt och Ã¶verskÃ¥dligt sÃ¤tt.
        <div>
    <div class="tray-title-area">Fixar i v1.6.2</div>
    <div class="tray-action-area">
        <ul style="margin-top: 0">
        <li>Fixat mindre visuella fel.</li>
        <li>Lagt till sÃ¥ Eon systemet kan skicka en beskrivningstext</li>
        </ul>
    </div>
    <div class="tray-title-area">LÃ¤nkar</div>
        <div class="tray-action-area">
        <ul style="margin-top: 0">
        <li><a href="https://github.com/JohanFalt/Foundry_EonDiceRoller/issues">Rapportera Ã¶nskemÃ¥l eller fel</a></li>
        </ul>
    </div>
        `,
        { async: true }
    );
    await ChatMessage.create({
        user: game.user.id,
        content: enrichedMessage,
        //type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
}

// Handle button click events
function handleButtonClick(event, button) {
    if (button.classList.contains('eon-roller__math') &&
            button.classList.contains('flexrow') &&
            button.classList.contains('eon-wrapper')) {
        return;
    }

    const dataset = button.dataset;
    event.preventDefault(); // Try removing this if it's blocking functionality

    if (button.classList.contains('eon-roller__button')) {
        if (diceType !== dataset.formula) numberDices = 0;
        diceType = dataset.formula;
        _dtUpdateChatDice(dataset, 'add', document);
    }

    if (button.classList.contains('eon-roller__num')) {
        dataset.value = parseInt(button.innerText);
        _dtUpdateChatDice(dataset, 'calc', document);
    }

    if (button.classList.contains('eon-roller__math')) {
        let mod_val = document.querySelector('input[name="dice.tray.modifier"]').value;
        mod_val = Number(mod_val);
        mod_val = isNaN(mod_val) ? 0 : mod_val;

        if (button.classList.contains('eon-roller__math--sub')) {
            mod_val -= 1;
        } else {
            mod_val += 1;
        }

        if (mod_val === 4) mod_val = 0;
        if (mod_val === -2) mod_val = 2;

        document.querySelector('input[name="dice.tray.modifier"]').value = mod_val;
    }
}

// Handle right-click events
function handleButtonRightClick(event, button) {
    if (button.classList.contains('eon-roller__math') &&
            button.classList.contains('flexrow') &&
            button.classList.contains('eon-wrapper')) {
        return;
    }

    const dataset = button.dataset;
    event.preventDefault();  // Prevent the context menu from appearing

    if (button.classList.contains('eon-roller__button')) {
        if (numberDices === 0) {
            diceType = "";
        } else {
            diceType = dataset.formula;
        }
        _dtUpdateChatDice(dataset, 'sub', document);
    }

    if (button.classList.contains('eon-roller__num')) {
        dataset.value = parseInt(button.innerText);
        _dtUpdateChatDice(dataset, 'calc', document);
    }

    if (button.classList.contains('eon-roller__math')) {
        let mod_val = document.querySelector('input[name="dice.tray.modifier"]').value;
        mod_val = Number(mod_val);
        mod_val = isNaN(mod_val) ? 0 : mod_val;

        if (button.classList.contains('eon-roller__math--sub')) {
            mod_val -= 1;
        } else {
            mod_val += 1;
        }

        if (mod_val === 4) mod_val = 0;
        if (mod_val === -2) mod_val = 2;

        document.querySelector('input[name="dice.tray.modifier"]').value = mod_val;
    }
}

function _dtUpdateChatDice(dataset, direction, html) {  
    if (direction == 'add') {
        numberDices++;

        if (diceType == "") {
            diceType = "d6";
            dataset.formula = diceType;
        }
    }
    if (direction == 'sub') {
        if (numberDices > 0) {
            numberDices--;
        }    
    }
    if (direction == 'calc') {
        numberDices = dataset.value;
  
        if (diceType == "") {
            diceType = "d6";
            dataset.formula = diceType;      
        }   

        if (numberDices == -1) {
            numberDices = 0;
        }
    }
  
    const allDices = _objLoadGenericDice();
  
    Object.keys(allDices).forEach(key => {
      const dice = html.find(`.eon-roller__flag--${key}`);
      dice.text('');
      dice.addClass('hide'); 
    });
  
    // Add a flag indicator on the dice.
    let $flag_button = html.find(`.eon-roller__flag--${dataset.formula}`);
  
    if (numberDices == '') {
        numberDices = direction == 'add' ? 1 : 0;
    }
  
    numberDices = Number(numberDices);
  
    if (numberDices > 0) {
        $flag_button.text(numberDices);
        $flag_button.removeClass('hide');
    }
    else if (numberDices < 0) {
        $flag_button.text(numberDices);
    }
    else {
        $flag_button.text('');
        $flag_button.addClass('hide');
    }
  }

// Initialization function, to be called on page load or after dynamic content is inserted
function initializeDiceTray() {
    const diceTrayDiv = document.querySelector('.eon-roller'); // Find the main container
    if (diceTrayDiv) {
        attachButtonEvents(diceTrayDiv); // Attach the events when the content is ready
    } else {
        console.warn("Dice tray section not found.");
    }
}


/**
 * Compares two version numbers to see if the new one is newer than the old one
 * @param oldVersion   The existing version no: e.g. 1.5.9
 * @param newVersion   The new version no: e.g. 1.5.10
 * @param depth        How many version no are to check, normal is 3
 */
function _compareVersion(oldVersion, newVersion, depth) {
    if (newVersion == "") {
        return false;
    }

    if (newVersion == undefined) {
        return false;
    }

    if ((oldVersion == "") || (oldVersion == "1")) {
        return true;
    }

    if (oldVersion == newVersion) {
        return false;
    }

    try {
        const newfields = newVersion.split(".");
        const oldfields = oldVersion.split(".");

        for (let i = 0; i <= depth; i++) {
            if (parseInt(newfields[i]) > parseInt(oldfields[i])) {
                return true;
            }
        }
    }
    catch {
    }

    return false
}

function _dtUpdateChatDice(dataset, direction, html) {  
    if (direction == 'add') {
        numberDices++;
        if (diceType == "") {
            diceType = "d6";
            dataset.formula = diceType;
        }
    }
    if (direction == 'sub') {
        if (numberDices > 0) {
            numberDices--;
        }    
    }
    if (direction == 'calc') {
        numberDices = dataset.value;

        if (diceType == "") {
            diceType = "d6";
            dataset.formula = diceType;      
        }    
        if (numberDices == -1) {
            numberDices = 0;
        }
    }

    const allDices = _objLoadGenericDice();

    Object.keys(allDices).forEach(key => {
        const dice = html.querySelector(`.eon-roller__flag--${key}`);
        $(dice).text('');
        $(dice).addClass('hide'); 
    });

    // Add a flag indicator on the dice.
    let $flag_button = html.querySelector(`.eon-roller__flag--${dataset.formula}`);

    if (numberDices == '') {
        numberDices = direction == 'add' ? 1 : 0;
    }

    numberDices = Number(numberDices);

    if (numberDices > 0) {
        $flag_button.textContent = numberDices;
        $flag_button.classList.remove('hide');
    }
    else if (numberDices < 0) {
        $flag_button.textContent = numberDices;
    }
    else {
        $flag_button.textContent = '';
        $flag_button.classList.add('hide');
    }
}

//----------------------------------
//Specific System Implementations
//----------------------------------

// LAYOUT BY SYSTEM
function _dtApplyGenericLayout(html) {  
    html.querySelector('.eon-roller__roll')?.addEventListener('click', async event => {
        event.preventDefault();

        let modInput = html.querySelector('input[name="dice.tray.modifier');
        
        const bonus = modInput.value;

        await rollDice(numberDices, Number(bonus), diceType, obRoll);

        const flag = html.querySelector(`.eon-roller__flag--${diceType}`);
        flag.textContent = '';               // Replaces .text('')
        flag.classList.add('hide');         // Replaces .addClass('hide')
        numberDices = 0;
        diceType = "";
        modInput.value = 0;
    });

    html.querySelector('.eon-roller__ob')?.addEventListener('click', event => {
        event.preventDefault();
        const obButton = html.querySelector('.eon-roller__ob');

        if (obRoll) {
            obButton.classList.remove('active');  // replaces .removeClass()
        } else {
            obButton.classList.add('active');     // replaces .addClass()
        }
        
        obRoll = !obRoll; 
    });
}

// DICE LOADING BY SYSTEM
function _dtLoadGenericDice() {
  return [
    {
      d6: 'd6',
      d10: 'd10',
      d100: 'd100'
    }
  ];
}

function _objLoadGenericDice() {
  return {
      d6: 'd6',
      d10: 'd10',
      d100: 'd100'
    };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rollDice(number, bonus, type, obRoll) {
    let canRoll = number > 0;
    let result = 0;
    let diceResult = [];
    let numDices = number;
    let rolledDices = 0;
    const allRolls = [];    

    while (numDices > rolledDices) {
        roll = new Roll("1" + type);
        allRolls.push(roll);
        await roll.evaluate();
        
        roll.terms[0].results.forEach((dice) => {
        rolledDices += 1;

        if ((type == "d6") && (dice.result == 6) && (obRoll)) {
            numDices += 1;
            rolledDices -= 1;
        }
        else {
            result += parseInt(dice.result);
        }

        diceResult.push(dice.result);
        });
    }

    const diceList = [];

    if (canRoll) {
        diceResult.forEach((dice) => {
            diceList.push(dice);
        });

        result += parseInt(bonus);
    }

    let dicetype = type.replace("d", "T");
    let text = `SlÃ¥r ${number}${dicetype}`;

    if (bonus > 0) {
        text = `SlÃ¥r ${number}${dicetype}+${bonus}`;
    }
    else if (bonus < 0) {
        text = `SlÃ¥r ${number}${dicetype}${bonus}`;
    }

    const templateData = {
        data: {
            dicetype: type,
            config: undefined,
            dicecolor: game.settings.get("eon-rpg", "diceColor"),
            isrollable: canRoll,
            type: "general",
            action: "SlÃ¥r generella tÃ¤rningar",
            title: text,
            diceresult: diceList,
            result: result,
            obroll: obRoll
        }
    };

    const template = `modules/eon-dice-roller/templates/roll-template.html`;
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

    const chatData = {
        rolls: allRolls,
        content: html,
        speaker: ChatMessage.getSpeaker(),
        rollMode: game.settings.get("core", "rollMode")        
    };
    ChatMessage.create(chatData);

    return canRoll;
}
