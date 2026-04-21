/**
 * @typedef {Object} PayoutConfig
 * @property {number} [3] - Payout for 3 matches.
 * @property {number} [4] - Payout for 4 matches.
 * @property {number} [5] - Payout for 5 matches.
 */

/**
 * @typedef {Object.<string, PayoutConfig>} PayoutTable
 */

/**
 * @typedef {Object.<string, number>} SymbolWeightedMap
 */

/**
 * Configuration for the slot machine.
 */
class SlotMachineConfig {
    /**
     * Initializes a new SlotMachineConfig instance.
     * @param {Object} options - Configuration options.
     * @param {number} options.reels - Number of reels (3 or 5).
     * @param {number} options.rows - Number of rows.
     * @param {string} options.paylineStructure - Payline structure ('fixed' or 'cluster').
     * @param {SymbolWeightedMap} options.symbolWeightedMap - Symbol weights.
     * @param {PayoutTable} options.payoutTable - Payout table.
     */
    constructor(options) {
        /**
         * Number of reels in the slot machine.
         * @type {number}
         */
        this.reels = options.reels;
        
        /**
         * Number of rows in the slot machine.
         * @type {number}
         */
        this.rows = options.rows;
        
        /**
         * The structure of the paylines.
         * @type {string}
         */
        this.paylineStructure = options.paylineStructure;
        
        /**
         * Map of symbols to their weighted probabilities.
         * @type {SymbolWeightedMap}
         */
        this.symbolWeightedMap = options.symbolWeightedMap;
        
        /**
         * Table defining win payouts.
         * @type {PayoutTable}
         */
        this.payoutTable = options.payoutTable;
    }
}

/**
 * State management for the slot machine.
 */
class SlotMachineState {
    /**
     * Initializes a new SlotMachineState instance.
     */
    constructor() {
        /**
         * The player's current credit balance.
         * @type {number}
         */
        this.creditBalance = 0;
        
        /**
         * The player's current bet amount.
         * @type {number}
         */
        this.currentBet = 0;
        
        /**
         * The result grid from the most recent spin.
         * @type {Array<Array<string>>}
         */
        this.currentSpinResultGrid = [];
        
        /**
         * The current win multiplier.
         * @type {number}
         */
        this.multiplierStatus = 1;
        
        /**
         * Whether the bonus mode is currently active.
         * @type {boolean}
         */
        this.bonusStatus = false;
    }

    /**
     * Updates the credit balance.
     * @param {number} newBalance - The new balance amount.
     * @returns {void}
     */
    setCreditBalance(newBalance) {
        this.creditBalance = newBalance;
    }

    /**
     * Updates the current bet amount.
     * @param {number} newBet - The new bet amount.
     * @returns {void}
     */
    setCurrentBet(newBet) {
        this.currentBet = newBet;
    }

    /**
     * Updates the current spin result grid.
     * @param {Array<Array<string>>} grid - The new spin result grid.
     * @returns {void}
     */
    setSpinResult(grid) {
        this.currentSpinResultGrid = grid;
    }

    /**
     * Updates the multiplier status.
     * @param {number} multiplier - The new multiplier.
     * @returns {void}
     */
    setMultiplierStatus(multiplier) {
        this.multiplierStatus = multiplier;
    }

    /**
     * Updates the bonus status.
     * @param {boolean} status - The new bonus status.
     * @returns {void}
     */
    setBonusStatus(status) {
        this.bonusStatus = status;
    }
}

module.exports = {
    SlotMachineConfig,
    SlotMachineState
};
