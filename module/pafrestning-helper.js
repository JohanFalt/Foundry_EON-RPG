import { postTrayChatMessage } from "./dice-helper.js";
import {
    AttributeRoll,
    DialogAttributeRoll,
    DialogSkillRoll,
    SkillRoll
} from "./dialogs/dialog-skill-roll.js";

const PAFRESTNINGSTYPER = Object.freeze({
    hunger: { alternativFardighet: "" },
    nedkylning: { alternativFardighet: "vildmarksvana" },
    syrebrist: { alternativFardighet: "simma" },
    torst: { alternativFardighet: "" }
});

const SLAGTYPER = new Set(["chock", "dod"]);

/**
 * Manuella påfrestningsslag. Klassen räknar svårighet och beskriver följden,
 * men ändrar aldrig aktörens skador, tillstånd eller välmående.
 */
export default class PafrestningHelper {
    static get typer() {
        return PAFRESTNINGSTYPER;
    }

    /**
     * @param {Actor} actor
     * @param {string} pafrestningstyp
     * @param {"chock"|"dod"} slagtyp
     */
    static async openRoll(actor, pafrestningstyp, slagtyp) {
        const typ = String(pafrestningstyp || "").toLowerCase();
        const slag = String(slagtyp || "").toLowerCase();
        if (!actor?.isEon5 || !PAFRESTNINGSTYPER[typ] || !SLAGTYPER.has(slag)) return;

        const svarighet = Math.max(
            0,
            Math.floor(Number(actor.system?.skada?.pafrestning?.[typ]) || 0)
        );
        if (svarighet < 1) {
            ui.notifications.warn(game.i18n.localize("eon.pafrestning.svarighetSaknas"));
            return;
        }

        const fardighetsId = PAFRESTNINGSTYPER[typ].alternativFardighet;
        const fardighet = fardighetsId
            ? actor.items.find(
                (item) => item.type === "Färdighet"
                    && String(item.system?.id || "").toLowerCase() === fardighetsId
            )
            : null;
        const slagmetod = fardighet
            ? await this.#chooseRollMethod(typ, fardighet)
            : "livskraft";
        if (!slagmetod) return;

        const onRollComplete = async ({ result }) => {
            await this.#postResult(actor, typ, slag, svarighet, Number(result), slagmetod);
        };
        const options = {
            lockDifficulty: true,
            onRollComplete
        };

        if (slagmetod === "livskraft") {
            const title = game.i18n.format("eon.pafrestning.slagtitel", {
                slag: game.i18n.localize(`eon.pafrestning.${slag}`),
                typ: game.i18n.localize(`eon.pafrestning.typer.${typ}`)
            });
            const roll = new AttributeRoll(
                actor,
                "harleddegenskaper",
                "livskraft",
                title,
                slag
            );
            roll.svarighet = String(svarighet);
            await new DialogAttributeRoll(actor, roll, options).render(true);
            return;
        }

        const roll = new SkillRoll(fardighet, actor);
        roll.effectRollKind = slag;
        roll.svarighet = String(svarighet);
        await new DialogSkillRoll(actor, roll, options).render(true);
    }

    /**
     * @param {string} pafrestningstyp
     * @param {Item} fardighet
     * @returns {Promise<"livskraft"|"fardighet"|null>}
     */
    static async #chooseRollMethod(pafrestningstyp, fardighet) {
        const typ = game.i18n.localize(`eon.pafrestning.typer.${pafrestningstyp}`);
        const title = game.i18n.format("eon.pafrestning.valjSlagmetodTitel", { typ });
        const regeltext = game.i18n.localize(
            `eon.pafrestning.valjSlagmetodRegel.${pafrestningstyp}`
        );
        const content = [
            `<p>${game.i18n.format("eon.pafrestning.valjSlagmetodText", { typ })}</p>`,
            `<p class="hint">${regeltext}</p>`
        ].join("");

        try {
            return await foundry.applications.api.DialogV2.wait({
                window: { title },
                content,
                modal: true,
                rejectClose: false,
                buttons: [
                    {
                        action: "livskraft",
                        label: game.i18n.localize("eon.config.harleddegenskaper.livskraft.namn"),
                        default: true,
                        callback: () => "livskraft"
                    },
                    {
                        action: "fardighet",
                        label: game.i18n.has(fardighet.name)
                            ? game.i18n.localize(fardighet.name)
                            : fardighet.name,
                        callback: () => "fardighet"
                    }
                ]
            });
        } catch (_error) {
            return null;
        }
    }

    /**
     * @param {Actor} actor
     * @param {string} pafrestningstyp
     * @param {"chock"|"dod"} slagtyp
     * @param {number} svarighet
     * @param {number} result
     * @param {"livskraft"|"fardighet"} slagmetod
     */
    static async #postResult(actor, pafrestningstyp, slagtyp, svarighet, result, slagmetod) {
        const lyckat = result >= svarighet;
        const typ = game.i18n.localize(`eon.pafrestning.typer.${pafrestningstyp}`);
        const slag = game.i18n.localize(`eon.pafrestning.${slagtyp}`);
        const sections = [
            game.i18n.format("eon.pafrestning.resultatSammanfattning", {
                slag,
                typ,
                resultat: result,
                svarighet
            }),
            game.i18n.localize(
                lyckat
                    ? `eon.pafrestning.resultat.${slagtyp}.lyckat`
                    : `eon.pafrestning.resultat.${slagtyp}.misslyckat`
            )
        ];

        if (!lyckat && slagtyp === "chock") {
            sections.push(...this.#failureOptions(pafrestningstyp));
        }

        await postTrayChatMessage({
            actor,
            title: game.i18n.format("eon.pafrestning.resultatTitel", { slag, typ }),
            sections,
            result: `<em>${game.i18n.localize("eon.pafrestning.manuellHint")}</em>`,
            flags: {
                flowType: "pafrestning",
                pafrestningstyp,
                slagtyp,
                svarighet,
                slagresultat: result,
                lyckat,
                slagmetod
            }
        });
    }

    /**
     * @param {string} pafrestningstyp
     * @returns {string[]}
     */
    static #failureOptions(pafrestningstyp) {
        if (pafrestningstyp === "syrebrist") {
            return [game.i18n.localize("eon.pafrestning.foljd.utslagenTvingande")];
        }

        const options = [
            game.i18n.localize("eon.pafrestning.foljd.utslagen"),
            game.i18n.localize("eon.pafrestning.foljd.valmaende")
        ];
        if (pafrestningstyp === "nedkylning") {
            options.push(game.i18n.localize("eon.pafrestning.foljd.frostskada"));
        }
        return [
            game.i18n.localize("eon.pafrestning.foljd.valjEn"),
            ...options
        ];
    }
}
