// Import Modules
import * as models from "./datamodels/_module.js";
import * as sheets from "./sheets/_module.js";

// Import Config constants
import { eon } from "./config.js";
import { systemSettings } from "./settings.js";
import * as Templates from "./templates.js";
import * as Migration from "./migration.js";

/* ------------------------------------ */
/* 1. Init system						*/
/* ------------------------------------ */
Hooks.once("init", async function() {
    CONFIG.Actor.dataModels.Rollperson = models.EonRollperson;
    CONFIG.Actor.dataModels.Varelse = models.EonVarelse;

    CONFIG.Item.dataModels.Folkslag = models.EonFolkslag;
    CONFIG.Item.dataModels.Färdighet = models.EonFardighet;
    CONFIG.Item.dataModels.Språk = models.EonSprak;
    CONFIG.Item.dataModels.Mysterie = models.EonMysterie;
    CONFIG.Item.dataModels.Avvisning = models.EonAvvisning;
    CONFIG.Item.dataModels.Besvärjelse = models.EonBesvarjelse;
    CONFIG.Item.dataModels.Närstridsvapen = models.EonNarstridsvapen;
    CONFIG.Item.dataModels.Avståndsvapen = models.EonAvstandsvapen;
    CONFIG.Item.dataModels.Sköld = models.EonSkold;
    CONFIG.Item.dataModels.Rustning = models.EonRustning;
    CONFIG.Item.dataModels.Utrustning = models.EonUtrustning;
    CONFIG.Item.dataModels.Skada = models.EonSkada;

    // Register System Settings
	systemSettings();

    CONFIG.EON = eon;
    CONFIG.EON.settings = [];
    CONFIG.EON.settings.bookCombat = game.settings.get("eon-rpg", "bookCombat") == "strid";
    CONFIG.EON.settings.bookMagic = game.settings.get("eon-rpg", "bookMagic");
    CONFIG.EON.settings.weightRules = game.settings.get("eon-rpg", "weightRules");
    CONFIG.EON.settings.hinderenceSkillGroupMovement = game.settings.get("eon-rpg", "hinderenceSkillGroupMovement");
    CONFIG.EON.settings.hinderenceSkillGroupMovement = game.settings.get("eon-rpg", "hinderenceAttributeMovement");
    CONFIG.EON.settings.textfont = game.settings.get("eon-rpg", "textfont");
    CONFIG.EON.settings.headlinefont = game.settings.get("eon-rpg", "headlinefont");

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("EON", sheets.EonActorSheet, { types: ["Rollperson"], makeDefault: true });
    Actors.registerSheet("EON", sheets.EonCreatureSheet, { types: ["Varelse"], makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("EON", sheets.EonItemSheet, { makeDefault: true });

    Templates.PreloadHandlebarsTemplates();
    Templates.RegisterHandlebarsHelpers();
    game.EON = await Templates.Setup();
});

/* ------------------------------------ */
/* 2. Setup system						*/
/* ------------------------------------ */
Hooks.once("setup", function () {
    // Do anything after initialization but before
    // ready
});

/* ------------------------------------ */
/* 3. When ready						*/
/* ------------------------------------ */
Hooks.once("ready", async () => {
    // Do anything once the system is ready
	const installedVersion = game.settings.get("eon-rpg", "systemVersion");
    const systemVersion = game.data.system.version;
    const isDemo = false;

    if (game.user.isGM) {
        if (((installedVersion !== systemVersion || installedVersion === null)) || (isDemo)) {
            if ((Migration.CompareVersion(installedVersion, systemVersion)) || (isDemo)) {     
                await Migration.patchWorld(systemVersion, installedVersion, game.EON); 
                await Migration.DoNotice(systemVersion, installedVersion);
                game.settings.set("eon-rpg", "systemVersion", systemVersion);
            }
        }
    } 
});

Hooks.on("renderActorSheet", (sheet) => { 
    clearHTML(sheet);

    if (CONFIG.EON.settings.textfont == "eon1") {
        sheet.element[0].classList.add("eon-text");
    }
    else {
        sheet.element[0].classList.add("normal-text");
    }    

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        sheet.element[0].classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        sheet.element[0].classList.add("eon2-headline");
    }
    else {
        sheet.element[0].classList.add("normal-headline");
    }
});

Hooks.on("renderItemSheet", (sheet) => { 
    clearHTML(sheet);

    if (CONFIG.EON.settings.textfont == "eon1") {
        sheet.element[0].classList.add("eon-text");
    }
    else {
        sheet.element[0].classList.add("normal-text");
    }    

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        sheet.element[0].classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        sheet.element[0].classList.add("eon2-headline");
    }
    else {
        sheet.element[0].classList.add("normal-headline");
    }

    if ((sheet.object.type.toLowerCase().replace(" ", "") == "närstridsvapen") || 
            (sheet.object.type.toLowerCase().replace(" ", "") == "avståndsvapen") || 
            (sheet.object.type.toLowerCase().replace(" ", "") == "sköld")) {
        sheet.element[0].classList.add("vapen");
    }	
    if (sheet.object.type.toLowerCase().replace(" ", "") == "rustning") {
        sheet.element[0].classList.add("rustning");
    }
    if ((sheet.object.type.toLowerCase().replace(" ", "") == "besvärjelse") ||
        (sheet.object.type.toLowerCase().replace(" ", "") == "mysterie")) {
        sheet.element[0].classList.add("besvarjelse");
    }
});

/* ------------------------------------ */
/* When rendered a sheet    			*/
/* ------------------------------------ */
Hooks.on("renderFormApplication", (sheet) => { 
    clearHTML(sheet);

    if (CONFIG.EON.settings.textfont == "eon1") {
        sheet.element[0].classList.add("eon-text");
    }
    else {
        sheet.element[0].classList.add("normal-text");
    }    

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        sheet.element[0].classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        sheet.element[0].classList.add("eon2-headline");
    }
    else {
        sheet.element[0].classList.add("normal-headline");
    }

    if (sheet.object?.typ != undefined) {
        if (sheet.object.typ.toLowerCase().replace(" ", "") == "vapen") {
            sheet.element[0].classList.add("vapen");
        }

        if (sheet.object.typ.toLowerCase().replace(" ", "") == "rustning") {
            sheet.element[0].classList.add("rustning");
        }

        if (sheet.object.typ.toLowerCase().replace(" ", "") == "spell") {
            sheet.element[0].classList.add("besvarjelse");
        }
    }    
});

Hooks.on("renderDialog", (sheet) => { 
    clearHTML(sheet);

    // sheet.element[0].classList.remove("EON");
    // sheet.element[0].classList.add("EON");

    if (CONFIG.EON.settings.textfont == "eon1") {
        sheet.element[0].classList.add("eon-text");
    }
    else {
        sheet.element[0].classList.add("normal-text");
    }    

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        sheet.element[0].classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        sheet.element[0].classList.add("eon2-headline");
    }
    else {
        sheet.element[0].classList.add("normal-headline");
    }    
});

function clearHTML(sheet) {
	sheet.element[0].classList.remove("vapen");
    sheet.element[0].classList.remove("rustning");
    sheet.element[0].classList.remove("besvarjelse");
    sheet.element[0].classList.remove("normal-text");
    sheet.element[0].classList.remove("eon-text");
    sheet.element[0].classList.remove("normal-headline");
    sheet.element[0].classList.remove("eon1-headline");
    sheet.element[0].classList.remove("eon2-headline");
}