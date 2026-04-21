/**
 * UI Controller for the Slot Machine Game
 * Bridges the DOM with the core SlotMachineEngine and LeverPhysicsEngine.
 */

/* global SlotMachineConfig, SlotMachineState, SlotMachineEngine, LeverPhysicsEngine */

// Wait for DOM to load before initializing
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Game Components
    const configData = {
        reels: 5,
        rows: 3,
        paylineStructure: 'fixed',
        symbolWeightedMap: {
            'CHERRY': 100,
            'WILD': 5,
            'SCATTER': 10,
            'BONUS': 15,
            'HELMET': 25,
            'SWORD': 30,
            'COIN': 50,
            'VASE': 40
        },
        payoutTable: {
            'CHERRY': { 3: 10, 4: 20, 5: 50 },
            'HELMET': { 3: 15, 4: 30, 5: 100 },
            'SWORD': { 3: 20, 4: 40, 5: 150 },
            'COIN': { 3: 5, 4: 10, 5: 25 },
            'VASE': { 3: 8, 4: 15, 5: 35 },
            'WILD': { 3: 50, 4: 100, 5: 500 }
        }
    };

    const config = new SlotMachineConfig(configData);
    const state = new SlotMachineState();
    const engine = new SlotMachineEngine(config, state);
    
    // Physics engine: 100px pull distance required to trigger spin
    const leverPhysics = new LeverPhysicsEngine(100);

    // Initial setup
    state.setCreditBalance(1000); // Start with 1000 credits
    state.setCurrentBet(10);      // Default bet

    // 2. DOM Elements Mapping
    const elements = {
        creditDisplay: document.getElementById('credit-display'),
        betDisplay: document.getElementById('bet-display'),
        multiplierDisplay: document.getElementById('multiplier-display'),
        betValueInfo: document.getElementById('bet-value-info'),
        betAmountInput: document.getElementById('bet-amount'),
        betValueDisplay: document.getElementById('bet-value-display'),
        reelsGrid: document.getElementById('reels-grid'),
        statusMessage: document.getElementById('status-message'),
        btnSpin: document.getElementById('btn-spin'),
        btnLever: document.getElementById('btn-lever'),
        btnAddCredits: document.getElementById('btn-add-credits'),
        btnCashout: document.getElementById('btn-cashout'),
        resultsPanel: document.getElementById('results-panel'),
        payoutDisplay: document.getElementById('payout-display'),
        scatterDisplay: document.getElementById('scatter-display'),
        bonusDisplay: document.getElementById('bonus-display'),
        btnCloseResults: document.getElementById('btn-close-results'),
        spinIndicator: document.getElementById('spin-indicator')
    };

    // State flags for UI interaction
    let isSpinning = false;
    
    // 3. UI Update Functions
    
    /**
     * Updates all informational displays (balance, bet, multiplier).
     */
    function updateDisplays() {
        elements.creditDisplay.textContent = state.creditBalance;
        elements.betDisplay.textContent = state.currentBet;
        elements.betValueInfo.textContent = state.currentBet;
        elements.multiplierDisplay.textContent = state.multiplierStatus + 'x';
        
        // Update slider visually to match state if changed programmatically
        elements.betAmountInput.value = state.currentBet;
        elements.betValueDisplay.textContent = `Current: ${state.currentBet}`;
        
        // Disable spin if not enough credits
        if (state.creditBalance < state.currentBet) {
            elements.btnSpin.disabled = true;
            elements.btnLever.disabled = true;
        } else if (!isSpinning) {
            elements.btnSpin.disabled = false;
            elements.btnLever.disabled = false;
        }
    }

    /**
     * Updates the status message for screen readers and visual display.
     * @param {string} message - The message to display.
     */
    function setStatus(message) {
        elements.statusMessage.textContent = message;
    }

    /**
     * Renders the symbol grid into the DOM.
     * @param {Array<Array<string>>} gridData - The 2D array of symbols.
     * @param {boolean} highlightWin - Whether to apply win animation classes.
     */
    function renderGrid(gridData, highlightWin = false) {
        elements.reelsGrid.innerHTML = ''; // Clear current grid
        
        for (let rowIdx = 0; rowIdx < config.rows; rowIdx++) {
            for (let reelIdx = 0; reelIdx < config.reels; reelIdx++) {
                const cell = document.createElement('div');
                cell.className = 'reel-cell';
                cell.setAttribute('role', 'gridcell');
                
                const symbolStr = gridData[rowIdx][reelIdx];
                const span = document.createElement('span');
                span.className = 'symbol';
                span.textContent = symbolStr;
                
                // Add specific styling class based on symbol type
                if (symbolStr === 'WILD') {
                    span.classList.add('symbol-wild');
                } else if (symbolStr === 'SCATTER') {
                    span.classList.add('symbol-scatter');
                } else if (['HELMET', 'SWORD'].includes(symbolStr)) {
                    span.classList.add('symbol-high');
                } else {
                    span.classList.add('symbol-low');
                }

                // If this is a winning render, we could selectively highlight here.
                // For now, we apply to all if it's a win for the visual effect.
                if (highlightWin && symbolStr !== 'BLANK') {
                    cell.classList.add('win-highlight');
                }

                cell.appendChild(span);
                elements.reelsGrid.appendChild(cell);
            }
        }
    }

    /**
     * Shows the results modal.
     * @param {Object} result - The spin result object.
     */
    function showResults(result) {
        elements.payoutDisplay.textContent = result.payout;
        elements.scatterDisplay.textContent = result.scatters;
        elements.bonusDisplay.textContent = result.bonuses;
        elements.resultsPanel.classList.remove('hidden');
        elements.resultsPanel.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hides the results modal.
     */
    function hideResults() {
        elements.resultsPanel.classList.add('hidden');
        elements.resultsPanel.setAttribute('aria-hidden', 'true');
    }

    // 4. Core Interaction Logic

    /**
     * Handles the visual and logical execution of a spin.
     * @param {number} power - Simulated power of the spin (0-10), affects duration.
     */
    async function executeSpin(power = 5) {
        if (isSpinning || state.creditBalance < state.currentBet) return;
        
        isSpinning = true;
        hideResults();
        elements.btnSpin.disabled = true;
        elements.btnLever.disabled = true;
        elements.spinIndicator.classList.remove('hidden');
        setStatus('Spinning...');

        // Add blur class to all existing symbols to simulate motion
        const cells = elements.reelsGrid.querySelectorAll('.reel-cell');
        cells.forEach(cell => cell.classList.add('spinning'));

        // Calculate spin duration based on power (inverse relation: harder pull = faster/shorter spin)
        // Base time 1.5s, max power reduces it by up to 0.5s
        const durationMs = 1500 - (power * 50);

        try {
            // Perform the logical spin immediately to get results
            const result = engine.spin();
            
            // Update balance display immediately (deducting bet)
            updateDisplays();

            // Wait for visual animation to finish
            await new Promise(resolve => setTimeout(resolve, durationMs));

            // Render final grid
            renderGrid(result.grid, result.payout > 0);
            updateDisplays(); // Update again for potential wins

            if (result.payout > 0) {
                setStatus(`You won ${result.payout} credits!`);
                setTimeout(() => showResults(result), 500); // Show modal shortly after
            } else {
                setStatus('No win this time. Try again!');
            }

        } catch (error) {
            setStatus(error.message);
        } finally {
            isSpinning = false;
            elements.spinIndicator.classList.add('hidden');
            updateDisplays(); // Re-evaluate button states
        }
    }

    // 5. Event Listeners

    // Bet Slider
    elements.betAmountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.setCurrentBet(val);
        elements.betAmountInput.setAttribute('aria-valuenow', val);
        updateDisplays();
    });

    // Spin Button
    elements.btnSpin.addEventListener('click', () => {
        // Standard spin acts like a medium power pull
        executeSpin(5);
    });

    // Management Buttons
    elements.btnAddCredits.addEventListener('click', () => {
        state.setCreditBalance(state.creditBalance + 500);
        setStatus('Added 500 credits.');
        updateDisplays();
    });

    elements.btnCashout.addEventListener('click', () => {
        setStatus(`Cashed out ${state.creditBalance} credits. Game over.`);
        state.setCreditBalance(0);
        updateDisplays();
    });

    // Close Modal
    elements.btnCloseResults.addEventListener('click', hideResults);

    // 6. Lever Physics Integration
    
    // Bind mouse and touch events to the virtual lever
    
    /**
     * Handles the start of a lever pull.
     * @param {Event} e - Mouse or touch event.
     */
    function handleLeverStart(e) {
        if (isSpinning || elements.btnLever.disabled) return;
        e.preventDefault(); // Prevent scrolling on touch
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        leverPhysics.startPull(clientY, performance.now());
        
        // Add pulling class to disable CSS transition while actively dragging
        elements.btnLever.classList.add('pulling');
    }

    /**
     * Handles the movement during a lever pull.
     * @param {Event} e - Mouse or touch event.
     */
    function handleLeverMove(e) {
        if (!leverPhysics.isPulling) return;
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        leverPhysics.updatePull(clientY);
        
        // Visual feedback: rotate lever downwards based on distance
        // Max rotation around 60 degrees. pullThreshold is 100px.
        let distance = leverPhysics.currentY - leverPhysics.startY;
        if (distance < 0) distance = 0; // Don't push up
        
        let rotation = (distance / leverPhysics.pullThreshold) * 60;
        if (rotation > 75) rotation = 75; // Hard physical limit
        
        elements.btnLever.style.transform = `rotateX(${rotation}deg) scaleY(${1 - (rotation/200)})`;
    }

    /**
     * Handles the release of the lever.
     * @param {Event} e - Mouse or touch event.
     */
    function handleLeverEnd(e) {
        if (!leverPhysics.isPulling) return;
        
        const result = leverPhysics.endPull(performance.now());
        
        // Remove pulling class to re-enable CSS transition for snap-back
        elements.btnLever.classList.remove('pulling');
        // Reset transform to original position (CSS transition handles the elastic snap)
        elements.btnLever.style.transform = '';
        
        if (result.triggered) {
            executeSpin(result.spinPower);
        } else {
            setStatus('Pull harder to spin!');
        }
    }

    // Mouse events
    elements.btnLever.addEventListener('mousedown', handleLeverStart);
    document.addEventListener('mousemove', handleLeverMove);
    document.addEventListener('mouseup', handleLeverEnd);

    // Touch events
    elements.btnLever.addEventListener('touchstart', handleLeverStart, { passive: false });
    document.addEventListener('touchmove', handleLeverMove, { passive: false });
    document.addEventListener('touchend', handleLeverEnd);


    // 7. Initial Render
    
    // Generate a visual "starting" grid without doing a logical spin
    const initialGrid = RngService.generateGrid(config);
    renderGrid(initialGrid, false);
    updateDisplays();
});
