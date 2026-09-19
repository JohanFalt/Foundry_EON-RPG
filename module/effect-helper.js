import CalculateHelper from "./calculate-helper.js";

const POOL_APPLY_TYPES = new Set(["tvarde", "skadebonus"]);
const AUTOMATED_EFFECT_TYPES = new Set([
    ...POOL_APPLY_TYPES,
    "utmattning",
    "rustning",
    "skadetabell",
    "tabellbonus",
    "allvarlig"
]);
const ALLVARLIG_TABLE_TYPES = new Set(["hugg", "kross", "stick", "slagsmal"]);
/** Läget "Använd inte": effekten stänger av det den pekar på i stället för att räkna. */
const MODE_BLOCK = "block";

/** @typedef {"skada"|"tillstand"|"faltstorning"} SkadaTyp */

/**
 * Samlar, matchar och applicerar effekter från items (Eon 5).
 * Effekt är data på item (`system.effekter[]`); denna klass är endast logik.
 */
export default class EffectHelper {
    static SKADA_TYP = {
        SKADA: "skada",
        TILLSTAND: "tillstand",
        FALTSTORNING: "faltstorning"
    };

    /**
     * Skada-item som kan bära effekter (ej fältstörning). Stödjer legacy type Tillstånd.
     * @param {Item} item
     * @returns {boolean}
     */
    static isSkadaEffectItem(item) {
        if (!item) return false;
        if (item.type === "Tillstånd") return true;
        if (item.type !== "Skada") return false;
        return item.system?.typ !== this.SKADA_TYP.FALTSTORNING;
    }

    /**
     * Temporärt tillstånd (Skada med typ tillstand, eller legacy Tillstånd-item).
     * @param {Item} item
     * @returns {boolean}
     */
    static isTillstandItem(item) {
        if (item?.type === "Tillstånd") return true;
        if (item?.type !== "Skada") return false;
        return item.system?.typ === this.SKADA_TYP.TILLSTAND;
    }

    /**
     * Allvarlig/långvarig skada (Skada med typ skada eller tom typ).
     * @param {Item} item
     * @returns {boolean}
     */
    static isAllvarligSkadaItem(item) {
        if (item?.type !== "Skada") return false;
        const typ = item.system?.typ;
        if (typ === this.SKADA_TYP.FALTSTORNING || typ === this.SKADA_TYP.TILLSTAND) return false;
        return typ === this.SKADA_TYP.SKADA || !typ;
    }

    /**
     * Normalisera item-data vid drop/kompendium (Tillstånd → Skada, sätt system.typ).
     * @param {object} itemData
     * @returns {object}
     */
    static normalizeSkadaItemData(itemData) {
        const data = foundry.utils.duplicate(itemData);
        if (data.type === "Tillstånd") {
            data.type = "Skada";
            data.system = data.system ?? {};
            data.system.typ = data.system.typ || this.SKADA_TYP.TILLSTAND;
        }
        if (data.type === "Skada" && data.system?.typ === this.SKADA_TYP.FALTSTORNING) {
            return data;
        }
        if (data.type === "Skada" && !data.system?.typ) {
            data.system = data.system ?? {};
            const varaktighet = data.system.varaktighet;
            const permanentVaraktighet = new Set(["tills_borttagen", "permanent", "dygn"]);
            data.system.typ = permanentVaraktighet.has(varaktighet)
                ? this.SKADA_TYP.SKADA
                : this.SKADA_TYP.TILLSTAND;
        }
        return data;
    }
    /**
     * @param {Actor} actor
     * @returns {boolean}
     */
    static isEon5(actor) {
        return actor?.isEon5 === true || CalculateHelper.isEon5Actor(actor);
    }

    /**
     * Är itemet kopplat till Eon 5? Effekter finns bara i Eon 5.
     * @param {Item} item
     * @returns {boolean}
     */
    static isEon5Item(item) {
        if (!item) return false;
        if (item.actor) return this.isEon5(item.actor);
        if (item.system?.installningar?.eon) return item.system.installningar.eon === "eon5";
        // Kompendiumkonvention: Eon 5-packs har suffix 5 (t.ex. efterverkningar5).
        if (item.pack) return item.pack.endsWith("5");
        return CONFIG.EON?.settings?.bookEon === "eon5";
    }

    /**
     * Item som ska visa effekteditorn: Egenskap eller Skada/tillstånd i Eon 5.
     * @param {Item} item
     * @returns {boolean}
     */
    static isEon5EffectItem(item) {
        if (item?.type !== "Egenskap" && item?.type !== "Skada") return false;
        if (item.system?.typ === this.SKADA_TYP.FALTSTORNING) return false;
        return this.isEon5Item(item);
    }

    /**
     * Platt lista av aktiva effekter från actorns Egenskap och Skada (inkl. tillstånd).
     * @param {Actor} actor
     * @returns {object[]}
     */
    static collectEffects(actor) {
        if (!actor || !this.isEon5(actor)) return [];

        const collected = [];
        for (const item of actor.items) {
            const isEgenskap = item.type === "Egenskap";
            if (!isEgenskap && !this.isSkadaEffectItem(item)) continue;

            const rows = Array.isArray(item.system?.effekter) ? item.system.effekter : [];
            rows.forEach((effect, index) => {
                if (effect?.aktiv === false) return;
                collected.push(this.#wrapEffect(effect, item, index, {
                    sourceLevel: item.system?.niva
                }));
            });
        }
        return collected;
    }

    /**
     * Effekter från vapenegenskaper (länkade Egenskap via uuid/pack eller sparad kopia).
     * @param {Item} vapen
     * @param {Actor} actor
     * @returns {Promise<object[]>}
     */
    static async collectWeaponEffects(vapen, actor) {
        if (!vapen || !this.isEon5(actor)) return [];

        const egenskaper = Array.isArray(vapen.system?.egenskaper) ? vapen.system.egenskaper : [];
        if (egenskaper.length === 0) return [];

        const collected = [];

        for (const entry of egenskaper) {
            let source = null;
            if (entry.uuid) {
                try {
                    source = await fromUuid(entry.uuid);
                } catch (_err) {
                    source = null;
                }
            }
            if (!source && entry._id) {
                source = actor.items.get(entry._id)
                    ?? game.items?.get(entry._id)
                    ?? null;
            }
            if (!source && entry.namn) {
                source = actor.items.find(
                    (i) => i.type === "Egenskap" && (i.system?.id === entry.namn || i.name === entry.label)
                ) ?? null;
            }

            const effectRows = Array.isArray(source?.system?.effekter)
                ? source.system.effekter
                : (Array.isArray(entry.effekter) ? entry.effekter : []);

            const pseudoItem = source ?? {
                _id: entry._id || entry.namn || entry.uuid || "vapen-egenskap",
                name: entry.label || entry.namn || vapen.name,
                type: "Egenskap",
                system: { id: entry.namn || "", effekter: effectRows }
            };

            effectRows.forEach((effect, index) => {
                if (effect?.aktiv === false) return;
                const wrapped = this.#wrapEffect(effect, pseudoItem, index, {
                    sourceLevel: entry.varde ?? entry.harniva ?? source?.system?.niva
                });
                wrapped.sourceKind = "vapen";
                wrapped.vapenId = vapen.id;
                wrapped.sourceName = entry.label || entry.namn || wrapped.sourceName;
                collected.push(wrapped);
            });
        }

        return collected;
    }

    /**
     * @param {object} effect
     * @param {object} context
     * @returns {boolean}
     */
    static matchesContext(effect, context = {}) {
        if (!effect || effect.aktiv === false) return false;

        const targets = this.#asStringArray(effect.targets);
        if (targets.length > 0 && !targets.some((t) => this.#targetMatches(t, context))) {
            return false;
        }

        const predicates = this.#asStringArray(effect.predicates);
        if (predicates.length > 0 && !predicates.every((p) => this.#predicateMatches(p, context))) {
            return false;
        }

        const exclusions = this.#asStringArray(effect.exclusions);
        if (exclusions.some((e) => this.#predicateMatches(e, context))) {
            return false;
        }

        // Effekt låst till en skadetyp gäller bara när slaget har den typen.
        // skadetabell använder skadetyp för vilken tabell som ska slås, inte som filter.
        const skadetyp = String(effect.skadetyp || "");
        if (
            effect.typ !== "skadetabell"
            && skadetyp
            && context.skadetyp
            && context.skadetyp !== skadetyp
        ) {
            return false;
        }

        return true;
    }

    /**
     * @param {Actor} actor
     * @param {object} context
     * @param {object} [options]
     * @param {object[]} [options.extraEffects]
     * @param {string[]} [options.types]
     * @param {boolean} [options.includeActorEffects=true]
     * @returns {object[]}
     */
    static getMatchingEffects(actor, context, options = {}) {
        const types = options.types ? new Set(options.types) : null;
        const base = options.includeActorEffects === false ? [] : this.collectEffects(actor);
        const extra = Array.isArray(options.extraEffects) ? options.extraEffects : [];
        return [...base, ...extra].filter((effect) => {
            if (types && !types.has(effect.typ)) return false;
            return this.matchesContext(effect, context);
        });
    }

    /**
     * Summera tärningar och bonus från tvarde/skadebonus utan poolnormalisering.
     * Används för att visa hur mycket effekterna bidrar med, t.ex. i taktikrutan,
     * där bidraget ska redovisas separat från grundpoolen. Override hoppas över
     * eftersom den ersätter poolen och inte kan uttryckas som ett tillägg.
     * @param {object[]} effects
     * @returns {{tvarde: number, bonus: number, sources: string[]}}
     */
    static sumPoolContribution(effects) {
        let tvarde = 0;
        let bonus = 0;
        const sources = [];

        for (const effect of effects ?? []) {
            if (!POOL_APPLY_TYPES.has(effect.typ)) continue;
            const mode = effect.mode || "add";
            if (mode === "override" || mode === MODE_BLOCK) continue;

            const sign = mode === "subtract" ? -1 : 1;
            const deltaT = sign * Number(effect.tvarde ?? 0);
            const deltaB = sign * Number(effect.bonus ?? 0);
            if (deltaT === 0 && deltaB === 0) continue;

            tvarde += deltaT;
            bonus += deltaB;

            const name = effect.sourceName || game.i18n.localize("eon.effects.okandKalla");
            if (!sources.includes(name)) sources.push(name);
        }

        return { tvarde, bonus, sources };
    }

    /**
     * Applicera matchande utmattningseffekter på utmattning som orsakas av skada.
     * Effekten använder fast `bonus` om den är skild från noll, annars källans nivå.
     * Ingen effekt appliceras om skadan inte orsakar minst 1 utmattning.
     * @param {number} baseUtmattning
     * @param {object[]} effects
     * @returns {{ value: number, applications: object[] }}
     */
    static applyUtmattningEffects(baseUtmattning, effects) {
        const base = Math.max(0, Math.floor(Number(baseUtmattning) || 0));
        if (base < 1) return { value: base, applications: [] };

        let value = base;
        const applications = [];

        for (const effect of effects ?? []) {
            if (effect?.typ !== "utmattning") continue;
            if (effect.mode === MODE_BLOCK) continue;

            const amount = this.#resolveNumericEffectValue(effect);
            const mode = effect.mode || "add";
            const before = value;

            if (mode === "override") value = amount;
            else if (mode === "subtract") value -= amount;
            else value += amount;

            value = Math.max(0, Math.floor(Number(value) || 0));
            if (value === before) continue;

            applications.push({
                effectId: effect.effectId || "",
                sourceName: effect.sourceName || game.i18n.localize("eon.effects.okandKalla"),
                mode,
                amount,
                delta: value - before
            });
        }

        return { value, applications };
    }

    /**
     * Applicera matchande rustningseffekter på skyddet mot en träff.
     * Effekten använder fast `bonus` om den är skild från noll, annars källans nivå
     * (t.ex. X på en vapenegenskap). Skyddet kan aldrig bli negativt.
     * @param {number} baseArmor
     * @param {object[]} effects
     * @returns {{ value: number, applications: object[] }}
     */
    static applyRustningEffects(baseArmor, effects) {
        const base = Math.max(0, Math.floor(Number(baseArmor) || 0));

        let value = base;
        const applications = [];

        for (const effect of effects ?? []) {
            if (effect?.typ !== "rustning") continue;
            if (effect.mode === MODE_BLOCK) continue;

            const amount = this.#resolveNumericEffectValue(effect);
            const mode = effect.mode || "add";
            const before = value;

            if (mode === "override") value = amount;
            else if (mode === "subtract") value -= amount;
            else value += amount;

            value = Math.max(0, Math.floor(Number(value) || 0));
            if (value === before) continue;

            applications.push({
                effectId: effect.effectId || "",
                sourceName: effect.sourceName || game.i18n.localize("eon.effects.okandKalla"),
                mode,
                amount,
                delta: value - before
            });
        }

        return { value, applications };
    }

    /**
     * Summera tabellbonus som läggs på raden vid allvarlig skada (t.ex. Sargande X).
     * Effektens `bonus` används när den är skild från noll, annars källans nivå,
     * vilket för en vapenegenskap är X-värdet på vapnet.
     * @param {object[]} effects
     * @returns {{ value: number, applications: object[] }}
     */
    static applyTabellbonusEffects(effects) {
        let value = 0;
        const applications = [];

        for (const effect of effects ?? []) {
            if (effect?.typ !== "tabellbonus") continue;
            if (effect.mode === MODE_BLOCK) continue;

            const amount = this.#resolveNumericEffectValue(effect);
            const mode = effect.mode || "add";
            const before = value;

            if (mode === "override") value = amount;
            else if (mode === "subtract") value -= amount;
            else value += amount;

            value = Math.floor(Number(value) || 0);
            if (value === before) continue;

            applications.push({
                effectId: effect.effectId || "",
                sourceName: effect.sourceName || game.i18n.localize("eon.effects.okandKalla"),
                mode,
                amount,
                delta: value - before
            });
        }

        return { value, applications };
    }

    /**
     * Vilken skadetabell allvarlig skada ska slås på. Rustning och skadeslag
     * påverkas inte — bara tabelluppslaget. Sista matchande effekten vinner.
     * @param {string} baseDamageType hugg|kross|stick från vapenslaget
     * @param {object[]} effects
     * @returns {{ tableType: string, sourceName: string }}
     */
    static resolveAllvarligTableType(baseDamageType, effects) {
        let tableType = String(baseDamageType || "hugg").toLowerCase();
        let sourceName = "";

        for (const effect of effects ?? []) {
            if (effect?.typ !== "skadetabell") continue;
            if (effect.mode === MODE_BLOCK) continue;
            const key = String(effect.skadetyp || "").trim().toLowerCase();
            if (!ALLVARLIG_TABLE_TYPES.has(key)) continue;
            tableType = key;
            sourceName = effect.sourceName || game.i18n.localize("eon.effects.okandKalla");
        }

        return { tableType, sourceName };
    }

    /**
     * Finns det en matchande effekt som förbjuder allvarlig skada (t.ex. Ytlig)?
     * Kräver läget "Använd inte", så samma effekttyp kan få fler lägen senare.
     * @param {object[]} effects
     * @returns {boolean}
     */
    static blocksAllvarlig(effects) {
        return (effects ?? []).some(
            (effect) => effect?.typ === "allvarlig"
                && effect.mode === MODE_BLOCK
                && effect.aktiv !== false
        );
    }

    /**
     * Är vapnet ett beväpnat anfall, till skillnad från obeväpnad kamp?
     * Mall eller vapenegenskap `obevapnad` räknas som obeväpnat.
     * @param {Item|object|null} vapen
     * @returns {boolean}
     */
    static isArmedWeapon(vapen) {
        if (!vapen) return false;

        const mall = String(vapen.system?.mall || "").toLowerCase();
        if (mall === "obevapnad") return false;

        const egenskaper = Array.isArray(vapen.system?.egenskaper) ? vapen.system.egenskaper : [];
        return !egenskaper.some((entry) => String(entry?.namn || "").toLowerCase() === "obevapnad");
    }

    /**
     * Gör effekter säkra att spara i ChatMessage-flaggor.
     * @param {object[]} effects
     * @returns {object[]}
     */
    static serializeEffects(effects) {
        return (effects ?? []).map((effect) => ({
            typ: effect.typ || "",
            mode: effect.mode || "add",
            tvarde: Number(effect.tvarde ?? 0),
            bonus: Number(effect.bonus ?? 0),
            sourceLevel: this.#asFiniteNumber(effect.sourceLevel),
            sourceName: effect.sourceName || "",
            effectId: effect.effectId || "",
            skadetyp: effect.skadetyp || "",
            targets: this.#asStringArray(effect.targets),
            predicates: this.#asStringArray(effect.predicates),
            exclusions: this.#asStringArray(effect.exclusions),
            aktiv: effect.aktiv !== false
        }));
    }

    /**
     * Formatera redan applicerade numeriska effekter för chatt.
     * @param {object[]} applications
     * @returns {string}
     */
    static formatEffectApplications(applications) {
        return (applications ?? []).map((application) => {
            const delta = Number(application.delta ?? 0);
            const sign = delta >= 0 ? "+" : "";
            return `${application.sourceName} ${sign}${delta}`;
        }).join(", ");
    }

    /**
     * Applicera tvarde/skadebonus på en pool. Övriga typer ignoreras (visas via describe).
     * @param {{tvarde: number, bonus: number}} pool
     * @param {object[]} effects
     * @returns {{tvarde: number, bonus: number}}
     */
    static applyToPool(pool, effects) {
        let tvarde = Number(pool?.tvarde ?? 0);
        let bonus = Number(pool?.bonus ?? 0);

        for (const effect of effects ?? []) {
            if (!POOL_APPLY_TYPES.has(effect.typ)) continue;

            const deltaT = Number(effect.tvarde ?? 0);
            const deltaB = Number(effect.bonus ?? 0);
            const mode = effect.mode || "add";

            if (mode === "override") {
                tvarde = deltaT;
                bonus = deltaB;
                continue;
            }

            const sign = mode === "subtract" ? -1 : 1;
            tvarde += sign * deltaT;
            bonus += sign * deltaB;
        }

        while (bonus < -1 && tvarde > 0) {
            tvarde -= 1;
            bonus += 3;
        }
        if (tvarde < 0) {
            tvarde = 0;
            bonus = 0;
        }

        return { tvarde, bonus };
    }

    /**
     * HTML-rader för dialog/chatt.
     * @param {object[]} effects
     * @returns {string}
     */
    static describeEffects(effects) {
        if (!effects?.length) return "";

        const lines = [];
        for (const effect of effects) {
            if (this.#isNoopEffect(effect)) continue;

            const source = effect.sourceName || game.i18n.localize("eon.effects.okandKalla");
            const automated = AUTOMATED_EFFECT_TYPES.has(effect.typ);

            const valueText = this.#formatEffectValue(effect);
            const suffix = automated
                ? ""
                : ` (${game.i18n.localize("eon.effects.ejAutomatiserad")})`;
            lines.push(
                `${game.i18n.format("eon.effects.modifierRad", {
                    source,
                    value: valueText
                })}${suffix}<br />`
            );
        }
        return lines.join("");
    }

    /**
     * Statusrader för slagdialoger (samma stil som Smärta: "Källa (−1T6)").
     * @param {object[]} effects
     * @returns {{ text: string, warning: boolean }[]}
     */
    static listEffectStatusItems(effects) {
        if (!effects?.length) return [];

        const items = [];
        for (const effect of effects) {
            if (this.#isNoopEffect(effect)) continue;

            const source = effect.sourceName || game.i18n.localize("eon.effects.okandKalla");
            const automated = AUTOMATED_EFFECT_TYPES.has(effect.typ);
            const valueText = String(this.#formatEffectValue(effect)).replace(/-/g, "−");
            const suffix = automated
                ? ""
                : ` (${game.i18n.localize("eon.effects.ejAutomatiserad")})`;

            items.push({
                text: `${source} (${valueText})${suffix}`,
                warning: this.#isNegativePoolEffect(effect)
            });
        }
        return items;
    }

    /**
     * @param {object} effect
     * @returns {boolean}
     */
    static #isNegativePoolEffect(effect) {
        const typ = effect?.typ || "tvarde";
        if (typ !== "tvarde" && typ !== "skadebonus") return false;

        const mode = effect.mode || "add";
        const t = Number(effect.tvarde ?? 0);
        const b = Number(effect.bonus ?? 0);
        if (mode === "subtract") return t > 0 || b > 0;
        if (mode === "override") return false;
        return t < 0 || b < 0;
    }

    /**
     * Bygg slagkontext för attributslag. Slagtypen styrs av en stabil nyckel
     * (t.ex. "chock"), inte av den lokaliserade rubriken.
     * @param {Actor} actor
     * @param {string} attributeKey
     * @param {string} [rollKey]
     * @returns {object}
     */
    static buildAttributeContext(actor, attributeKey, rollKey = "") {
        const context = {
            slag: ["attribut", `attribut:${attributeKey}`, "alla"],
            attribut: attributeKey,
            tags: []
        };
        if (rollKey) {
            context.slag.push(rollKey);
            context.tags.push(`slag:${rollKey}`);
        }
        return context;
    }

    /**
     * @param {Actor} actor
     * @param {Item} skillItem
     * @param {object} [extra]
     * @returns {object}
     */
    static buildSkillContext(actor, skillItem, extra = {}) {
        const grupp = skillItem?.system?.grupp || "";
        const skillId = skillItem?.system?.id || "";
        const slag = ["fardighet", "alla"];
        if (extra.rollKind) slag.push(extra.rollKind);
        return {
            slag,
            fardighet: skillId,
            grupp,
            tags: [],
            mal: extra.mal || "aktor",
            ...extra
        };
    }

    /**
     * @param {Actor} actor
     * @param {Item} vapen
     * @param {"anfall"|"forsvar"|"skada"} rollKind
     * @param {object} [extra]
     * @returns {object}
     */
    static buildWeaponContext(actor, vapen, rollKind, extra = {}) {
        const slag = ["vapen", "alla"];
        if (rollKind === "anfall") slag.push("anfall");
        if (rollKind === "forsvar") slag.push("forsvar");
        if (rollKind === "skada") slag.push("skada");

        return {
            slag,
            vapen: vapen?.id || null,
            vapenNamn: vapen?.name || "",
            vapenTyp: vapen?.type || "",
            fattning: extra.fattning || "",
            taktik: extra.taktik || "",
            skadetyp: extra.skadetyp || "",
            tags: [],
            mal: extra.mal || "aktor",
            ...extra
        };
    }

    /**
     * Minska rundor på Skada/tillstånd med varaktighet runda; ta bort vid 0.
     * @param {Actor} actor
     */
    static async tickRoundDurations(actor) {
        if (!actor || !this.isEon5(actor)) return;

        const updates = [];
        const deletions = [];

        for (const item of actor.items) {
            if (!this.isSkadaEffectItem(item)) continue;
            if (item.system?.varaktighet !== "runda") continue;

            const kvar = Number(item.system.rundorKvar);
            if (!Number.isFinite(kvar)) continue;

            if (kvar <= 1) {
                deletions.push(item.id);
            } else {
                updates.push({ _id: item.id, "system.rundorKvar": kvar - 1 });
            }
        }

        if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
        if (deletions.length) await actor.deleteEmbeddedDocuments("Item", deletions);
    }

    /**
     * Minska rundorKvar på Skada/tillstånd med varaktighet nasta_aktiva_fas;
     * tas bort vid 0. Anropas vid skifte mellan stridsfaser (inte per tur).
     * Saknas eller ogiltigt rundorKvar räknas som 1.
     * @param {Actor} actor
     */
    static async tickPhaseDurations(actor) {
        if (!actor || !this.isEon5(actor)) return;

        const updates = [];
        const deletions = [];

        for (const item of actor.items) {
            if (!this.isSkadaEffectItem(item)) continue;
            if (item.system?.varaktighet !== "nasta_aktiva_fas") continue;

            const raw = Number(item.system.rundorKvar);
            const kvar = Number.isFinite(raw) ? raw : 1;

            if (kvar <= 1) {
                deletions.push(item.id);
            } else {
                updates.push({ _id: item.id, "system.rundorKvar": kvar - 1 });
            }
        }

        if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
        if (deletions.length) await actor.deleteEmbeddedDocuments("Item", deletions);
    }

    /**
     * Slå varaktighetFormel (t.ex. 1T6) och sätt rundorKvar.
     * @param {Item} item
     * @returns {Promise<number|null>}
     */
    static async rollDurationIfNeeded(item) {
        const formel = String(item?.system?.varaktighetFormel || "").trim().toUpperCase();
        if (!formel) return item?.system?.rundorKvar ?? null;

        const match = formel.match(/^(\d+)T(\d+)$/i);
        if (!match) return item?.system?.rundorKvar ?? null;

        const count = Number(match[1]);
        const faces = Number(match[2]);
        const roll = await new Roll(`${count}d${faces}`).evaluate();
        const total = Number(roll.total);
        const update = { "system.rundorKvar": total };
        if (!item.system.varaktighet || item.system.varaktighet === "tills_borttagen") {
            update["system.varaktighet"] = "runda";
        }
        await item.update(update);
        return total;
    }

    /**
     * Hitta mall i kompendium efterverkningar5 (eller fallback-packs) via system.id / namn.
     * @param {string} keyOrName
     * @returns {Promise<Item|null>}
     */
    static async findEfterverkningTemplate(keyOrName) {
        const needle = String(keyOrName || "").trim();
        if (!needle) return null;

        const packNames = ["efterverkningar5", "eon-rpg.efterverkningar5"];
        for (const name of packNames) {
            const pack = game.packs.get(name) || game.packs.get(`eon-rpg.${name}`);
            if (!pack) continue;
            const index = await pack.getIndex({ fields: ["name", "system.id", "type"] });
            const entry = index.find((e) =>
                e.name === needle
                || e.system?.id === needle
                || String(e.name || "").toLowerCase() === needle.toLowerCase()
                || String(e.system?.id || "").toLowerCase() === needle.toLowerCase()
            );
            if (entry) {
                return await pack.getDocument(entry._id);
            }
        }
        return null;
    }

    /**
     * Applicera en namngiven efterverkning från kompendium på actor.
     * @param {Actor} actor
     * @param {string} keyOrName
     * @returns {Promise<Item|null>}
     */
    static async applyEfterverkningFromPack(actor, keyOrName) {
        if (!actor || !this.isEon5(actor)) return null;
        const template = await this.findEfterverkningTemplate(keyOrName);
        if (!template) return null;

        const data = foundry.utils.duplicate(template.toObject());
        delete data._id;
        data.system = data.system ?? {};
        data.system.installningar = data.system.installningar ?? {};
        data.system.installningar.eon = "eon5";
        data.system.kalla = data.system.kalla || keyOrName;
        const normalized = this.normalizeSkadaItemData(data);

        const created = await actor.createEmbeddedDocuments("Item", [normalized]);
        const item = created?.[0] ?? null;
        if (item && item.system?.varaktighetFormel) {
            await this.rollDurationIfNeeded(item);
        }
        return item;
    }

    /**
     * Normalisera fritext från skadetabell till { kind, key, amount?, ... }.
     * @param {string} raw
     * @returns {object|null}
     */
    static normalizeEffectString(raw) {
        const text = String(raw || "").trim().replace(/\.$/, "");
        if (!text) return null;

        let m = text.match(/^(\d+)\s*Smärta$/i);
        if (m) return { kind: "smarta", amount: Number(m[1]) };

        m = text.match(/^(\d+)\s*Sår\s*\(([^)]+)\)$/i);
        if (m) return { kind: "sar", amount: Number(m[1]), location: m[2].trim() };

        m = text.match(/^Blödning\s+(\d+)\s*\/\s*(\d+)$/i);
        if (m) return { kind: "blodning", rate: Number(m[1]), difficulty: Number(m[2]) };

        m = text.match(/^Infektion\s+(\d+)\s*\/\s*(\d+)$/i);
        if (m) return { kind: "infektion", rate: Number(m[1]), difficulty: Number(m[2]) };

        m = text.match(/^Inre\s+skada$/i);
        if (m) return { kind: "inreskada", amount: 1 };

        m = text.match(/^(Amputationsrisk|Brytrisk)\s+(\d+|Resultat[^\s]*)\s*\(([^)]+)\)$/i);
        if (m) {
            return {
                kind: "risk",
                riskType: m[1].toLowerCase(),
                difficulty: m[2],
                zone: m[3].trim()
            };
        }

        // Status / named efterverkning (may be compound)
        if (text.includes("/")) {
            return {
                kind: "compound",
                parts: text.split("/").map((p) => p.trim()).filter(Boolean)
            };
        }

        return { kind: "tillstand", key: text };
    }

    /**
     * Applicera normaliserade skadetabell-effekter (status via pack; fält via system.skada).
     * @param {Actor} actor
     * @param {string[]} effectStrings
     * @param {object} [options]
     * @returns {Promise<{applied: string[], skipped: string[]}>}
     */
    static async applyNormalizedTableEffects(actor, effectStrings, options = {}) {
        const applied = [];
        const skipped = [];
        const bodyPartKey = options.bodyPartKey || null;

        for (const raw of effectStrings ?? []) {
            const normalized = this.normalizeEffectString(raw);
            if (!normalized) {
                skipped.push(raw);
                continue;
            }

            if (normalized.kind === "compound") {
                const nested = await this.applyNormalizedTableEffects(actor, normalized.parts, options);
                applied.push(...nested.applied);
                skipped.push(...nested.skipped);
                continue;
            }

            if (normalized.kind === "tillstand") {
                const item = await this.applyEfterverkningFromPack(actor, normalized.key);
                if (item) applied.push(normalized.key);
                else skipped.push(raw);
                continue;
            }

            if (normalized.kind === "smarta") {
                const current = Number(actor.system.skada?.smarta ?? 0);
                await actor.update({ "system.skada.smarta": current + normalized.amount });
                applied.push(raw);
                continue;
            }

            if (normalized.kind === "sar") {
                const loc = this.#mapSarLocation(normalized.location, bodyPartKey);
                if (!loc) {
                    skipped.push(raw);
                    continue;
                }
                const path = `system.skada.sar.${loc}`;
                const current = Number(foundry.utils.getProperty(actor, path) ?? 0);
                await actor.update({ [path]: Math.min(3, current + normalized.amount) });
                applied.push(raw);
                continue;
            }

            if (normalized.kind === "blodning") {
                await actor.update({
                    "system.skada.blodning": Math.max(Number(actor.system.skada?.blodning ?? 0), normalized.rate),
                    "system.skada.blodningsvarighet": Math.max(
                        Number(actor.system.skada?.blodningsvarighet ?? 0),
                        normalized.difficulty
                    )
                });
                applied.push(raw);
                continue;
            }

            if (normalized.kind === "infektion") {
                await actor.update({
                    "system.skada.infektion": Math.max(Number(actor.system.skada?.infektion ?? 0), normalized.rate),
                    "system.skada.infektionsvarighet": Math.max(
                        Number(actor.system.skada?.infektionsvarighet ?? 0),
                        normalized.difficulty
                    )
                });
                applied.push(raw);
                continue;
            }

            if (normalized.kind === "inreskada") {
                const current = Number(actor.system.skada?.inreskada ?? 0);
                await actor.update({ "system.skada.inreskada": Math.min(3, current + 1) });
                applied.push(raw);
                continue;
            }

            skipped.push(raw);
        }

        return { applied, skipped };
    }

    static #isZeroPoolEffect(effect) {
        if (!POOL_APPLY_TYPES.has(effect?.typ)) return false;
        const tvarde = Number(effect?.tvarde ?? 0);
        const bonus = Number(effect?.bonus ?? 0);
        return tvarde === 0 && bonus === 0;
    }

    /**
     * Effekt som inte gör något och därför inte ska beskrivas i dialog eller chatt.
     * @param {object} effect
     * @returns {boolean}
     */
    static #isNoopEffect(effect) {
        if (this.#isZeroPoolEffect(effect)) return true;

        if (effect?.typ === "skadetabell") {
            const key = String(effect.skadetyp || "").trim().toLowerCase();
            return !ALLVARLIG_TABLE_TYPES.has(key);
        }
        if (effect?.typ === "tabellbonus") {
            return this.#resolveNumericEffectValue(effect) === 0;
        }
        if (effect?.typ === "allvarlig") {
            return effect.mode !== MODE_BLOCK;
        }
        return false;
    }

    static #resolveNumericEffectValue(effect) {
        const fixedBonus = Number(effect?.bonus ?? 0);
        if (Number.isFinite(fixedBonus) && fixedBonus !== 0) return Math.floor(fixedBonus);

        const sourceLevel = Number(effect?.sourceLevel ?? 0);
        return Number.isFinite(sourceLevel) ? Math.floor(sourceLevel) : 0;
    }

    static #asFiniteNumber(value) {
        const numericValue = Number(value ?? 0);
        return Number.isFinite(numericValue) ? numericValue : 0;
    }

    static #wrapEffect(effect, item, index, metadata = {}) {
        return {
            ...foundry.utils.duplicate(effect),
            sourceLevel: this.#asFiniteNumber(metadata.sourceLevel ?? item.system?.niva),
            effectId: `${item._id || item.id || "src"}:${index}`,
            sourceId: item._id || item.id || "",
            sourceName: item.name || "",
            sourceType: item.type || "",
            sourceKind: "actor"
        };
    }

    static #asStringArray(value) {
        if (Array.isArray(value)) return value.map(String).filter(Boolean);
        if (value instanceof Set) return [...value].map(String).filter(Boolean);
        if (typeof value === "string" && value.trim()) return [value.trim()];
        return [];
    }

    static #targetMatches(target, context) {
        const t = String(target);
        const slag = this.#asStringArray(context.slag);

        if (t === "slag:alla" || t === "alla") return true;
        if (t.startsWith("slag:")) return slag.includes(t.slice(5)) || slag.includes(t);
        if (t.startsWith("attribut:")) {
            return context.attribut === t.slice(9) || slag.includes(t);
        }
        if (t.startsWith("grupp:")) {
            return context.grupp === t.slice(6);
        }
        if (t.startsWith("fardighet:")) {
            const [, skillId, grupp] = t.split(":");
            return context.fardighet === skillId && (!grupp || context.grupp === grupp);
        }
        if (slag.includes(t)) return true;
        if (context.attribut && t === context.attribut) return true;
        if (context.grupp && t === context.grupp) return true;
        return false;
    }

    static #predicateMatches(predicate, context) {
        const p = String(predicate);
        const tags = this.#asStringArray(context.tags);

        if (tags.includes(p)) return true;
        if (p.startsWith("slag:") && this.#asStringArray(context.slag).includes(p.slice(5))) return true;
        if (p.startsWith("taktik:")) return context.taktik === p.slice(7);
        if (p.startsWith("fattning:")) return context.fattning === p.slice(9);
        if (p.startsWith("vapen:")) return context.vapen === p.slice(6) || context.vapenNamn === p.slice(6);
        if (p.startsWith("fardighet:")) {
            const [, skillId, grupp] = p.split(":");
            return context.fardighet === skillId && (!grupp || context.grupp === grupp);
        }
        if (p.startsWith("grupp:")) return context.grupp === p.slice(6);
        if (p === "vapen") return Boolean(context.vapen);
        if (p === "orustad") return context.orustad === true;
        if (p === "rustad") return context.orustad === false;
        if (p === "bevapnad") return context.bevapnad === true;
        if (p === "obevapnad") return context.bevapnad === false;
        if (p.startsWith("vapentyp:")) {
            return this.#normalizeTypeKey(context.vapenTyp) === this.#normalizeTypeKey(p.slice(9));
        }
        if (p.startsWith("mal:")) return context.mal === p.slice(4);
        if (p.includes("|")) {
            return p.split("|").some((part) => this.#predicateMatches(part.trim(), context));
        }
        if (context[p] != null && context[p] !== false && context[p] !== "") return true;
        return this.#asStringArray(context.slag).includes(p);
    }

    static #normalizeTypeKey(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "");
    }

    static #formatEffectValue(effect) {
        const typ = effect.typ || "tvarde";
        if (typ === "tvarde" || typ === "skadebonus") {
            const parts = [];
            const mode = effect.mode || "add";
            const t = Number(effect.tvarde ?? 0);
            const b = Number(effect.bonus ?? 0);
            const signedT = mode === "subtract" ? -t : t;
            const signedB = mode === "subtract" ? -b : b;
            const prefix = mode === "override" ? "=" : "";
            if (signedT !== 0) {
                const signT = prefix || (signedT > 0 ? "+" : "");
                parts.push(`${signT}${signedT}T6`);
            }
            if (signedB !== 0) {
                const signB = prefix || (signedB > 0 ? "+" : "");
                parts.push(`${signB}${signedB}`);
            }
            if (!parts.length) parts.push(prefix ? `${prefix}0` : "0");
            return parts.join(" ");
        }
        if (typ === "utmattning") {
            const amount = this.#resolveNumericEffectValue(effect);
            const effectiveAmount = effect.mode === "subtract" ? -amount : amount;
            const sign = effect.mode === "override" ? "=" : (effectiveAmount >= 0 ? "+" : "");
            return game.i18n.format("eon.effects.utmattningVidSkada", {
                value: `${sign}${Math.abs(effectiveAmount)}`
            });
        }
        if (typ === "rustning") {
            const amount = this.#resolveNumericEffectValue(effect);
            const effectiveAmount = effect.mode === "subtract" ? -amount : amount;
            const sign = effect.mode === "override" ? "=" : (effectiveAmount >= 0 ? "+" : "");
            const value = `${sign}${Math.abs(effectiveAmount)}`;
            const skadetyp = effect.skadetyp
                ? game.i18n.localize(CONFIG?.EON?.vapenskador?.[effect.skadetyp] ?? effect.skadetyp)
                : "";
            return skadetyp
                ? game.i18n.format("eon.effects.rustningSkadetyp", { value, skadetyp })
                : game.i18n.format("eon.effects.rustning", { value });
        }
        if (typ === "tabellbonus") {
            const amount = this.#resolveNumericEffectValue(effect);
            const effectiveAmount = effect.mode === "subtract" ? -amount : amount;
            const sign = effect.mode === "override" ? "=" : (effectiveAmount >= 0 ? "+" : "");
            return game.i18n.format("eon.effects.tabellbonus", {
                value: `${sign}${Math.abs(effectiveAmount)}`
            });
        }
        if (typ === "allvarlig") {
            return game.i18n.localize("eon.effects.allvarligBlockerad");
        }
        if (typ === "skadetabell") {
            const tableKey = String(effect.skadetyp || "").trim().toLowerCase();
            const tableLabel = tableKey
                ? (CONFIG?.EON?.skadetabeller?.[tableKey]
                    ?? CONFIG?.EON?.vapenskador?.[tableKey]
                    ?? tableKey)
                : game.i18n.localize("eon.effects.skadetypAlla");
            const localizedTable = typeof tableLabel === "string" && tableLabel.startsWith("eon.")
                ? game.i18n.localize(tableLabel)
                : tableLabel;
            return game.i18n.format("eon.effects.skadetabell", { table: localizedTable });
        }
        return typ;
    }

    static #mapSarLocation(locationText, bodyPartKey) {
        const loc = String(locationText || "").toLowerCase().replace(/\s+/g, "");
        if (loc.includes("huvud")) return "huvud";
        if (loc.includes("torso")) return "torso";
        if (bodyPartKey && ["huvud", "torso", "vansterarm", "hogerarm", "vansterben", "hogerben"].includes(bodyPartKey)) {
            return bodyPartKey;
        }
        if (loc.includes("arm") || loc.includes("ben")) {
            // Side unknown: prefer hit location if arm/leg family matches
            if (bodyPartKey?.includes("arm") && loc.includes("arm")) return bodyPartKey;
            if (bodyPartKey?.includes("ben") && loc.includes("ben")) return bodyPartKey;
            return null;
        }
        return null;
    }
}
