const assert = require('assert');
const { SlotMachineConfig, SlotMachineState, RngService, PaylineEvaluator, SlotMachineEngine, LeverPhysicsEngine } = require('./slot-machine.js');

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

const VAL_0 = 0;
const VAL_1 = 1;
const VAL_2 = 2;

const PAYOUT_TABLE = {
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
};

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
        payoutTable: PAYOUT_TABLE
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
    
    assert.strictEqual(state.creditBalance, VAL_0, 'Initial balance should be 0');
    assert.strictEqual(state.currentBet, VAL_0, 'Initial bet should be 0');
    assert.strictEqual(state.multiplierStatus, VAL_1, 'Initial multiplier should be 1');
    assert.strictEqual(state.bonusStatus, false, 'Initial bonus status should be false');
    assert.strictEqual(state.currentSpinResultGrid.length, VAL_0, 'Initial grid should be empty');
    
    state.setCreditBalance(TEST_CREDIT_BALANCE);
    assert.strictEqual(state.creditBalance, TEST_CREDIT_BALANCE, 'Balance should update to TEST_CREDIT_BALANCE');
    
    state.setCurrentBet(TEST_BET_AMOUNT);
    assert.strictEqual(state.currentBet, TEST_BET_AMOUNT, 'Bet should update to TEST_BET_AMOUNT');

    const mockGrid = [['CHERRY', 'WILD', 'CHERRY']];
    state.setSpinResult(mockGrid);
    assert.deepStrictEqual(state.currentSpinResultGrid, mockGrid, 'Spin result grid should update');

    state.setMultiplierStatus(VAL_2);
    assert.strictEqual(state.multiplierStatus, VAL_2, 'Multiplier should update to 2');

    state.setBonusStatus(true);
    assert.strictEqual(state.bonusStatus, true, 'Bonus status should update to true');
}

/**
 * Tests the RngService uniform distribution and symbol generation.
 * @returns {void}
 */
function testRngService() {
    const randomInt = RngService.getRandomInteger(MAX_RANDOM);
    assert.ok(randomInt >= VAL_0 && randomInt < MAX_RANDOM, 'Random integer should be within bounds');

    const weights = { CHERRY: CHERRY_WEIGHT, WILD: VAL_0 };
    const symbol = RngService.getRandomSymbol(weights);
    assert.strictEqual(symbol, 'CHERRY', 'Should always pick CHERRY given weights');

    const configData = {
        reels: REELS_COUNT,
        rows: ROWS_COUNT,
        paylineStructure: 'fixed',
        symbolWeightedMap: weights,
        payoutTable: PAYOUT_TABLE
    };
    const config = new SlotMachineConfig(configData);
    const grid = RngService.generateGrid(config);

    assert.strictEqual(grid.length, ROWS_COUNT, 'Grid should have ROWS_COUNT rows');
    assert.strictEqual(grid[VAL_0].length, REELS_COUNT, 'Row should have REELS_COUNT reels');
    assert.strictEqual(grid[VAL_0][VAL_0], 'CHERRY', 'Grid symbols should be CHERRY');
}

/**
 * Tests the PaylineEvaluator for payout rules, wilds, and scatters.
 * @returns {void}
 */
function testEvaluator() {
    // Basic match
    const line1 = ['CHERRY', 'CHERRY', 'CHERRY', 'BLANK', 'BLANK'];
    assert.strictEqual(PaylineEvaluator.evaluateLine(line1, PAYOUT_TABLE), CHERRY_PAYOUT_3, '3 Cherries should payout CHERRY_PAYOUT_3');

    // Wild substitution
    const line2 = ['CHERRY', 'WILD', 'CHERRY', 'BLANK', 'BLANK'];
    assert.strictEqual(PaylineEvaluator.evaluateLine(line2, PAYOUT_TABLE), CHERRY_PAYOUT_3, 'Wild should substitute for Cherry');

    // Wild starting
    const line3 = ['WILD', 'WILD', 'CHERRY', 'CHERRY', 'BLANK'];
    assert.strictEqual(PaylineEvaluator.evaluateLine(line3, PAYOUT_TABLE), CHERRY_PAYOUT_4, 'Wilds at start should count towards next symbol');

    // Pure wild line (higher payout)
    const line4 = ['WILD', 'WILD', 'WILD', 'BLANK', 'BLANK'];
    assert.strictEqual(PaylineEvaluator.evaluateLine(line4, PAYOUT_TABLE), WILD_PAYOUT_3, '3 Wilds should use Wild payout');

    // Grid Evaluation
    const configData = {
        reels: REELS_COUNT,
        rows: ROWS_COUNT,
        paylineStructure: 'fixed',
        symbolWeightedMap: { CHERRY: CHERRY_WEIGHT },
        payoutTable: PAYOUT_TABLE
    };
    const config = new SlotMachineConfig(configData);
    const grid = [
        ['CHERRY', 'CHERRY', 'CHERRY', 'BLANK', 'BLANK'],
        ['SCATTER', 'SCATTER', 'SCATTER', 'BLANK', 'BLANK'],
        ['BONUS', 'BONUS', 'BONUS', 'BLANK', 'BLANK']
    ];

    const result = PaylineEvaluator.evaluateGrid(grid, config);
    assert.strictEqual(result.payout, CHERRY_PAYOUT_3, 'Grid payout should equal line 1 payout');
    assert.strictEqual(result.scatterCount, MATCH_3, 'Should find 3 Scatters');
    assert.strictEqual(result.bonusCount, MATCH_3, 'Should find 3 Bonuses');
}

/**
 * Sets up a test engine.
 * @returns {SlotMachineEngine} The test engine.
 */
function createTestEngine() {
    const configData = {
        reels: REELS_COUNT,
        rows: ROWS_COUNT,
        paylineStructure: 'fixed',
        symbolWeightedMap: { CHERRY: CHERRY_WEIGHT, WILD: WILD_WEIGHT },
        payoutTable: PAYOUT_TABLE
    };
    const config = new SlotMachineConfig(configData);
    const state = new SlotMachineState();
    return new SlotMachineEngine(config, state);
}

/**
 * Tests base spin logic.
 * @returns {void}
 */
function testBaseSpin() {
    const engine = createTestEngine();
    const state = engine.state;
    
    state.setCreditBalance(TEST_SPIN_BALANCE);
    state.setCurrentBet(TEST_SPIN_BET);
    
    const result = engine.spin();
    
    assert.ok(state.creditBalance >= EXPECTED_BALANCE_AFTER_SPIN, 'Balance should be updated');
    assert.strictEqual(result.grid.length, ROWS_COUNT, 'Spin should return a grid with ROWS_COUNT rows');
    assert.deepStrictEqual(state.currentSpinResultGrid, result.grid, 'State grid should match returned grid');
    
    state.setCreditBalance(INSUFFICIENT_BALANCE);
    assert.throws(
        () => engine.spin(),
        /Insufficient balance/,
        'Should throw error when balance is less than bet'
    );
}

/**
 * Tests multiplier logic during spin.
 * @returns {void}
 */
function testSpinMultiplier() {
    const engine = createTestEngine();
    const state = engine.state;
    
    state.setCreditBalance(TEST_SPIN_BALANCE);
    state.setCurrentBet(VAL_0); 
    state.setMultiplierStatus(VAL_2); 
    
    const mockGrid = [
        ['CHERRY', 'CHERRY', 'CHERRY', 'BLANK', 'BLANK'],
        ['BLANK', 'BLANK', 'BLANK', 'BLANK', 'BLANK'],
        ['BLANK', 'BLANK', 'BLANK', 'BLANK', 'BLANK']
    ];
    
    const originalGenerateGrid = RngService.generateGrid;
    
    /**
     * Mock generator.
     * @returns {Array<Array<string>>} The mock grid.
     */
    RngService.generateGrid = () => mockGrid;

    const originalRandom = Math.random;
    // Mock Math.random to always return a value that triggers a multiplier and picks the first one (2x)
    Math.random = () => VAL_0;
    
    const winResult = engine.spin();
    assert.strictEqual(winResult.payout, CHERRY_PAYOUT_3 * VAL_2, 'Payout should be multiplied by 2');
    
    RngService.generateGrid = originalGenerateGrid;
    Math.random = originalRandom;
}

/**
 * Runs all spin execution tests.
 * @returns {void}
 */
function testSpinExecution() {
    testBaseSpin();
    testSpinMultiplier();
}

const TEST_PULL_THRESHOLD = 100;
const TEST_START_Y = 10;
const TEST_PULL_Y = 150;
const TEST_SHORT_PULL_Y = 50;
const TEST_TIME_START = 1000;
const TEST_TIME_END = 1100;
const POWER_MULTIPLIER_TEST = 5;
const EXPECTED_POWER = ((TEST_PULL_Y - TEST_START_Y) / (TEST_TIME_END - TEST_TIME_START)) * POWER_MULTIPLIER_TEST;
const MAX_POWER = 10;

/**
 * Tests the LeverPhysicsEngine.
 * @returns {void}
 */
function testLeverPhysics() {
    const physics = new LeverPhysicsEngine(TEST_PULL_THRESHOLD);
    
    // Test short pull (not triggered)
    physics.startPull(TEST_START_Y, TEST_TIME_START);
    physics.updatePull(TEST_SHORT_PULL_Y);
    const shortResult = physics.endPull(TEST_TIME_END);
    
    assert.strictEqual(shortResult.triggered, false, 'Short pull should not trigger');
    assert.strictEqual(shortResult.spinPower, VAL_0, 'Short pull power should be 0');

    // Test full pull (triggered)
    physics.startPull(TEST_START_Y, TEST_TIME_START);
    physics.updatePull(TEST_PULL_Y);
    const fullResult = physics.endPull(TEST_TIME_END);
    
    let expectedPower = EXPECTED_POWER;
    if (expectedPower > MAX_POWER) {
        expectedPower = MAX_POWER;
    }
    
    assert.strictEqual(fullResult.triggered, true, 'Full pull should trigger');
    assert.strictEqual(fullResult.spinPower, expectedPower, 'Power should match expected calculation');
}

/**
 * Runs all unit tests.
 * @returns {void}
 */
function runAllTests() {
    testConfiguration();
    testState();
    testRngService();
    testEvaluator();
    testSpinExecution();
    testLeverPhysics();
    console.log('All Architecture & State Management tests passed!');
}

runAllTests();
