import EffectHelper from "../../../effect-helper.js";

/**
 * Extend the base Item entity so bladen och helpers kan fråga itemet direkt om Eon-version.
 * @extends {Item}
 */
export class EonItem extends Item {
    /**
     * Är itemet kopplat till Eon 5? Aktörens version gäller före itemets egen.
     * @returns {boolean}
     */
    get isEon5() {
        return EffectHelper.isEon5Item(this);
    }

    /**
     * Bär itemet effekter (Egenskap eller Skada/tillstånd i Eon 5)?
     * @returns {boolean}
     */
    get hasEffects() {
        return EffectHelper.isEon5EffectItem(this);
    }
}
