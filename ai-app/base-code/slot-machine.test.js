

const assert = require('assert');
const { SlotMachineConfig, SlotMachineState } = require('./slot-machine.js');

/**
 * Tests the SlotMachineConfig class initialization.
 * @returns {void}
 */
function testConfiguration() {
    const configData = {
        reels: 5,
        rows: 3,
        paylineStructure: 'fixed',
        symbolWeightedMap: { CHERRY: 100, WILD: 5, SCATTER: 10, HIGH_1: 25 },
        payoutTable: {
            CHERRY: { 3: 10, 4: 20, 5: 50 },
            WILD: { 3: 50, 4: 100, 5: 500 }
        }
    };

    const config = new SlotMachineConfig(configData);

    assert.strictEqual(config.reels, 5, 'Reels should be 5');
    assert.strictEqual(config.rows, 3, 'Rows should be 3');
    assert.strictEqual(config.paylineStructure, 'fixed', 'Payline structure should be fixed');
    assert.strictEqual(config.symbolWeightedMap.CHERRY, 100, 'CHERRY weight should be 100');
    assert.strictEqual(config.payoutTable.WILD[5], 500, 'WILD 5-match payout should be 500');
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
    
    state.setCreditBalance(100);
    assert.strictEqual(state.creditBalance, 100, 'Balance should update to 100');
    
    state.setCurrentBet(10);
    assert.strictEqual(state.currentBet, 10, 'Bet should update to 10');

    const mockGrid = [['CHERRY', 'WILD', 'CHERRY']];
    state.setSpinResult(mockGrid);
    assert.deepStrictEqual(state.currentSpinResultGrid, mockGrid, 'Spin result grid should update');

    state.setMultiplierStatus(2);
    assert.strictEqual(state.multiplierStatus, 2, 'Multiplier should update to 2');

    state.setBonusStatus(true);
    assert.strictEqual(state.bonusStatus, true, 'Bonus status should update to true');
}

/**
 * Runs all unit tests.
 * @returns {void}
 */
function runAllTests() {
    testConfiguration();
    testState();
    console.log('All Architecture & State Management tests passed!');
}

runAllTests();
