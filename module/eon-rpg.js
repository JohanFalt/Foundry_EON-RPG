// Import Modules
import { EonActor } from "./datamodels/actor/data/eonactor.js";

import * as models from "./datamodels/_module.js";
import * as sheets from "./sheets/_module.js";

// Import Config constants
import { eon } from "./config.js";
import { systemSettings } from "./settings.js";
import * as Templates from "./templates.js";
import * as Migration from "./migration.js";
import { datavaluta } from '../packs/valuta.js';
import { CombatHelper } from "./combat-helper.js";
import { EonCombatTracker } from "./apps/EonCombatTracker.js";

import ItemHelper from "./item-helper.js";
import MigrationWizard from "./ui/migration-wizard-helper.js";

let eonCombatTrackerApp = null;

/* ------------------------------------ */
/* 1. Init system						*/
/* ------------------------------------ */
Hooks.once("init", async function() {
    CONFIG.Actor.documentClass = EonActor;

    CONFIG.Actor.dataModels.Rollperson = models.EonRollperson;
    CONFIG.Actor.dataModels.Rollperson5 = models.Eon5Rollperson;
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
    CONFIG.Item.dataModels.Valuta = models.EonValuta;
    CONFIG.Item.dataModels.Egenskap = models.EonEgenskap;

    // Register System Settings
	systemSettings();

    CONFIG.EON = eon;
    CONFIG.EON.settings = [];
    CONFIG.EON.settings.bookEon = game.settings.get("eon-rpg", "bookEon");
    CONFIG.EON.settings.bookCombat = game.settings.get("eon-rpg", "bookCombat") == "strid";
    CONFIG.EON.settings.bookMagic = game.settings.get("eon-rpg", "bookMagic");
    CONFIG.EON.settings.weightRules = game.settings.get("eon-rpg", "weightRules");
    CONFIG.EON.settings.hinderenceSkillGroupMovement = game.settings.get("eon-rpg", "hinderenceSkillGroupMovement");
    CONFIG.EON.settings.hinderenceAttributeMovement = game.settings.get("eon-rpg", "hinderenceAttributeMovement");
    CONFIG.EON.settings.textfont = game.settings.get("eon-rpg", "textfont");
    CONFIG.EON.settings.headlinefont = game.settings.get("eon-rpg", "headlinefont");

    CONFIG.EON.datavaluta = datavaluta;

    foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Actors.registerSheet("EON", sheets.EonActorSheet, { 
        types: ["Rollperson"],         
        makeDefault: true 
    });
    foundry.documents.collections.Actors.registerSheet("EON", sheets.Eon5ActorSheet, { 
        types: ["Rollperson5"],         
        makeDefault: true 
    });
    foundry.documents.collections.Actors.registerSheet("EON", sheets.EonCreatureSheet, { 
        types: ["Varelse"],         
        makeDefault: true
    });

    foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
    foundry.documents.collections.Items.registerSheet("EON", sheets.EonItemSheet, { makeDefault: true });

    Templates.PreloadHandlebarsTemplates();
    Templates.RegisterHandlebarsHelpers();
    game.EON = await Templates.Setup();
    
    // Initialize combat helper for initiative phase system
    CombatHelper.init();
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
                await Migration.DoNotice(systemVersion, installedVersion, isDemo);
                game.settings.set("eon-rpg", "systemVersion", systemVersion);
            }
        }      
        
        if (!game.settings.get('eon-rpg', 'eoncombattrackerbeta')) {
            MigrationWizard.show([
                // Sida 1
                `<h2>Eon Combat Tracker</h2>
                <p>Eon Combat Tracker är systemets strids-/initiativspår som visas överst i mitten när du startar en <strong>encounter</strong>. Den följer Eons fasindelning (Avstånd, Närstrid, Mystik, Övrigt) och stödjer <strong>delstrider</strong> enligt regelboken.</p>
                <p>Alla deltagare i encountern visas som porträtt. För varje porträtt kan du välja fas, slå initiativ (Reaktion), vid närstrid välja motståndare och bekräfta delstrid, samt använda <strong>Nästa</strong> för att gå vidare. Turordningen hanterar delstrider en i taget.</p>`,
                // Sida 2
                `<h2>Så använder du trackern</h2>
                <ol style="margin-left: 20px; margin-top: 10px;">
                <li><strong>Skapa encounter</strong></li>
                <li><strong>Välj deltagare</strong> – Lägg till respektive deltagare genom Foundry på normalt sätt.</li>
                <li><strong>Starta encounter</strong> – Eon Combat Tracker visas automatiskt överst.</li>                
                <li><strong>Välj fas</strong> – Varje deltagare väljer först fas. Alla måste välja fas innan andra val blir tillgängliga.</li>
                <li><strong>Slå initiativ</strong> – Öppnar formuläret för att slå Reaktion, lägg till eventuell bonus. Försvarare i delstrid slår inte initiativ separat.</li>
                <li><strong>Delstrid</strong> – Vid Närstrid: välj motståndare, bekräfta delstrid, sätt roll. Byta motståndare kräver att du först lämnar delstrid.</li>
                <li><strong>Nästa</strong> – Den som har tur klickar Nästa; turordningen följer en delstrid i taget. Sista i rundan har markering; då blir det ny runda.</li>
                <li><strong>Avsluta striden</strong> – När striden är slut stäng encounter i Foundry och trackern kommer att stängas automatiskt.</li>
                </ol>`,
                // Sida 3
                `<h2>Beta – vi vill ha din feedback</h2>
                <p>Eon Combat Tracker är för närvarande i <strong>beta</strong>. Det kan finnas buggar och saker som kan förbättras.</p>
                <p><strong>Vill du hjälpa till?</strong> Berätta gärna vad som fungerar bra och vad som kan bli bättre.</p>
                <p style="margin-top: 14px;">Skicka feedback och förbättringsförslag här:</p>
                <p style="margin-left: 20px; margin-top: 8px;"><a href="https://github.com/JohanFalt/Foundry_EON-RPG/discussions" target="_blank" rel="noopener">https://github.com/JohanFalt/Foundry_EON-RPG/discussions</a></p>
                <p style="margin-top: 12px;">Tack för att du testar Eon Combat Tracker!</p>`
            ], 'eoncombattrackerbeta');
        }
    } 

});

function isEncounterStarted(combat) {
    return Boolean(combat && combat.started);
}

function resolveHTMLElement(htmlLike) {
    if (!htmlLike) return null;
    if (htmlLike instanceof HTMLElement) return htmlLike;
    if (Array.isArray(htmlLike) && htmlLike[0] instanceof HTMLElement) return htmlLike[0];
    if (htmlLike[0] instanceof HTMLElement) return htmlLike[0];
    if (typeof htmlLike.querySelector === "function") return htmlLike;
    return null;
}

async function renderEonCombatTrackerIfNeeded() {
    if (!isEncounterStarted(game.combat)) {
        if (eonCombatTrackerApp) {
            await eonCombatTrackerApp.close({ force: true });
            eonCombatTrackerApp = null;
        }
        return;
    }

    if (!eonCombatTrackerApp) {
        eonCombatTrackerApp = new EonCombatTracker();
    }
    await eonCombatTrackerApp.render(true);
}

Hooks.on("renderCombatTracker", async (_app, html) => {
    await renderEonCombatTrackerIfNeeded();
});

Hooks.on("combatStart", async () => {
    await renderEonCombatTrackerIfNeeded();
});

Hooks.on("createCombat", async () => {
    await renderEonCombatTrackerIfNeeded();
});

Hooks.on("updateCombat", async () => {
    await renderEonCombatTrackerIfNeeded();
});

Hooks.on("deleteCombat", async () => {
    await renderEonCombatTrackerIfNeeded();
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
    if (sheet.object.type.toLowerCase().replace(" ", "") == "folkslag") {
        sheet.element[0].classList.add("folkslag");
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

        if (sheet.object.typ.toLowerCase().replace(" ", "") == "folkslag") {
            sheet.element[0].classList.add("folkslag");
        }
    }    
});

Hooks.on("renderDialog", (sheet) => { 
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

function clearHTML(sheet) {
	sheet.element[0].classList.remove("vapen");
    sheet.element[0].classList.remove("rustning");
    sheet.element[0].classList.remove("besvarjelse");
    sheet.element[0].classList.remove("folkslag");
    sheet.element[0].classList.remove("normal-text");
    sheet.element[0].classList.remove("eon-text");
    sheet.element[0].classList.remove("normal-headline");
    sheet.element[0].classList.remove("eon1-headline");
    sheet.element[0].classList.remove("eon2-headline");
}