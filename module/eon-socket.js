/**
 * Enkel socket-relay för privilegierade dokumentuppdateringar (spelare → GM).
 * @module eon-socket
 */

export const EON_SOCKET_EVENT = "system.eon-rpg";

export class EonSocket {
    static #registered = false;

    static register() {
        if (this.#registered) return;
        this.#registered = true;

        game.socket.on(EON_SOCKET_EVENT, async (payload) => {
            if (!payload || typeof payload !== "object") return;

            if (payload.action === "updateChatMessage" && game.user.isGM) {
                await this.#handleUpdateChatMessage(payload);
                return;
            }

            if (payload.action === "updateChatMessageResult") {
                this.#resolvePending(payload);
            }
        });
    }

    /** @type {Map<string, { resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout> }>} */
    static #pending = new Map();

    /**
     * @param {object} payload
     */
    static async #handleUpdateChatMessage(payload) {
        const { requestId, messageId, update } = payload;
        try {
            const message = game.messages.get(messageId);
            if (!message) throw new Error(`ChatMessage ${messageId} not found`);
            await message.update(update);
            game.socket.emit(EON_SOCKET_EVENT, {
                action: "updateChatMessageResult",
                requestId,
                ok: true
            });
        } catch (error) {
            console.error("eon-rpg | GM kunde inte uppdatera ChatMessage", error);
            game.socket.emit(EON_SOCKET_EVENT, {
                action: "updateChatMessageResult",
                requestId,
                ok: false,
                error: error?.message ?? String(error)
            });
        }
    }

    /**
     * @param {object} payload
     */
    static #resolvePending(payload) {
        const pending = this.#pending.get(payload.requestId);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.#pending.delete(payload.requestId);
        if (payload.ok) pending.resolve(true);
        else pending.reject(new Error(payload.error || "ChatMessage update failed"));
    }

    /**
     * Uppdatera ChatMessage; om användaren saknar behörighet skickas begäran till aktiv GM.
     * @param {ChatMessage} message
     * @param {object} updateData
     * @returns {Promise<void>}
     */
    static async updateChatMessage(message, updateData) {
        const msg = game.messages.get(message?.id) ?? message;
        if (!msg) throw new Error("ChatMessage missing");

        const canUpdateLocally = game.user.isGM
            || msg.isAuthor
            || msg.author?.id === game.user.id
            || msg.user?.id === game.user.id
            || (typeof msg.testUserPermission === "function" && msg.testUserPermission(game.user, "OWNER"));

        if (canUpdateLocally) {
            try {
                await msg.update(updateData);
                return;
            } catch (error) {
                if (game.user.isGM) throw error;
                console.warn("eon-rpg | Lokal ChatMessage-uppdatering misslyckades, försöker via GM", error);
            }
        }

        const activeGm = game.users.find((user) => user.isGM && user.active);
        if (!activeGm) {
            ui.notifications.error(game.i18n.localize("eon.combatAttack.permissionNoGm"));
            throw new Error("No active GM for ChatMessage update");
        }

        const requestId = foundry.utils.randomID();
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.#pending.delete(requestId);
                ui.notifications.error(game.i18n.localize("eon.combatAttack.permissionUpdateTimeout"));
                reject(new Error("ChatMessage update timed out"));
            }, 15000);

            this.#pending.set(requestId, { resolve, reject, timer });
            game.socket.emit(EON_SOCKET_EVENT, {
                action: "updateChatMessage",
                requestId,
                messageId: msg.id,
                update: updateData,
                requesterId: game.user.id
            });
        });
    }
}
