// Import Modules
import { EonActor } from "./datamodels/actor/data/eonactor.js";

import * as models from "./datamodels/_module.js";
import * as sheets from "./sheets/_module.js";

// Import Config constants
import { eon } from "./config.js";
import { systemSettings } from "./settings.js";
import * as Templates from "./templates.js";
import * as Migration from "./migration.js";
import { datavaluta } from '../data/valuta.js';
import { CombatHelper } from "./combat-helper.js";
import { EonCombatTracker } from "./apps/EonCombatTracker.js";
import { CharacterCreationWizard } from "./apps/CharacterCreationWizard.js";
import { CombatAttackFlow } from "./combat-attack-flow.js";
import { CombatAttackChat } from "./combat-attack-chat.js";

import ItemHelper from "./item-helper.js";
import MigrationWizard from "./ui/migration-wizard-helper.js";
import { ensureUiLanguage } from "./language-helper.js";
import "./ui/eon-dice-tray.js";

let eonCombatTrackerApp = null;

/**
 * Replace config display strings with localized versions from lang (eon.config.*).
 * Called after CONFIG.EON = eon so templates and helpers see the correct language.
 */
function localizeEonConfig(eon) {
    const localizeKey = (key) => game.i18n.localize(key);

    // slag
    if (eon.slag) {
        eon.slag.grundegenskap = localizeKey("eon.config.slag.grundegenskap");
        eon.slag.fardighet = localizeKey("eon.config.slag.fardighet");
        eon.slag.mysterium = localizeKey("eon.config.slag.mysterium");
        eon.slag.vapen = localizeKey("eon.config.slag.vapen");
    }

    // grundegenskaper
    if (eon.grundegenskaper) {
        for (const attributKey of Object.keys(eon.grundegenskaper)) {
            const grundegenskap = eon.grundegenskaper[attributKey];
            if (grundegenskap && typeof grundegenskap === "object") {
                grundegenskap.namn = localizeKey(`eon.config.grundegenskaper.${attributKey}.namn`);
                if (grundegenskap.kort) {
                    grundegenskap.kort = localizeKey(`eon.config.grundegenskaper.${attributKey}.kort`);
                }
            }
        }
    }

    // harleddegenskaper
    if (eon.harleddegenskaper) {
        for (const attributKey of Object.keys(eon.harleddegenskaper)) {
            const harleddegenskap = eon.harleddegenskaper[attributKey];
            if (harleddegenskap && typeof harleddegenskap === "object" && harleddegenskap.namn) {
                harleddegenskap.namn = localizeKey(`eon.config.harleddegenskaper.${attributKey}.namn`);
            }
        }
    }

    // fardighetgrupper
    if (eon.fardighetgrupper) {
        for (const gruppKey of Object.keys(eon.fardighetgrupper)) {
            eon.fardighetgrupper[gruppKey] = localizeKey(`eon.config.fardighetgrupper.${gruppKey}`);
        }
    }

    // kroppsdelar.grund
    if (eon.kroppsdelar?.grund) {
        for (const kroppsdelKey of Object.keys(eon.kroppsdelar.grund)) {
            eon.kroppsdelar.grund[kroppsdelKey] = localizeKey(`eon.config.kroppsdelar.grund.${kroppsdelKey}`);
        }
    }

    // vapenskador
    if (eon.vapenskador) {
        for (const skadetypKey of Object.keys(eon.vapenskador)) {
            eon.vapenskador[skadetypKey] = localizeKey(`eon.config.vapenskador.${skadetypKey}`);
        }
    }

    // vapenavstand
    if (eon.vapenavstand) {
        for (const avstandKey of Object.keys(eon.vapenavstand)) {
            const avstandEntry = eon.vapenavstand[avstandKey];
            if (avstandEntry && typeof avstandEntry === "object" && avstandEntry.namn) {
                avstandEntry.namn = localizeKey(`eon.config.vapenavstand.${avstandKey}.namn`);
            }
        }
    }

    // vapengrupper
    if (eon.vapengrupper) {
        for (const vapengruppKey of Object.keys(eon.vapengrupper)) {
            const vapengrupp = eon.vapengrupper[vapengruppKey];
            if (vapengrupp && typeof vapengrupp === "object" && vapengrupp.namn) {
                vapengrupp.namn = localizeKey(`eon.config.vapengrupper.${vapengruppKey}.namn`);
            }
        }
    }

    // rustningsmaterial (forsvar + forsvar5)
    for (const forsvarKey of ["forsvar", "forsvar5"]) {
        const rustningsmaterial = eon[forsvarKey]?.rustningsmaterial;
        if (rustningsmaterial) {
            for (const materialKey of Object.keys(rustningsmaterial)) {
                const entry = rustningsmaterial[materialKey];
                if (entry && typeof entry === "object" && entry.namn) {
                    entry.namn = localizeKey(entry.namn);
                }
            }
        }
    }

    // aspekter
    if (eon.aspekter) {
        for (const aspektKey of Object.keys(eon.aspekter)) {
            eon.aspekter[aspektKey] = localizeKey(`eon.config.aspekter.${aspektKey}`);
        }
    }

    // magi
    if (eon.magi) {
        if (eon.magi.faltstorning) {
            for (const faltstorningKey of Object.keys(eon.magi.faltstorning)) {
                eon.magi.faltstorning[faltstorningKey] = localizeKey(`eon.config.magi.faltstorning.${faltstorningKey}`);
            }
        }
        if (eon.magi.varaktighet && typeof eon.magi.varaktighet === "object") {
            for (const varaktighetKey of Object.keys(eon.magi.varaktighet)) {
                const varaktighetEntry = eon.magi.varaktighet[varaktighetKey];
                if (typeof varaktighetEntry === "string") {
                    eon.magi.varaktighet[varaktighetKey] = localizeKey(`eon.config.magi.varaktighet.${varaktighetKey}`);
                }
            }
        }
        if (eon.magi.omradesomfang) {
            for (const omfangKey of Object.keys(eon.magi.omradesomfang)) {
                eon.magi.omradesomfang[omfangKey] = localizeKey(`eon.config.magi.omradesomfang.${omfangKey}`);
            }
        }
        if (eon.magi.rackvidd) {
            for (const rackviddKey of Object.keys(eon.magi.rackvidd)) {
                eon.magi.rackvidd[rackviddKey] = localizeKey(`eon.config.magi.rackvidd.${rackviddKey}`);
            }
        }
    }

    // utrustningsgrupper & utrustningsgrupper5
    if (eon.utrustningsgrupper) {
        for (const gruppKey of Object.keys(eon.utrustningsgrupper)) {
            eon.utrustningsgrupper[gruppKey] = localizeKey(`eon.config.utrustningsgrupper.${gruppKey}`);
        }
    }
    if (eon.utrustningsgrupper5) {
        for (const gruppKey of Object.keys(eon.utrustningsgrupper5)) {
            eon.utrustningsgrupper5[gruppKey] = localizeKey(`eon.config.utrustningsgrupper5.${gruppKey}`);
        }
    }

    // valuta (eon.valuta = { valuta: "Valuta" })
    if (eon.valuta && typeof eon.valuta === "object") {
        eon.valuta.valuta = localizeKey("eon.config.valuta");
    }

    // djurgrupper
    if (eon.djurgrupper) {
        for (const djurgruppKey of Object.keys(eon.djurgrupper)) {
            eon.djurgrupper[djurgruppKey] = localizeKey(`eon.config.djurgrupper.${djurgruppKey}`);
        }
    }

    // strid
    if (eon.strid?.lakningstakt?.namn) {
        eon.strid.lakningstakt.namn = localizeKey("eon.config.strid.lakningstakt.namn");
    }

    // combatPhases
    if (eon.combatPhases) {
        for (const fasKey of Object.keys(eon.combatPhases)) {
            const combatPhase = eon.combatPhases[fasKey];
            if (combatPhase && typeof combatPhase === "object" && combatPhase.namn) {
                combatPhase.namn = localizeKey(`eon.config.combatPhases.${fasKey}.namn`);
            }
        }
    }
}

/* ------------------------------------ */
/* 1. Init system						*/
/* ------------------------------------ */
Hooks.once("init", async function() {
    CONFIG.Actor.documentClass = EonActor;

    CONFIG.Actor.dataModels.Rollperson = models.EonRollperson;
    CONFIG.Actor.dataModels.Rollperson5 = models.Eon5Rollperson;
    CONFIG.Actor.dataModels.Motstandare5 = models.Eon5Motstandare;
    CONFIG.Actor.dataModels.Varelse = models.EonVarelse;

    CONFIG.Item.dataModels.Folkslag = models.EonFolkslag;
    CONFIG.Item.dataModels.Folkslag5 = models.Eon5Folkslag;
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
    CONFIG.EON.CharacterCreationWizard = CharacterCreationWizard;
    CONFIG.EON.CombatAttackFlow = CombatAttackFlow;
    CONFIG.EON.CombatAttackChat = CombatAttackChat;
    CombatAttackChat.registerHooks();
    // Localize config strings from lang (eon.config.*) so templates get correct language
    localizeEonConfig(eon);
    CONFIG.EON.settings = [];
    CONFIG.EON.settings.bookEon = game.settings.get("eon-rpg", "bookEon");
    CONFIG.EON.settings.bookCombat = game.settings.get("eon-rpg", "bookCombat") == "strid";
    CONFIG.EON.settings.bookMagic = game.settings.get("eon-rpg", "bookMagic");
    CONFIG.EON.settings.weightRules = game.settings.get("eon-rpg", "weightRules");
    CONFIG.EON.settings.hinderenceSkillGroupMovement = game.settings.get("eon-rpg", "hinderenceSkillGroupMovement");
    CONFIG.EON.settings.hinderenceAttributeMovement = game.settings.get("eon-rpg", "hinderenceAttributeMovement");
    CONFIG.EON.settings.stridEon5KroppsbyggnadAvdrag = game.settings.get("eon-rpg", "stridEon5KroppsbyggnadAvdrag");
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
    foundry.documents.collections.Actors.registerSheet("EON", sheets.Eon5MotstandareSheet, {
        types: ["Motstandare5"],
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
    // Per-spelarspråk: förstaval + återställ preferens vid inloggning i Eon-världen
    await ensureUiLanguage();

	const installedVersion = game.settings.get("eon-rpg", "systemVersion");
    const systemVersion = game.system.version;
    const isDemo = false;

    if (game.user.isGM) {
        if (((installedVersion !== systemVersion || installedVersion === null)) || (isDemo)) {
            if ((Migration.CompareVersion(installedVersion, systemVersion)) || (isDemo)) {     
                await Migration.patchWorld(systemVersion, installedVersion, game.EON); 
                await Migration.DoNotice(systemVersion, installedVersion, isDemo);
                game.settings.set("eon-rpg", "systemVersion", systemVersion);
            }
        }      
        
        // Visa wizards en i taget med kort fördröjning (första först, sedan nästa när användaren stängt)
        const showWizards = async () => {
            // if (!game.settings.get('eon-rpg', 'eoncombattrackerbeta')) {
            //     await MigrationWizard.show([
            //             // Sida 1
            //             `<h2>Eon Combat Tracker</h2>
            //             <p>Eon Combat Tracker är systemets strids-/initiativspår som visas överst i mitten när du startar en <strong>encounter</strong>. Den följer Eons fasindelning (Avstånd, Närstrid, Mystik, Övrigt) och stödjer <strong>delstrider</strong> enligt regelboken.</p>
            //             <p>Alla deltagare i encountern visas som porträtt. För varje porträtt kan du välja fas, slå initiativ (Reaktion), vid närstrid välja motståndare och bekräfta delstrid, samt använda <strong>Nästa</strong> för att gå vidare. Turordningen hanterar delstrider en i taget.</p>`,
            //             // Sida 2
            //             `<h2>Så använder du trackern</h2>
            //             <ol style="margin-left: 20px; margin-top: 10px;">
            //             <li><strong>Skapa encounter</strong></li>
            //             <li><strong>Välj deltagare</strong> – Lägg till respektive deltagare genom Foundry på normalt sätt.</li>
            //             <li><strong>Starta encounter</strong> – Eon Combat Tracker visas automatiskt överst.</li>                
            //             <li><strong>Välj fas</strong> – Varje deltagare väljer först fas. Alla måste välja fas innan andra val blir tillgängliga.</li>
            //             <li><strong>Slå initiativ</strong> – Öppnar formuläret för att slå Reaktion, lägg till eventuell bonus. Försvarare i delstrid slår inte initiativ separat. Finns en "slå initiativ för alla" knapp på vänster hovermeny.</li>
            //             <li><strong>Delstrid</strong> – Vid Närstrid: välj motståndare, bekräfta delstrid, sätt roll. Byta motståndare kräver att du först lämnar delstrid. Den som väljer motståndare sätts automatiskt som anfallare.</li>
            //             <li><strong>Nästa/föregående</strong> – Man flyttar markeringen vems tur det är med pilarna i vänster/höger hovermeny; turordningen följer en delstrid i taget. Efter den som är sist i rundan finns en markering; då blir det ny runda.</li>
            //             <li><strong>Avsluta striden</strong> – När striden är slut stäng encounter i Foundry och trackern kommer att stängas automatiskt.</li>
            //             </ol>`
            //     ], 'eoncombattrackerbeta');
            // }

            // 1) Aldrig läst grund → 3-sidig wizard (sida 1–2 befintlig + sida 3 ny)
            if (!game.settings.get('eon-rpg', 'eoncombattrackerbeta')) {
                await MigrationWizard.show([
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
                    <li><strong>Slå initiativ</strong> – Öppnar formuläret för att slå Reaktion, lägg till eventuell bonus. Försvarare i delstrid slår inte initiativ separat. Finns en "slå initiativ för alla" knapp på vänster hovermeny.</li>
                    <li><strong>Delstrid</strong> – Vid Närstrid: välj motståndare, bekräfta delstrid, sätt roll. Byta motståndare kräver att du först lämnar delstrid. Den som väljer motståndare sätts automatiskt som anfallare.</li>
                    <li><strong>Nästa/föregående</strong> – Man flyttar markeringen vems tur det är med pilarna i vänster/höger hovermeny; turordningen följer en delstrid i taget. Efter den som är sist i rundan finns en markering; då blir det ny runda.</li>
                    <li><strong>Avsluta striden</strong> – När striden är slut stäng encounter i Foundry och trackern kommer att stängas automatiskt.</li>
                    </ol>`,
                    // Sida 3
                    `<h2>Anfall, försvar och skada</h2>
                    <p>Stridsmodulen hanterar nu hela flödet från vapenslag till skada.</p>
                    <ol style="margin-left: 20px; margin-top: 10px;">
                    <li><strong>Slå anfall</strong> – Välj mål (från trackern vid aktiv encounter/delstrid) och slå som vanligt.</li>
                    <li><strong>Försvar</strong> – Vid träff eller miss får försvararen en knapp i chatten för att slå försvar (undvika, vapen eller sköld).</li>
                    <li><strong>Resultat</strong> – Systemet jämför anfall vs försvar och visar träff/miss och eventuellt övertag.</li>
                    <li><strong>Träffplats och skada</strong> – Vid träff: slå träffplats (1T10), sedan skada, och till sist tillfoga skada på försvararen.</li>
                    </ol>
                    <p style="margin-top: 12px;">Du kan också <strong>markera som besegrad</strong>, <strong>ta bort från striden</strong> och <strong>öppna rollformulär</strong> via porträttet i trackern.</p>`
                ], 'eoncombattrackerbeta');
                if (game.settings.get('eon-rpg', 'eoncombattrackerbeta')) {
                    await game.settings.set('eon-rpg', 'eoncombattracker', true);
                }
            }
            // 2) Läst grund (äldre 5.3/5.4) men inte attack → enbart attack-wizard
            else if (!game.settings.get('eon-rpg', 'eoncombattracker')) {
                await MigrationWizard.show([
                    `<h2>Nytt: Anfall och försvar i stridsmodulen</h2>
                    <p>Eon Combat Tracker hanterar nu hela stridsflödet – inte bara initiativ och delstrider.</p>
                    <p>När du slår <strong>anfall</strong> mot ett mål i en aktiv encounter går flödet vidare i chatten:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Försvararen slår <strong>försvar</strong> via knapp i chatten</li>
                    <li>Systemet visar <strong>träff/miss</strong> och övertag</li>
                    <li>Vid träff: <strong>träffplats</strong>, <strong>skadeslag</strong> och <strong>tillfoga skada</strong></li>
                    </ul>
                    <p style="margin-top: 12px;">Mål väljs automatiskt från trackern vid närstrid (delstrid) och avståndsvapen. Bekräfta delstrid i trackern innan närstridsanfall.</p>`
                ], 'eoncombattracker');
            }

            if (!game.settings.get('eon-rpg', 'eoncreationwizard')) {
                await MigrationWizard.show([
                        // Sida 1
                        `<h2>Hjälpformuläret för Eon 5</h2>
                        <p>För en <strong>Eon 5-rollperson</strong> som ännu inte är slutförd använder du <strong>Hjälpformuläret</strong> – samma typ av val och hjälpfält som i regelboken. Du byter <strong>flik</strong> (Val, Händelser, Grundegenskaper, Färdigheter, …) och har en <strong>översikt till vänster</strong> med viktiga siffror och tabellslag.</p>
                        <p>Utkastet sparas på <strong>samma rollperson</strong> medan du arbetar. <strong>Slutför</strong> överför då uppgifterna till det ordinarie rollformuläret enligt reglerna. Redan under skapandet kan en del synas på arket (t.ex. grundfärdigheter och föremål du lagt till). <strong>Fortsätt senare</strong> stänger fönstret och behåller utkastet – öppna rollpersonen igen för att fortsätta.</p>
                        <p style="margin-top: 12px;">När du <strong>öppnar arket</strong> för en oslutförd rollperson öppnas karaktärsskapandet oftast <strong>automatiskt</strong>.</p>`
                ], 'eoncreationwizard');
            }

            if (!game.settings.get('eon-rpg', 'eondiceremoval')) {
                await MigrationWizard.show([
                        // Sida 1
                        `<h2>Borttagning av krav till EON dice helper</h2>
                        <p>Från och med denna versionen behöver man inte ha modulen Eon dice helper installerad. OM du kan se två uppsättningar av tärningspanelen gå in i modulinställningarna och kryssa bort Eon dice helper. Starta sedan om Foundry.</p>
                        <p>All funktion som den modulen hade är nu en del av systemets grundfunktioner.</p>`
                ], 'eondiceremoval');
            }
        };
        setTimeout(() => showWizards(), 100);
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

    if (!game.settings.get("eon-rpg", "eonCombatTrackerEnabled")) {
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

Hooks.on("updateCombatant", async () => {
    await renderEonCombatTrackerIfNeeded();
});

Hooks.on("createCombatant", async () => {
    await renderEonCombatTrackerIfNeeded();
});

Hooks.on("deleteCombat", async () => {
    await renderEonCombatTrackerIfNeeded();
});

function getSheetElementRoot(sheet) {
    const el = sheet?.element;
    if (!el) return null;
    return el instanceof HTMLElement ? el : el[0];
}

Hooks.on("renderActorSheet", (sheet) => {
    const root = getSheetElementRoot(sheet);
    if (!root) return;
    clearHTML(sheet);

    if (CONFIG.EON.settings.textfont == "eon1") {
        root.classList.add("eon-text");
    }
    else {
        root.classList.add("normal-text");
    }

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        root.classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        root.classList.add("eon2-headline");
    }
    else {
        root.classList.add("normal-headline");
    }
});

Hooks.on("renderActorSheetV2", (sheet) => {
    const root = getSheetElementRoot(sheet);
    if (!root) return;
    clearHTML(sheet);

    if (CONFIG.EON.settings.textfont == "eon1") {
        root.classList.add("eon-text");
    }
    else {
        root.classList.add("normal-text");
    }

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        root.classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        root.classList.add("eon2-headline");
    }
    else {
        root.classList.add("normal-headline");
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
    if ((sheet.object.type.toLowerCase().replace(" ", "") == "folkslag") || (sheet.object.type.toLowerCase().replace(" ", "") == "folkslag5")) {
        sheet.element[0].classList.add("folkslag");
    }
});

Hooks.on("renderItemSheetV2", (sheet) => {
    const root = getSheetElementRoot(sheet);
    if (!root) return;
    clearHTML(sheet);

    if (CONFIG.EON.settings.textfont == "eon1") {
        root.classList.add("eon-text");
    }
    else {
        root.classList.add("normal-text");
    }

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        root.classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        root.classList.add("eon2-headline");
    }
    else {
        root.classList.add("normal-headline");
    }

    const item = sheet.document ?? sheet.item;
    if (!item?.type) return;

    const itemType = item.type.toLowerCase().replace(" ", "");
    if (itemType === "närstridsvapen" || itemType === "avståndsvapen" || itemType === "sköld") {
        root.classList.add("vapen");
    }
    if (itemType === "rustning") {
        root.classList.add("rustning");
    }
    if (itemType === "besvärjelse" || itemType === "mysterie") {
        root.classList.add("besvarjelse");
    }
    if (itemType === "folkslag" || itemType === "folkslag5") {
        root.classList.add("folkslag");
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

    const formObj = sheet.object;
    if (formObj) {
        const typNorm = formObj.typ?.toLowerCase?.()?.replace?.(" ", "");
        if (typNorm === "vapen") {
            sheet.element[0].classList.add("vapen");
        }
        if (typNorm === "rustning") {
            sheet.element[0].classList.add("rustning");
        }
        if (typNorm === "spell") {
            sheet.element[0].classList.add("besvarjelse");
        }

        const typeNorm = formObj.type?.toLowerCase?.()?.replace?.(" ", "");
        if (typeNorm === "folkslag" || typeNorm === "folkslag5") {
            sheet.element[0].classList.add("folkslag");
        }
    }    
});

Hooks.on("renderApplicationV2", (app) => {
    const root = getSheetElementRoot(app);
    if (!root) return;
    clearHTML(app);

    if (CONFIG.EON.settings.textfont == "eon1") {
        root.classList.add("eon-text");
    }
    else {
        root.classList.add("normal-text");
    }

    if (CONFIG.EON.settings.headlinefont == "eon1") {
        root.classList.add("eon1-headline");
    }
    else if (CONFIG.EON.settings.headlinefont == "eon2") {
        root.classList.add("eon2-headline");
    }
    else {
        root.classList.add("normal-headline");
    }

    const formObj = app.object ?? app.document;
    if (formObj) {
        const typNorm = formObj.typ?.toLowerCase?.()?.replace?.(" ", "");
        if (typNorm === "vapen") {
            root.classList.add("vapen");
        }
        if (typNorm === "rustning") {
            root.classList.add("rustning");
        }
        if (typNorm === "spell") {
            root.classList.add("besvarjelse");
        }

        const typeNorm = formObj.type?.toLowerCase?.()?.replace?.(" ", "");
        if (typeNorm === "folkslag" || typeNorm === "folkslag5") {
            root.classList.add("folkslag");
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
    const root = getSheetElementRoot(sheet);
    if (!root) return;
	root.classList.remove("vapen");
    root.classList.remove("rustning");
    root.classList.remove("besvarjelse");
    root.classList.remove("folkslag");
    root.classList.remove("normal-text");
    root.classList.remove("eon-text");
    root.classList.remove("normal-headline");
    root.classList.remove("eon1-headline");
    root.classList.remove("eon2-headline");
}