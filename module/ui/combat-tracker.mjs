/**
 * @property {FUCombat} viewed
 */
export class FUCombatTracker extends CombatTracker {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/projectfu/templates/ui/combat-tracker.hbs'
        });
    }

    async getData(options = {}) {
        const data = await super.getData(options);
        if (data.combat) {
            data.factions = await this.getFactions(data)
            data.currentTurn = data.combat.getCurrentTurn()
            data.turnsTaken = data.combat.currentRoundTurnsTaken.reduce((agg, id) => ((agg[id] = true) && agg), {})
            data.turns = data.turns?.map(turn => {
                turn.statusEffects = data.combat.combatants.get(turn.id)?.actor.temporaryEffects.map(effect => ({
                    name: effect.name,
                    img: effect.img
                }))
                return turn
            })
        }
        return data;
    }


    /**
     * @param {jQuery} html
     */
    activateListeners(html) {
        super.activateListeners(html);
        html.find("a[data-action=take-turn]").click(event => this.handleTakeTurn(event))
    }

    /**
     * @return {Object.<"friendly"|"neutral"|"hostile", {}[]>}
     */
    async getFactions(data) {
        return data.turns.reduce((agg, combatantData) => {
            const combatant = data.combat.combatants.get(combatantData.id);
            if (combatant.token.disposition === foundry.CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                agg.friendly.push(combatantData)
            } else {
                agg.hostile.push(combatantData)
            }
            return agg;
        }, {friendly: [], hostile: []})
    }


    async handleTakeTurn(event) {
        const combatantId = $(event.currentTarget).parents("[data-combatant-id]").data("combatantId");
        const combatant = this.viewed.combatants.get(combatantId);
        if (combatant) {
            if (combatant.isDefeated) {
                const takeTurn = await Dialog.confirm({
                    title: game.i18n.localize("FU.DialogDefeatedTurnTitle"),
                    content: game.i18n.localize("FU.DialogDefeatedTurnContent"),
                });

                if (!takeTurn) {
                    return
                }
            }
            await this.viewed.markTurnTaken(combatant);

        }
    }
}