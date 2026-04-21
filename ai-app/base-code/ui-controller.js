/**
 * UI Controller for the Slot Machine Game
 * Bridges the DOM with the core SlotMachineEngine and LeverPhysicsEngine.
 */

/* global SlotMachineConfig, SlotMachineState, SlotMachineEngine, LeverPhysicsEngine, RngService */

/**
 * Constants for the Slot Machine UI
 * @type {Object}
 */
const CONSTANTS = {
    PULL_DISTANCE: 100,
    START_CREDITS: 1000,
    DEFAULT_BET: 10,
    DEFAULT_POWER: 5,
    ANIM_DELAY_STEP: 0.15,
    BASE_SPIN_DURATION: 1500,
    POWER_MULTIPLIER: 50,
    RESULTS_DELAY: 500,
    ADD_CREDITS_AMOUNT: 500,
    MAX_ROTATION: 75,
    ROTATION_MULTIPLIER: 60,
    ROTATION_SCALE: 200,
    RADIX: 10,
    POPUP_DURATION: 3000,
    MOBILE_BREAKPOINT: 900,
    LEVER_WIDTH: 60,
    CENTER_OFFSET: -30,
    VERTICAL_OFFSET: -50,
    HEIGHT_PADDING: 120,
    MAX_SCALE: 0.9,
    MAX_HISTORY_ITEMS: 20,
    MIN_SCATTERS: 1,
    MIN_BONUSES: 3,
    BALANCE_POPUP_DURATION: 1200,
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 800,
    CANVAS_BORDER_OUTER: 20,
    CANVAS_BORDER_INNER: 35,
    CANVAS_HEADER_Y: 100,
    CANVAS_SUBHEADER_Y: 140,
    CANVAS_STATS_Y: 250,
    CANVAS_STATS_SPACING: 70,
    CANVAS_LABEL_X: 80,
    CANVAS_VALUE_X: 320,
    CANVAS_FOOTER_Y: 700,
    CANVAS_LINE_THICK_OUTER: 15,
    CANVAS_LINE_THICK_INNER: 5,
    VAL_2: 2
};

/**
 * Main UI Controller Class
 */
class SlotMachineUI {
    /**
     * Initializes the SlotMachineUI
     */
    constructor() {
        this.isSpinning = false;
        this.initConfig();
        this.initElements();
        this.bindEvents();
        this.initialRender();
    }

    /**
     * Initializes the game configuration, state, engine and physics.
     */
    initConfig() {
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

        this.config = new SlotMachineConfig(configData);
        this.state = new SlotMachineState();
        this.engine = new SlotMachineEngine(this.config, this.state);
        this.leverPhysics = new LeverPhysicsEngine(CONSTANTS.PULL_DISTANCE);

        this.state.setCreditBalance(CONSTANTS.START_CREDITS);
        this.state.setCurrentBet(CONSTANTS.DEFAULT_BET);
    }

    /**
     * Maps DOM elements to properties.
     */
    initElements() {
        this.elements = {
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
            btnShareResults: document.getElementById('btn-share-results'),
            btnCloseResults: document.getElementById('btn-close-results'),
            spinIndicator: document.getElementById('spin-indicator'),
            historyList: document.getElementById('history-list'),
            totalWageredDisplay: document.getElementById('total-wagered-display'),
            totalWonDisplay: document.getElementById('total-won-display'),
            netGainDisplay: document.getElementById('net-gain-display'),
            totalBonusesDisplay: document.getElementById('total-bonuses-display')
        };
    }

    /**
     * Updates UI displays based on state.
     */
    updateDisplays() {
        this.elements.creditDisplay.textContent = Math.floor(this.state.creditBalance);
        this.elements.betDisplay.textContent = this.state.currentBet;
        this.elements.betValueInfo.textContent = this.state.currentBet;
        this.elements.multiplierDisplay.textContent = this.state.multiplierStatus + 'x';

        this.elements.betAmountInput.value = this.state.currentBet;
        this.elements.betValueDisplay.textContent = `Current: ${this.state.currentBet}`;

        const canAfford = this.state.creditBalance >= this.state.currentBet;
        if (!canAfford) {
            this.elements.btnSpin.disabled = true;
            this.elements.btnLever.disabled = true;
            // Only show results panel when out of gold
            if (!this.isSpinning) {
                this.setStatus("Thou art out of gold, Traveler! Replenish thy purse.");
                this.elements.resultsPanel.classList.remove('hidden');
                this.elements.resultsPanel.querySelector('h2').textContent = "Empty Purse";
            }
        } else if (!this.isSpinning) {
            this.elements.btnSpin.disabled = false;
            this.elements.btnLever.disabled = false;
        }
    }

    /**
     * Sets the status message.
     * @param {string} message The status message to display.
     */
    setStatus(message) {
        this.elements.statusMessage.textContent = message;
    }

    /**
     * Renders the grid of symbols.
     * @param {Array<Array<string>>} gridData 2D array of symbols.
     * @param {boolean} highlightWin Whether to apply win highlighting.
     */
    renderGrid(gridData, highlightWin = false) {
        this.elements.reelsGrid.innerHTML = '';

        for (let rowIdx = 0; rowIdx < this.config.rows; rowIdx++) {
            this.renderRow(gridData[rowIdx], highlightWin);
        }
    }

    /**
     * Renders a single row of the grid.
     * @param {Array<string>} rowData Array of symbols for the row.
     * @param {boolean} highlightWin Whether to apply win highlighting.
     */
    renderRow(rowData, highlightWin) {
        for (let reelIdx = 0; reelIdx < this.config.reels; reelIdx++) {
            this.renderCell(rowData[reelIdx], reelIdx, highlightWin);
        }
    }

    /**
     * Renders a single cell in the grid.
     * @param {string} symbolStr The symbol string.
     * @param {number} reelIdx The index of the reel.
     * @param {boolean} highlightWin Whether to apply win highlighting.
     */
    renderCell(symbolStr, reelIdx, highlightWin) {
        const cell = document.createElement('div');
        cell.className = 'reel-cell';
        cell.setAttribute('role', 'gridcell');
        cell.dataset.reelIdx = reelIdx;

        const img = this.createSymbolImage(symbolStr);
        this.applyCellHighlight(cell, symbolStr, highlightWin);

        cell.appendChild(img);
        this.elements.reelsGrid.appendChild(cell);
    }

    /**
     * Creates an element for a symbol.
     * @param {string} symbolStr The symbol string.
     * @returns {HTMLElement} The created element.
     */
    createSymbolImage(symbolStr) {
        const el = document.createElement('div');
        el.className = 'symbol-icon symbol';
        el.setAttribute('aria-label', symbolStr);
        el.setAttribute('role', 'img');

        const symbolMap = {
            'CHERRY': '🧪',
            'WILD': '🐉',
            'SCATTER': '🧙',
            'BONUS': '🏰',
            'HELMET': '🛡️',
            'SWORD': '⚔️',
            'COIN': '💰',
            'VASE': '🍺'
        };

        el.textContent = symbolMap[symbolStr] || '❓';

        this.applySymbolClass(el, symbolStr);

        return el;
    }

    /**
     * Applies a CSS class to a symbol based on its type.
     * @param {HTMLElement} img The element.
     * @param {string} symbolStr The symbol string.
     */
    applySymbolClass(img, symbolStr) {
        if (symbolStr === 'WILD') {
            img.classList.add('symbol-wild');
        } else if (symbolStr === 'SCATTER') {
            img.classList.add('symbol-scatter');
        } else if (['HELMET', 'SWORD'].includes(symbolStr)) {
            img.classList.add('symbol-high');
        } else {
            img.classList.add('symbol-low');
        }
    }

    /**
     * Applies the win highlight class to a cell.
     * @param {HTMLElement} cell The cell element.
     * @param {string} symbolStr The symbol string.
     * @param {boolean} highlightWin Whether to highlight.
     */
    applyCellHighlight(cell, symbolStr, highlightWin) {
        if (highlightWin && symbolStr !== 'BLANK') {
            cell.classList.add('win-highlight');
        }
    }

    /**
     * Shows the spin results panel with session summary.
     */
    showResults() {
        // Session summary
        const totalWagered = this.state.sessionTotalWagered;
        const totalWon = this.state.sessionTotalWon;
        const netGain = totalWon - totalWagered;

        this.elements.totalWageredDisplay.textContent = Math.floor(totalWagered);
        this.elements.totalWonDisplay.textContent = Math.floor(totalWon);
        this.elements.netGainDisplay.textContent = (netGain >= 0 ? '+' : '') + Math.floor(netGain);
        this.elements.netGainDisplay.style.color = netGain >= 0 ? 'var(--color-gold-light)' : '#ff4444';
        this.elements.totalBonusesDisplay.textContent = this.state.sessionTotalBonuses;

        this.elements.resultsPanel.classList.remove('hidden');
        this.elements.resultsPanel.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hides the spin results panel.
     */
    hideResults() {
        this.elements.resultsPanel.classList.add('hidden');
        this.elements.resultsPanel.setAttribute('aria-hidden', 'true');
    }

    /**
     * Executes a spin.
     * @param {number} power The power of the pull.
     */
    async executeSpin(power = CONSTANTS.DEFAULT_POWER) {
        if (this.isSpinning || this.state.creditBalance < this.state.currentBet) return;
        
        this.prepareForSpin();

        const durationMs = CONSTANTS.BASE_SPIN_DURATION - (power * CONSTANTS.POWER_MULTIPLIER);

        try {
            const result = this.engine.calculateSpinResult();
            await new Promise(resolve => setTimeout(resolve, durationMs));
            this.applySpinResult(result);
        } catch (error) {
            console.error("Spin error:", error);
            this.setStatus(error.message);
        } finally {
            this.endSpinMode();
        }
    }

    /**
     * Prepares the state and UI for a new spin.
     */
    prepareForSpin() {
        this.state.setCreditBalance(this.state.creditBalance - this.state.currentBet);
        this.state.setMultiplierStatus(1);
        this.updateDisplays();
        this.startSpinMode();
        this.animateReelsSpin();
    }

    /**
     * Applies the result of a spin to the state and UI.
     * @param {Object} result The spin result.
     */
    applySpinResult(result) {
        // Record session stats
        this.state.recordSessionWager(this.state.currentBet);
        this.state.recordSessionWin(result.payout);
        if (result.bonuses >= CONSTANTS.MIN_BONUSES) {
            this.state.recordSessionBonus();
        }

        this.state.setCreditBalance(this.state.creditBalance + result.payout);
        this.state.setSpinResult(result.grid);
        this.state.setMultiplierStatus(result.multiplier);
        
        if (result.scatters >= CONSTANTS.MIN_SCATTERS) {
            this.engine.triggerFreeSpins();
        }
        if (result.bonuses >= CONSTANTS.MIN_BONUSES) {
            this.engine.triggerBonusMiniGame();
        }

        this.finalizeSpin(result);
    }

    /**
     * Starts the spin mode.
     */
    startSpinMode() {
        this.isSpinning = true;
        this.hideResults();
        this.elements.btnSpin.disabled = true;
        this.elements.btnLever.disabled = true;
        this.elements.spinIndicator.classList.remove('hidden');
        this.setStatus('Spinning...');
    }

    /**
     * Ends the spin mode.
     */
    endSpinMode() {
        this.isSpinning = false;
        this.elements.spinIndicator.classList.add('hidden');
        this.updateDisplays();
    }

    /**
     * Animates the reels during a spin.
     */
    animateReelsSpin() {
        const cells = this.elements.reelsGrid.querySelectorAll('.reel-cell');
        cells.forEach(cell => {
            const reelIdx = cell.dataset.reelIdx || 0;
            cell.style.animationDelay = `${reelIdx * CONSTANTS.ANIM_DELAY_STEP}s`;
            cell.classList.add('spinning');
        });
    }

    /**
     * Adds a spin to the history sidebar.
     * @param {number} bet - The bet amount.
     * @param {number} payout - The payout amount.
     */
    addToHistory(bet, payout) {
        if (this.elements.historyList.querySelector('.history-empty')) {
            this.elements.historyList.innerHTML = '';
        }

        const item = document.createElement('div');
        item.className = 'history-item' + (payout > 0 ? ' win' : '');

        item.innerHTML = `
            <div class="bet-info">
                <span>Wager: ${bet}</span>
            </div>
            <div class="payout-info">
                ${payout > 0 ? '+' + Math.floor(payout) : 'No Win'}
            </div>
        `;

        this.elements.historyList.prepend(item);

        // Keep only last items based on config
        if (this.elements.historyList.children.length > CONSTANTS.MAX_HISTORY_ITEMS) {
            this.elements.historyList.removeChild(this.elements.historyList.lastChild);
        }
    }

    /**
     * Finalizes the spin and updates results.
     * @param {Object} result The spin result object.
     */
    finalizeSpin(result) {
        const hasWin = result.payout > 0;
        this.renderGrid(result.grid, hasWin);

        this.addToHistory(this.state.currentBet, result.payout);

        if (result.multiplierTriggered && hasWin) {
            this.showMultiplierPopup(result.multiplier);
        }

        if (hasWin) {
            this.setStatus(`Thy fortune grows! Won ${Math.floor(result.payout)} gold.`);
            this.showBalancePopup(result.payout);
        } else {
            this.setStatus('No win this time. Try again!');
        }

        this.updateDisplays();
    }

    /**
     * Shows a floating popup next to the gold balance.
     * @param {number} amount The amount won.
     */
    showBalancePopup(amount) {
        if (amount <= 0) return;

        const popup = document.createElement('div');
        popup.className = 'balance-popup';
        popup.textContent = `+${Math.floor(amount)}`;

        // Append to the parent of creditDisplay (info-group)
        this.elements.creditDisplay.parentElement.appendChild(popup);

        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, CONSTANTS.BALANCE_POPUP_DURATION);
    }

    /**
     * Shows a popup animation when a multiplier is triggered.

     * @param {number} newMultiplier The new multiplier value.
     */
    showMultiplierPopup(newMultiplier) {
        const popup = document.createElement('div');
        popup.className = 'multiplier-popup';
        popup.textContent = `BOON GRANTED! ${newMultiplier}x MULTIPLIER!`;

        document.querySelector('.machine-center').appendChild(popup);

        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, CONSTANTS.POPUP_DURATION);
    }

    /**
     * Handles bet input changes.
     * @param {Event} e The input event.
     */
    handleBetInput(e) {
        const val = parseInt(e.target.value, CONSTANTS.RADIX);
        this.state.setCurrentBet(val);
        this.elements.betAmountInput.setAttribute('aria-valuenow', val);
        this.updateDisplays();
    }

    /**
     * Handles adding credits.
     */
    handleAddCredits() {
        if (this.state.creditBalance >= this.state.currentBet && this.state.creditBalance > 0) {
            this.setStatus('Thou hast enough gold! Spin the reels.');
            return;
        }
        this.state.setCreditBalance(this.state.creditBalance + CONSTANTS.ADD_CREDITS_AMOUNT);
        this.setStatus(`A patron grants thee ${CONSTANTS.ADD_CREDITS_AMOUNT} gold.`);
        this.updateDisplays();
    }

    /**
     * Handles cashing out.
     */
    handleCashout() {
        this.elements.resultsPanel.querySelector('h2').textContent = "Session Summary";
        this.showResults();
        
        this.setStatus(`Cashed out ${Math.floor(this.state.creditBalance)} credits. Game over.`);
        this.state.setCreditBalance(0);
        this.updateDisplays();
    }

    /**
     * Handles the start of a lever pull.
     * @param {Event} e The mouse or touch event.
     */
    handleLeverStart(e) {
        if (this.isSpinning || this.elements.btnLever.disabled) return;
        e.preventDefault();

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.leverPhysics.startPull(clientY, performance.now());

        this.elements.btnLever.classList.add('pulling');
    }

    /**
     * Handles the movement of the lever pull.
     * @param {Event} e The mouse or touch event.
     */
    handleLeverMove(e) {
        if (!this.leverPhysics.isPulling) return;

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.leverPhysics.updatePull(clientY);

        let distance = this.leverPhysics.currentY - this.leverPhysics.startY;
        if (distance < 0) distance = 0;

        let rotation = (distance / this.leverPhysics.pullThreshold) * CONSTANTS.ROTATION_MULTIPLIER;
        if (rotation > CONSTANTS.MAX_ROTATION) rotation = CONSTANTS.MAX_ROTATION;

        const scaleY = 1 - (rotation / CONSTANTS.ROTATION_SCALE);
        this.elements.btnLever.style.transform = `rotateX(${rotation}deg) scaleY(${scaleY})`;
    }

    /**
     * Handles the end of a lever pull.
     */
    handleLeverEnd() {
        if (!this.leverPhysics.isPulling) return;

        const result = this.leverPhysics.endPull(performance.now());

        this.elements.btnLever.classList.remove('pulling');
        this.elements.btnLever.style.transform = '';

        if (result.triggered) {
            this.executeSpin(result.spinPower);
        } else {
            this.setStatus('Pull harder to spin!');
        }
    }

    /**
     * Generates a decorative scroll image of the session spoils using Canvas.
     * @returns {Promise<Blob>} The image blob.
     */
    async generateSpoilsImage() {
        const canvas = document.createElement('canvas');
        canvas.width = CONSTANTS.CANVAS_WIDTH;
        canvas.height = CONSTANTS.CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');

        this.drawParchment(ctx, canvas.width, canvas.height);
        this.drawDecreeHeader(ctx, canvas.width);
        this.drawDecreeStats(ctx);
        this.drawDecreeFooter(ctx, canvas.width);

        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }

    /**
     * Draws the parchment background and border.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} w - Width.
     * @param {number} h - Height.
     */
    drawParchment(ctx, w, h) {
        ctx.fillStyle = '#e5d1b3';
        ctx.fillRect(0, 0, w, h);

        const outer = CONSTANTS.CANVAS_BORDER_OUTER;
        const inner = CONSTANTS.CANVAS_BORDER_INNER;

        ctx.strokeStyle = '#8B6508';
        ctx.lineWidth = CONSTANTS.CANVAS_LINE_THICK_OUTER;
        ctx.strokeRect(outer, outer, w - (outer * CONSTANTS.VAL_2), h - (outer * CONSTANTS.VAL_2));
        
        ctx.strokeStyle = '#c69b26';
        ctx.lineWidth = CONSTANTS.CANVAS_LINE_THICK_INNER;
        ctx.strokeRect(inner, inner, w - (inner * CONSTANTS.VAL_2), h - (inner * CONSTANTS.VAL_2));
    }

    /**
     * Draws the header text on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} w - Width.
     */
    drawDecreeHeader(ctx, w) {
        ctx.fillStyle = '#4a0d0d';
        ctx.font = 'bold 40px Cinzel Decorative, serif';
        ctx.textAlign = 'center';
        ctx.fillText('ROYAL DECREE', w / CONSTANTS.VAL_2, CONSTANTS.CANVAS_HEADER_Y);

        ctx.font = '24px MedievalSharp, cursive';
        ctx.fillText('of thy Great Fortune', w / CONSTANTS.VAL_2, CONSTANTS.CANVAS_SUBHEADER_Y);
    }

    /**
     * Draws the session stats on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    drawDecreeStats(ctx) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2b1f13';
        
        const stats = [
            { label: '💰 Total Won:', value: `${Math.floor(this.state.sessionTotalWon)} Gold` },
            { label: '🎲 Total Wagered:', value: `${Math.floor(this.state.sessionTotalWagered)} Gold` },
            { label: '📈 Net Gain:', value: `${Math.floor(this.state.sessionTotalWon - this.state.sessionTotalWagered)} Gold` },
            { label: '🏰 Bonuses Found:', value: this.state.sessionTotalBonuses }
        ];

        stats.forEach((stat, i) => {
            const y = CONSTANTS.CANVAS_STATS_Y + (i * CONSTANTS.CANVAS_STATS_SPACING);
            ctx.font = 'bold 28px MedievalSharp, cursive';
            ctx.fillText(stat.label, CONSTANTS.CANVAS_LABEL_X, y);
            ctx.font = '28px MedievalSharp, cursive';
            ctx.fillText(stat.value, CONSTANTS.CANVAS_VALUE_X, y);
        });
    }

    /**
     * Draws the footer text on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} w - Width.
     */
    drawDecreeFooter(ctx, w) {
        ctx.textAlign = 'center';
        ctx.font = 'italic 22px MedievalSharp, cursive';
        ctx.fillText('By Order of the Royal Slots', w / CONSTANTS.VAL_2, CONSTANTS.CANVAS_FOOTER_Y);
    }

    /**
     * Handles sharing the session results as an image.
     */
    async handleShareResults() {
        const originalText = this.elements.btnShareResults.textContent;
        this.elements.btnShareResults.textContent = "Forging Decree...";

        try {
            const blob = await this.generateSpoilsImage();
            const file = new File([blob], 'royal-spoils.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'My Royal Slots Spoils',
                    text: 'Behold my fortune from the Royal Slots! 🐉'
                });
                this.elements.btnShareResults.textContent = originalText;
            } else {
                this.downloadSpoilsImage(blob, originalText);
            }
        } catch (err) {
            console.error('Sharing failed', err);
            this.setStatus("Thy device cannot share this image.");
            this.elements.btnShareResults.textContent = originalText;
        }
    }

    /**
     * Helper to download the spoils image.
     * @param {Blob} blob - Image blob.
     * @param {string} originalText - Original button text.
     */
    downloadSpoilsImage(blob, originalText) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'royal-spoils.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.elements.btnShareResults.textContent = "Decree Downloaded!";
        setTimeout(() => {
            this.elements.btnShareResults.textContent = originalText;
        }, CONSTANTS.POPUP_DURATION);
    }

    /**
     * Binds all DOM events.
     */
    bindEvents() {
        this.elements.betAmountInput.addEventListener('input', (e) => this.handleBetInput(e));
        this.elements.btnSpin.addEventListener('click', () => this.executeSpin(CONSTANTS.DEFAULT_POWER));
        this.elements.btnAddCredits.addEventListener('click', () => this.handleAddCredits());
        this.elements.btnCashout.addEventListener('click', () => this.handleCashout());
        this.elements.btnShareResults.addEventListener('click', () => this.handleShareResults());
        this.elements.btnCloseResults.addEventListener('click', () => this.hideResults());

        this.elements.btnLever.addEventListener('mousedown', (e) => this.handleLeverStart(e));
        document.addEventListener('mousemove', (e) => this.handleLeverMove(e));
        document.addEventListener('mouseup', () => this.handleLeverEnd());

        this.elements.btnLever.addEventListener('touchstart', (e) => this.handleLeverStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleLeverMove(e), { passive: false });
        document.addEventListener('touchend', () => this.handleLeverEnd());

        window.addEventListener('resize', () => this.adjustScale());
        if (document.fonts) {
            document.fonts.ready.then(() => this.adjustScale());
        }
    }

    /**
     * Dynamically scales the slot machine container to fit the viewport perfectly.
     */
    adjustScale() {
        const container = document.querySelector('.slot-machine-container');
        if (!container) return;

        // Fixed base dimensions to stop layout feedback loops
        const cssWidth = 960;
        const cssHeight = 890;
        const paddingX = 40;
        const paddingY = CONSTANTS.HEIGHT_PADDING; // Increased padding to protect bottom edge

        const isDesktop = window.innerWidth > CONSTANTS.MOBILE_BREAKPOINT;

        const finalWidth = (isDesktop ? cssWidth + CONSTANTS.LEVER_WIDTH : cssWidth) + paddingX;
        const finalHeight = cssHeight + paddingY;

        // Use a more conservative scale to ensure it fits comfortably
        const scale = Math.min(window.innerWidth / finalWidth, window.innerHeight / finalHeight, CONSTANTS.MAX_SCALE);

        // Calculate offset to perfectly center the container + lever visually.
        // The lever is 70px wide and extends to the right. We offset the container by -35px
        // within the scaled transform so flexbox perfectly centers the visual group.
        const offsetX = isDesktop ? CONSTANTS.CENTER_OFFSET : 0;

        // Align the scale center to the visual center
        container.style.transformOrigin = 'center center';
        container.style.transform = `scale(${scale}) translateX(${offsetX}px) translateY(${CONSTANTS.VERTICAL_OFFSET}px)`;
    }

    /**
     * Renders the initial grid state.
     */
    initialRender() {
        try {
            console.log("Initializing Slot Machine symbols...");
            const initialGrid = RngService.generateGrid(this.config);
            this.renderGrid(initialGrid, false);
            this.updateDisplays();
            this.adjustScale();
            console.log("Initialization complete.");
        } catch (error) {
            console.error("Failed to initialize Slot Machine:", error);
            this.setStatus("Error initializing game. Please refresh.");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new SlotMachineUI());
