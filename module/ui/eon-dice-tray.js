/**
 * Inbyggd tärningsbricka och grafikinställningar (tidigare modulen eon-dice-roller).
 */

const EON_DICE_TEMPLATES = {
    tray: "systems/eon-rpg/templates/dice/tray.html",
    roll: "systems/eon-rpg/templates/dice/roll-template.html",
    graphicsDialog: "systems/eon-rpg/templates/dice/dialog-settings.html",
};

let numberDices = 0;
let diceType = "";
let obRoll = true;

function registerDiceGraphicSettings() {
    game.settings.register("eon-rpg", "diceColor", {
        name: "Färg",
        hint: "Vilken färg skall tärningarna ha?",
        scope: "world",
        config: false,
        default: "black-dice",
        type: String,
        choices: {
            "black-dice": "Svarta",
            "red-dice": "Röda",
            "green-dice": "Gröna",
            "blue-dice": "Blåa",
        },
    });

    game.settings.registerMenu("eon-rpg", "graphicSettings", {
        name: "Grafik",
        hint: "Grafiska inställningar för tärningsvisning",
        label: "Grafiska inställningar",
        icon: "icon fa-solid fa-gear",
        type: DiceGraphicsDialog,
        restricted: true,
    });
}

class DiceGraphicsDialog extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "eon-dice-graphics",
            classes: ["setting-dialog"],
            title: "Grafikinställningar",
            template: EON_DICE_TEMPLATES.graphicsDialog,
        });
    }

    getData() {
        const hasPermission = game.user.can("SETTINGS_MODIFY");
        const data = {
            system: {
                title: game.system.title,
                menus: [],
                settings: [],
            },
        };

        if (hasPermission) {
            for (const s of game.settings.settings.values()) {
                if (s.key === "diceColor") {
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

        return {
            user: game.user,
            canConfigure: hasPermission,
            systemTitle: game.system.title,
            data,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.querySelector(".submenu button")?.addEventListener("click", this._onClickSubmenu.bind(this));
        html.querySelector('button[name="reset"]')?.addEventListener("click", this._onResetDefaults.bind(this));
    }

    _onClickSubmenu(event) {
        event.preventDefault();
        const menu = game.settings.menus.get(event.currentTarget.dataset.key);
        if (!menu) return ui.notifications.error("No submenu found for the provided key");
        const app = new menu.type();
        return app.render(true);
    }

    _onResetDefaults(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const form = button.form;

        for (const [k, v] of game.settings.settings.entries()) {
            if (v.config) {
                const input = form[k];
                if (input?.type === "checkbox") input.checked = v.default;
                else if (input) input.value = v.default;
            }
        }
    }

    async _updateObject(_, formData) {
        for (const [k, v] of Object.entries(flattenObject(formData))) {
            const s = game.settings.settings.get(k);
            if (!s) continue;
            const current = game.settings.get("eon-rpg", s.key);
            if (v !== current) await game.settings.set("eon-rpg", s.key, v);
        }
    }
}

Hooks.once("init", async () => {
    registerDiceGraphicSettings();

    const dice = {
        d6: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
                <svg version="1.1" id="eon_dice_d6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
                    <g>
                        <path d="M 11.5 9 C 10.149212 8.9609669 8.960847 10.149856 9 11.5 L 9 51.195312 C 8.7783001 52.934174 9.4649439 55.027114 11.5 55.199219 L 51.195312 55.199219 C 52.934562 55.433915 55.164599 54.729057 55.099609 52.599609 L 55.099609 12.90625 C 55.334305 11.167 54.629448 8.935012 52.5 9 L 11.5 9 z M 22.671875 13.931641 A 4.3972788 4.3972788 0 0 1 22.705078 13.931641 A 4.3972788 4.3972788 0 0 1 27.101562 18.330078 A 4.3972788 4.3972788 0 0 1 22.705078 22.726562 A 4.3972788 4.3972788 0 0 1 18.306641 18.330078 A 4.3972788 4.3972788 0 0 1 22.671875 13.931641 z M 41.367188 13.931641 A 4.3972788 4.3972788 0 0 1 41.398438 13.931641 A 4.3972788 4.3972788 0 0 1 45.796875 18.330078 A 4.3972788 4.3972788 0 0 1 41.398438 22.726562 A 4.3972788 4.3972788 0 0 1 37.001953 18.330078 A 4.3972788 4.3972788 0 0 1 41.367188 13.931641 z M 22.671875 27.732422 A 4.3972788 4.3972788 0 0 1 22.705078 27.732422 A 4.3972788 4.3972788 0 0 1 27.101562 32.130859 A 4.3972788 4.3972788 0 0 1 22.705078 36.527344 A 4.3972788 4.3972788 0 0 1 18.306641 32.130859 A 4.3972788 4.3972788 0 0 1 22.671875 27.732422 z M 41.367188 27.732422 A 4.3972788 4.3972788 0 0 1 41.398438 27.732422 A 4.3972788 4.3972788 0 0 1 45.796875 32.130859 A 4.3972788 4.3972788 0 0 1 41.398438 36.527344 A 4.3972788 4.3972788 0 0 1 37.001953 32.130859 A 4.3972788 4.3972788 0 0 1 41.367188 27.732422 z M 22.671875 41.751953 A 4.3972788 4.3972788 0 0 1 22.705078 41.751953 A 4.3972788 4.3972788 0 0 1 27.101562 46.150391 A 4.3972788 4.3972788 0 0 1 22.705078 50.546875 A 4.3972788 4.3972788 0 0 1 18.306641 46.150391 A 4.3972788 4.3972788 0 0 1 22.671875 41.751953 z M 41.398438 41.751953 A 4.3972788 -4.3972788 0 0 1 45.796875 46.150391 A 4.3972788 -4.3972788 0 0 1 41.398438 50.546875 A 4.3972788 -4.3972788 0 0 1 37.001953 46.150391 A 4.3972788 -4.3972788 0 0 1 41.398438 41.751953 z " />
                    </g>
                </svg>`,
        d10: `<?xml version="1.0" encoding="utf-8"?>
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
        d100: `<?xml version="1.0" encoding="utf-8"?>
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
                </svg>`,
    };

    CONFIG.DICETRAY = { dice };

    Handlebars.registerHelper("dtSvgDie", (context) => `${context}Svg`);

    for (const [die, tpl] of Object.entries(CONFIG.DICETRAY.dice)) {
        Handlebars.registerPartial(`${die}Svg`, tpl);
    }
});

Hooks.on("renderSidebar", (app, html) => {
    const formula_applier = {
        apply_layout: (el) => _dtApplyGenericLayout(el),
        load_dice: () => [_objLoadGenericDice()],
    };

    foundry.applications.handlebars.renderTemplate(EON_DICE_TEMPLATES.tray, {
        dicerows: formula_applier.load_dice(),
    }).then((renderedHtml) => {
        const div = document.createElement("section");
        div.innerHTML = renderedHtml;

        const chatForm = html.querySelector("form.chat-form");
        if (!chatForm) {
            console.error("Chat form not found!");
            return;
        }

        const chatTextarea = chatForm.querySelector("#chat-message");
        if (chatTextarea) chatTextarea.insertAdjacentElement("afterend", div);
        else chatForm.appendChild(div);

        attachButtonEvents(div);
        formula_applier.apply_layout(html);
    });
});

function attachButtonEvents(div) {
    div.addEventListener("click", (event) => {
        const button = event.target.closest(".eon-roller__button, .eon-roller__num, .eon-roller__math");
        if (button) handleButtonClick(event, button);
    });

    div.addEventListener("contextmenu", (event) => {
        const button = event.target.closest(".eon-roller__button, .eon-roller__num, .eon-roller__math");
        if (button) handleButtonRightClick(event, button);
    });
}

function handleButtonClick(event, button) {
    if (
        button.classList.contains("eon-roller__math") &&
        button.classList.contains("flexrow") &&
        button.classList.contains("eon-wrapper")
    ) {
        return;
    }

    const dataset = button.dataset;
    event.preventDefault();

    if (button.classList.contains("eon-roller__button")) {
        if (diceType !== dataset.formula) numberDices = 0;
        diceType = dataset.formula;
        _dtUpdateChatDice(dataset, "add", document);
    }

    if (button.classList.contains("eon-roller__num")) {
        dataset.value = parseInt(button.innerText, 10);
        _dtUpdateChatDice(dataset, "calc", document);
    }

    if (button.classList.contains("eon-roller__math")) {
        const modInput = document.querySelector('input[name="dice.tray.modifier"]');
        if (!modInput) return;
        let mod_val = Number(modInput.value);
        mod_val = Number.isNaN(mod_val) ? 0 : mod_val;

        if (button.classList.contains("eon-roller__math--sub")) mod_val -= 1;
        else mod_val += 1;

        if (mod_val === 4) mod_val = 0;
        if (mod_val === -2) mod_val = 2;

        modInput.value = mod_val;
    }
}

function handleButtonRightClick(event, button) {
    if (
        button.classList.contains("eon-roller__math") &&
        button.classList.contains("flexrow") &&
        button.classList.contains("eon-wrapper")
    ) {
        return;
    }

    const dataset = button.dataset;
    event.preventDefault();

    if (button.classList.contains("eon-roller__button")) {
        if (numberDices === 0) diceType = "";
        else diceType = dataset.formula;
        _dtUpdateChatDice(dataset, "sub", document);
    }

    if (button.classList.contains("eon-roller__num")) {
        dataset.value = parseInt(button.innerText, 10);
        _dtUpdateChatDice(dataset, "calc", document);
    }

    if (button.classList.contains("eon-roller__math")) {
        const modInput = document.querySelector('input[name="dice.tray.modifier"]');
        if (!modInput) return;
        let mod_val = Number(modInput.value);
        mod_val = Number.isNaN(mod_val) ? 0 : mod_val;

        if (button.classList.contains("eon-roller__math--sub")) mod_val -= 1;
        else mod_val += 1;

        if (mod_val === 4) mod_val = 0;
        if (mod_val === -2) mod_val = 2;

        modInput.value = mod_val;
    }
}

function _dtUpdateChatDice(dataset, direction, html) {
    if (direction === "add") {
        numberDices++;
        if (diceType === "") {
            diceType = "d6";
            dataset.formula = diceType;
        }
    }
    if (direction === "sub") {
        if (numberDices > 0) numberDices--;
    }
    if (direction === "calc") {
        numberDices = dataset.value;

        if (diceType === "") {
            diceType = "d6";
            dataset.formula = diceType;
        }
        if (numberDices === -1) numberDices = 0;
    }

    const allDices = _objLoadGenericDice();

    for (const key of Object.keys(allDices)) {
        const el = html.querySelector(`.eon-roller__flag--${key}`);
        if (!el) continue;
        el.textContent = "";
        el.classList.add("hide");
    }

    const flag_button = html.querySelector(`.eon-roller__flag--${dataset.formula}`);

    if (numberDices === "") {
        numberDices = direction === "add" ? 1 : 0;
    }

    numberDices = Number(numberDices);

    if (!flag_button) return;

    if (numberDices > 0) {
        flag_button.textContent = String(numberDices);
        flag_button.classList.remove("hide");
    } else if (numberDices < 0) {
        flag_button.textContent = String(numberDices);
    } else {
        flag_button.textContent = "";
        flag_button.classList.add("hide");
    }
}

function _dtApplyGenericLayout(html) {
    html.querySelector(".eon-roller__roll")?.addEventListener("click", async (event) => {
        event.preventDefault();

        const modInput = html.querySelector('input[name="dice.tray.modifier"]');
        if (!modInput) return;

        const bonus = Number(modInput.value);

        await rollDice(numberDices, bonus, diceType, obRoll);

        const flag = html.querySelector(`.eon-roller__flag--${diceType}`);
        if (flag) {
            flag.textContent = "";
            flag.classList.add("hide");
        }
        numberDices = 0;
        diceType = "";
        modInput.value = 0;
    });

    html.querySelector(".eon-roller__ob")?.addEventListener("click", (event) => {
        event.preventDefault();
        const obButton = html.querySelector(".eon-roller__ob");
        if (!obButton) return;

        if (obRoll) obButton.classList.remove("active");
        else obButton.classList.add("active");

        obRoll = !obRoll;
    });
}

function _objLoadGenericDice() {
    return {
        d6: "d6",
        d10: "d10",
        d100: "d100",
    };
}

async function rollDice(number, bonus, type, obRollActive) {
    let canRoll = number > 0;
    let result = 0;
    const diceResult = [];
    let numDices = number;
    let rolledDices = 0;
    const allRolls = [];

    while (numDices > rolledDices) {
        const roll = new Roll(`1${type}`);
        allRolls.push(roll);
        await roll.evaluate();

        roll.terms[0].results.forEach((dice) => {
            rolledDices += 1;

            if (type === "d6" && dice.result === 6 && obRollActive) {
                numDices += 1;
                rolledDices -= 1;
            } else {
                result += parseInt(dice.result, 10);
            }

            diceResult.push(dice.result);
        });
    }

    const diceList = [];

    if (canRoll) {
        diceResult.forEach((dice) => diceList.push(dice));
        result += parseInt(bonus, 10);
    }

    const dicetypeLabel = type.replace("d", "T");
    let text = `Slår ${number}${dicetypeLabel}`;

    if (bonus > 0) text = `Slår ${number}${dicetypeLabel}+${bonus}`;
    else if (bonus < 0) text = `Slår ${number}${dicetypeLabel}${bonus}`;

    const templateData = {
        data: {
            dicetype: type,
            config: undefined,
            dicecolor: game.settings.get("eon-rpg", "diceColor"),
            isrollable: canRoll,
            type: "general",
            action: "Slår generella tärningar",
            title: text,
            diceresult: diceList,
            result,
            obroll: obRollActive,
        },
    };

    const rendered = await foundry.applications.handlebars.renderTemplate(EON_DICE_TEMPLATES.roll, templateData);

    const chatData = {
        rolls: allRolls,
        content: rendered,
        speaker: ChatMessage.getSpeaker(),
        rollMode: game.settings.get("core", "rollMode"),
    };
    ChatMessage.create(chatData);

    return canRoll;
}
