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
 * @typedef {Object} EvaluationResult
 * @property {number} payout - The total payout calculated.
 * @property {number} scatterCount - Number of SCATTER symbols found.
 * @property {number} bonusCount - Number of BONUS symbols found.
 */

/**
 * @typedef {Object} TargetSymbolInfo
 * @property {string} targetSymbol - The target symbol.
 * @property {number} wildCount - The number of wild symbols found.
 */

/**
 * @typedef {Object} SymbolCounts
 * @property {number} scatterCount - Number of SCATTER symbols found.
 * @property {number} bonusCount - Number of BONUS symbols found.
 */

/**
 * Evaluates the result grid for payouts, scatters, and bonuses.
 */
class PaylineEvaluator {
    /**
     * Extracts the target symbol and wild count from a line.
     * @param {Array<string>} line - The line array.
     * @returns {TargetSymbolInfo} An object containing targetSymbol and wildCount.
     */
    static getTargetSymbol(line) {
        let targetSymbol = 'WILD';
        let wildCount = 0;

        for (let index = 0; index < line.length; index++) {
            if (line[index] === 'WILD') {
                wildCount++;
            } else if (line[index] !== 'SCATTER' && line[index] !== 'BONUS') {
                targetSymbol = line[index];
                break;
            } else {
                break;
            }
        }
        return { targetSymbol, wildCount };
    }

    /**
     * Counts the number of consecutive matches for a symbol.
     * @param {Array<string>} line - The line array.
     * @param {string} targetSymbol - The symbol to match.
     * @returns {number} The count of matches.
     */
    static countMatches(line, targetSymbol) {
        let matchCount = 0;
        for (let index = 0; index < line.length; index++) {
            if (line[index] === targetSymbol || line[index] === 'WILD') {
                matchCount++;
            } else {
                break;
            }
        }
        return matchCount;
    }

    /**
     * Calculates the payout for a specific symbol and count.
     * @param {string} symbol - The symbol.
     * @param {number} count - The match count.
     * @param {PayoutTable} payoutTable - The payout table.
     * @returns {number} The calculated payout.
     */
    static getPayout(symbol, count, payoutTable) {
        if (count > 0 && payoutTable[symbol] && payoutTable[symbol][count]) {
            return payoutTable[symbol][count];
        }
        return 0;
    }

    /**
     * Evaluates a single payline to calculate payout.
     * @param {Array<string>} line - The line of symbols to evaluate.
     * @param {PayoutTable} payoutTable - The win payout table.
     * @returns {number} The calculated payout for the line.
     */
    static evaluateLine(line, payoutTable) {
        if (line.length === 0) {
            return 0;
        }

        const info = PaylineEvaluator.getTargetSymbol(line);
        const matchCount = PaylineEvaluator.countMatches(line, info.targetSymbol);

        const targetPayout = PaylineEvaluator.getPayout(info.targetSymbol, matchCount, payoutTable);
        const wildPayout = PaylineEvaluator.getPayout('WILD', info.wildCount, payoutTable);

        if (wildPayout > targetPayout) {
            return wildPayout;
        }
        
        return targetPayout;
    }

    /**
     * Calculates the total payout across all fixed paylines.
     * @param {Array<Array<string>>} grid - The symbol grid.
     * @param {SlotMachineConfig} config - The slot machine configuration.
     * @returns {number} The total payout.
     */
    static calculateGridPayout(grid, config) {
        if (config.paylineStructure !== 'fixed') {
            return 0;
        }

        let totalPayout = 0;
        for (let rowIdx = 0; rowIdx < config.rows; rowIdx++) {
            const payline = [];
            for (let reelIdx = 0; reelIdx < config.reels; reelIdx++) {
                payline.push(grid[rowIdx][reelIdx]);
            }
            totalPayout += PaylineEvaluator.evaluateLine(payline, config.payoutTable);
        }
        return totalPayout;
    }

    /**
     * Counts the number of special symbols on the grid.
     * @param {Array<Array<string>>} grid - The symbol grid.
     * @param {SlotMachineConfig} config - The slot machine configuration.
     * @returns {SymbolCounts} The counts of scatters and bonuses.
     */
    static countSpecialSymbols(grid, config) {
        let scatterCount = 0;
        let bonusCount = 0;

        for (let rowIdx = 0; rowIdx < config.rows; rowIdx++) {
            for (let reelIdx = 0; reelIdx < config.reels; reelIdx++) {
                if (grid[rowIdx][reelIdx] === 'SCATTER') {
                    scatterCount++;
                } else if (grid[rowIdx][reelIdx] === 'BONUS') {
                    bonusCount++;
                }
            }
        }

        return { scatterCount, bonusCount };
    }

    /**
     * Evaluates the entire grid based on config structure.
     * @param {Array<Array<string>>} grid - The symbol grid.
     * @param {SlotMachineConfig} config - The slot machine configuration.
     * @returns {EvaluationResult} Evaluation results including payout, scatter, and bonus counts.
     */
    static evaluateGrid(grid, config) {
        const payout = PaylineEvaluator.calculateGridPayout(grid, config);
        const counts = PaylineEvaluator.countSpecialSymbols(grid, config);

        return { 
            payout, 
            scatterCount: counts.scatterCount, 
            bonusCount: counts.bonusCount 
        };
    }
}

const MIN_SCATTERS_FOR_TRIGGER = 1;
const MIN_BONUS_FOR_TRIGGER = 3;
const MULTIPLIER_CHANCE = 0.15;
const MULT_2X = 2;
const MULT_3X = 3;
const MULT_5X = 5;
const MULT_10X = 10;
const POSSIBLE_MULTIPLIERS = [MULT_2X, MULT_3X, MULT_5X, MULT_10X];

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
     * Triggers the free spins feature.
     * @returns {void}
     */
    triggerFreeSpins() {
        // Stub for free spins logic
        console.log('Free Spins Triggered!');
    }

    /**
     * Triggers the bonus mini-game feature.
     * @returns {void}
     */
    triggerBonusMiniGame() {
        // Stub for bonus mini-game logic
        this.state.setBonusStatus(true);
        console.log('Bonus Mini Game Triggered!');
    }

    /**
     * Calculates the random multiplier.
     * @param {number} scatterCount - Number of scatters.
     * @returns {number} The calculated multiplier.
     */
    calculateRandomMultiplier(scatterCount) {
        if (scatterCount >= 1 || Math.random() < MULTIPLIER_CHANCE) {
            return POSSIBLE_MULTIPLIERS[Math.floor(Math.random() * POSSIBLE_MULTIPLIERS.length)];
        }
        return 1;
    }

    /**
     * Executes a single spin.
     * @returns {Object} The result object containing the grid and payout details.
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
        
        const evaluation = PaylineEvaluator.evaluateGrid(newGrid, this.config);
        
        let currentMultiplier = 1;
        
        if (evaluation.payout > 0) {
            currentMultiplier = this.calculateRandomMultiplier(evaluation.scatterCount);
        }
        
        const multiplierTriggered = currentMultiplier > 1;
        
        this.state.setMultiplierStatus(currentMultiplier);
        
        const finalPayout = evaluation.payout * currentMultiplier;
        
        this.state.setCreditBalance(this.state.creditBalance + finalPayout);
        
        if (evaluation.scatterCount >= MIN_SCATTERS_FOR_TRIGGER) {
            this.triggerFreeSpins();
        }
        
        if (evaluation.bonusCount >= MIN_BONUS_FOR_TRIGGER) {
            this.triggerBonusMiniGame();
        }
        
        return {
            grid: newGrid,
            payout: finalPayout,
            scatters: evaluation.scatterCount,
            bonuses: evaluation.bonusCount,
            multiplier: currentMultiplier,
            multiplierTriggered: multiplierTriggered
        };
    }
}

const DEFAULT_MAX_POWER = 10;
const POWER_MULTIPLIER = 5;

/**
 * @typedef {Object} LeverReleaseResult
 * @property {boolean} triggered - Whether the spin was triggered.
 * @property {number} spinPower - The calculated power of the pull.
 */

/**
 * Handles the physics simulation for the slot machine lever.
 */
class LeverPhysicsEngine {
    /**
     * Initializes the lever physics engine.
     * @param {number} pullThreshold - Distance required to trigger a spin.
     */
    constructor(pullThreshold) {
        /**
         * @type {number}
         */
        this.pullThreshold = pullThreshold;
        
        /**
         * @type {number}
         */
        this.startY = 0;
        
        /**
         * @type {number}
         */
        this.currentY = 0;
        
        /**
         * @type {number}
         */
        this.startTime = 0;
        
        /**
         * @type {boolean}
         */
        this.isPulling = false;
    }

    /**
     * Starts the lever pull interaction.
     * @param {number} startY - The starting Y coordinate.
     * @param {number} startTime - The timestamp of the start.
     * @returns {void}
     */
    startPull(startY, startTime) {
        this.startY = startY;
        this.currentY = startY;
        this.startTime = startTime;
        this.isPulling = true;
    }

    /**
     * Updates the lever pull interaction.
     * @param {number} currentY - The current Y coordinate.
     * @returns {void}
     */
    updatePull(currentY) {
        if (this.isPulling) {
            this.currentY = currentY;
        }
    }

    /**
     * Ends the lever pull and calculates the result.
     * @param {number} endTime - The timestamp of the end.
     * @returns {LeverReleaseResult} The result of the lever release.
     */
    endPull(endTime) {
        if (!this.isPulling) {
            return { triggered: false, spinPower: 0 };
        }

        this.isPulling = false;
        const distance = this.currentY - this.startY;
        const timeElapsed = endTime - this.startTime;

        if (distance >= this.pullThreshold) {
            let velocity = 0;
            if (timeElapsed > 0) {
                velocity = distance / timeElapsed;
            }
            
            let power = velocity * POWER_MULTIPLIER;
            if (power > DEFAULT_MAX_POWER) {
                power = DEFAULT_MAX_POWER;
            }

            return { triggered: true, spinPower: power };
        }

        return { triggered: false, spinPower: 0 };
    }
}

module.exports = {
    SlotMachineConfig,
    SlotMachineState,
    RngService,
    PaylineEvaluator,
    SlotMachineEngine,
    LeverPhysicsEngine
};
