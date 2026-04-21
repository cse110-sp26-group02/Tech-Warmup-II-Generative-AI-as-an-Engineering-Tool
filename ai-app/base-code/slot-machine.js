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

const UINT32_MAX_PLUS_ONE = 4294967296;

/**
 * Random Number Generator Service using CSPRNG.
 */
class RngService {
    /**
     * Gets a cryptographically secure random 32-bit unsigned integer.
     * @returns {number} Random 32-bit unsigned integer.
     */
    static getUint32() {
        const randomBuffer = new Uint32Array(1);
        globalThis.crypto.getRandomValues(randomBuffer);
        return randomBuffer[0];
    }

    /**
     * Generates a random integer between 0 (inclusive) and max (exclusive) with uniform distribution.
     * @param {number} max - The upper bound (exclusive).
     * @returns {number} The random number.
     */
    static getRandomInteger(max) {
        if (max <= 0) {
            return 0;
        }
        
        const limit = UINT32_MAX_PLUS_ONE - (UINT32_MAX_PLUS_ONE % max);
        let randomValue = RngService.getUint32();
        
        while (randomValue >= limit) {
            randomValue = RngService.getUint32();
        }
        
        return randomValue % max;
    }

    /**
     * Selects a random symbol based on weighted probabilities.
     * @param {SymbolWeightedMap} symbolWeightedMap - Map of symbols to weights.
     * @returns {string} The selected symbol.
     */
    static getRandomSymbol(symbolWeightedMap) {
        const entries = Object.entries(symbolWeightedMap);
        let totalWeight = 0;
        
        for (let index = 0; index < entries.length; index++) {
            totalWeight += entries[index][1];
        }
        
        const randomValue = RngService.getRandomInteger(totalWeight);
        let currentWeight = 0;
        
        for (let index = 0; index < entries.length; index++) {
            currentWeight += entries[index][1];
            if (randomValue < currentWeight) {
                return entries[index][0];
            }
        }
        
        return entries[0][0];
    }

    /**
     * Generates a 2D result grid based on configuration.
     * @param {SlotMachineConfig} config - The slot machine configuration.
     * @returns {Array<Array<string>>} The generated grid.
     */
    static generateGrid(config) {
        const grid = [];
        for (let rowIdx = 0; rowIdx < config.rows; rowIdx++) {
            const row = [];
            for (let reelIdx = 0; reelIdx < config.reels; reelIdx++) {
                const symbol = RngService.getRandomSymbol(config.symbolWeightedMap);
                row.push(symbol);
            }
            grid.push(row);
        }
        return grid;
    }
}

/**
 * Engine to handle slot machine execution.
 */
class SlotMachineEngine {
    /**
     * Initializes the engine with config and state.
     * @param {SlotMachineConfig} config - The slot machine configuration.
     * @param {SlotMachineState} state - The game state.
     */
    constructor(config, state) {
        /**
         * @type {SlotMachineConfig}
         */
        this.config = config;
        
        /**
         * @type {SlotMachineState}
         */
        this.state = state;
    }

    /**
     * Executes a single spin.
     * @returns {Array<Array<string>>} The spin result grid.
     * @throws {Error} If balance is insufficient.
     */
    spin() {
        if (this.state.creditBalance < this.state.currentBet) {
            throw new Error('Insufficient balance');
        }
        
        const newBalance = this.state.creditBalance - this.state.currentBet;
        this.state.setCreditBalance(newBalance);
        
        const newGrid = RngService.generateGrid(this.config);
        this.state.setSpinResult(newGrid);
        
        return newGrid;
    }
}

module.exports = {
    SlotMachineConfig,
    SlotMachineState,
    RngService,
    SlotMachineEngine
};
