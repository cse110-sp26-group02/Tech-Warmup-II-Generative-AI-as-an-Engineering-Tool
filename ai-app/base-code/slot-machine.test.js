const assert = require('assert');
const { SlotMachineConfig, SlotMachineState, RngService, SlotMachineEngine } = require('./slot-machine.js');

const REELS_COUNT = 5;
const ROWS_COUNT = 3;

const CHERRY_WEIGHT = 100;
const WILD_WEIGHT = 5;
const SCATTER_WEIGHT = 10;
const HIGH_1_WEIGHT = 25;

const MATCH_3 = 3;
const MATCH_4 = 4;
const MATCH_5 = 5;

const CHERRY_PAYOUT_3 = 10;
const CHERRY_PAYOUT_4 = 20;
const CHERRY_PAYOUT_5 = 50;

const WILD_PAYOUT_3 = 50;
const WILD_PAYOUT_4 = 100;
const WILD_PAYOUT_5 = 500;

const TEST_CREDIT_BALANCE = 100;
const TEST_BET_AMOUNT = 10;

const MAX_RANDOM = 10;
const TEST_SPIN_BALANCE = 50;
const TEST_SPIN_BET = 10;
const EXPECTED_BALANCE_AFTER_SPIN = 40;
const INSUFFICIENT_BALANCE = 5;

/**
 * Tests the SlotMachineConfig class initialization.
 * @returns {void}
 */
function testConfiguration() {
    const configData = {
        reels: REELS_COUNT,
        rows: ROWS_COUNT,
        paylineStructure: 'fixed',
        symbolWeightedMap: { 
            CHERRY: CHERRY_WEIGHT, 
            WILD: WILD_WEIGHT, 
            SCATTER: SCATTER_WEIGHT, 
            HIGH_1: HIGH_1_WEIGHT 
        },
        payoutTable: {
            CHERRY: { 
                [MATCH_3]: CHERRY_PAYOUT_3, 
                [MATCH_4]: CHERRY_PAYOUT_4, 
                [MATCH_5]: CHERRY_PAYOUT_5 
            },
            WILD: { 
                [MATCH_3]: WILD_PAYOUT_3, 
                [MATCH_4]: WILD_PAYOUT_4, 
                [MATCH_5]: WILD_PAYOUT_5 
            }
        }
    };

    const config = new SlotMachineConfig(configData);

    assert.strictEqual(config.reels, REELS_COUNT, 'Reels should be REELS_COUNT');
    assert.strictEqual(config.rows, ROWS_COUNT, 'Rows should be ROWS_COUNT');
    assert.strictEqual(config.paylineStructure, 'fixed', 'Payline structure should be fixed');
    assert.strictEqual(config.symbolWeightedMap.CHERRY, CHERRY_WEIGHT, 'CHERRY weight should be CHERRY_WEIGHT');
    assert.strictEqual(config.payoutTable.WILD[MATCH_5], WILD_PAYOUT_5, 'WILD 5-match payout should be WILD_PAYOUT_5');
}

/**
 * Tests the SlotMachineState class and its update methods.
 * @returns {void}
 */
function testState() {
    const state = new SlotMachineState();
    
    assert.strictEqual(state.creditBalance, 0, 'Initial balance should be 0');
    assert.strictEqual(state.currentBet, 0, 'Initial bet should be 0');
    assert.strictEqual(state.multiplierStatus, 1, 'Initial multiplier should be 1');
    assert.strictEqual(state.bonusStatus, false, 'Initial bonus status should be false');
    assert.strictEqual(state.currentSpinResultGrid.length, 0, 'Initial grid should be empty');
    
    state.setCreditBalance(TEST_CREDIT_BALANCE);
    assert.strictEqual(state.creditBalance, TEST_CREDIT_BALANCE, 'Balance should update to TEST_CREDIT_BALANCE');
    
    state.setCurrentBet(TEST_BET_AMOUNT);
    assert.strictEqual(state.currentBet, TEST_BET_AMOUNT, 'Bet should update to TEST_BET_AMOUNT');

    const mockGrid = [['CHERRY', 'WILD', 'CHERRY']];
    state.setSpinResult(mockGrid);
    assert.deepStrictEqual(state.currentSpinResultGrid, mockGrid, 'Spin result grid should update');

    state.setMultiplierStatus(2);
    assert.strictEqual(state.multiplierStatus, 2, 'Multiplier should update to 2');

    state.setBonusStatus(true);
    assert.strictEqual(state.bonusStatus, true, 'Bonus status should update to true');
}

/**
 * Tests the RngService uniform distribution and symbol generation.
 * @returns {void}
 */
function testRngService() {
    const randomInt = RngService.getRandomInteger(MAX_RANDOM);
    assert.ok(randomInt >= 0 && randomInt < MAX_RANDOM, 'Random integer should be within bounds');

    const weights = { CHERRY: CHERRY_WEIGHT, WILD: 0 };
    const symbol = RngService.getRandomSymbol(weights);
    assert.strictEqual(symbol, 'CHERRY', 'Should always pick CHERRY given weights');

    const configData = {
        reels: REELS_COUNT,
        rows: ROWS_COUNT,
        paylineStructure: 'fixed',
        symbolWeightedMap: weights,
        payoutTable: {}
    };
    const config = new SlotMachineConfig(configData);
    const grid = RngService.generateGrid(config);

    assert.strictEqual(grid.length, ROWS_COUNT, 'Grid should have ROWS_COUNT rows');
    assert.strictEqual(grid[0].length, REELS_COUNT, 'Row should have REELS_COUNT reels');
    assert.strictEqual(grid[0][0], 'CHERRY', 'Grid symbols should be CHERRY');
}

/**
 * Tests the spin execution logic.
 * @returns {void}
 */
function testSpinExecution() {
    const configData = {
        reels: REELS_COUNT,
        rows: ROWS_COUNT,
        paylineStructure: 'fixed',
        symbolWeightedMap: { CHERRY: CHERRY_WEIGHT, WILD: WILD_WEIGHT },
        payoutTable: {}
    };
    const config = new SlotMachineConfig(configData);
    const state = new SlotMachineState();
    
    const engine = new SlotMachineEngine(config, state);
    
    state.setCreditBalance(TEST_SPIN_BALANCE);
    state.setCurrentBet(TEST_SPIN_BET);
    
    const grid = engine.spin();
    
    assert.strictEqual(state.creditBalance, EXPECTED_BALANCE_AFTER_SPIN, 'Balance should decrease by bet amount');
    assert.strictEqual(grid.length, ROWS_COUNT, 'Spin should return a grid with ROWS_COUNT rows');
    assert.deepStrictEqual(state.currentSpinResultGrid, grid, 'State grid should match returned grid');
    
    state.setCreditBalance(INSUFFICIENT_BALANCE);
    assert.throws(
        () => engine.spin(),
        /Insufficient balance/,
        'Should throw error when balance is less than bet'
    );
}

/**
 * Runs all unit tests.
 * @returns {void}
 */
function runAllTests() {
    testConfiguration();
    testState();
    testRngService();
    testSpinExecution();
    console.log('All Architecture & State Management tests passed!');
}

runAllTests();
