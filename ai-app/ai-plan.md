# AI-Assisted Development Plan

This document outlines the methodology and plan for developing the AI Slot Machine application using a generative AI-driven approach.

## 1. Research & Discovery

Before development, we will conduct thorough research on the slot machine domain and define our target user profiles.

- **Domain Research:** Understand the mechanics, features, and common themes of slot machine games.
- **User Research:** Develop user personas and stories to guide feature development.

## 2. Application Outline

Based on our research, we will define the core components of our desired slot machine application.

- **Core Features:**
  - Spinning reel structure: 3 or 5 reel structure, grid/cluster types
  - Paylines: Fixed vs adjustable paylines
  - Multiplier: Multiples win by a set factor (2x, 5x. 10x).
  - Accurate Math
  - Symbols: Low-value and high-value symbols. High value symbols are usually tied to slot machine themes.
  - Wild: Substitutes for regular symbols to complete winning combos.
  - Scatter: Triggers free spins, bonus rounds, or multipliers
  - Bonus symbol: Unlocks special mini-games or bonus rounds
  - Lever with working physics

- **Bonus Features:**
  - Music and Sound
  - Win Screen
  - Share/screenshot jackpot win
  - Multiple UI’s / themes to choose from
  - Leaderboards
  - Daily login/Welcome Bonus
  - Tasks/mini-games sidebar to win bonuses
  - Cheerful cartoons, icons, emojis,...
  - Example icons: horseshoes, diamonds, spades, hearts and a Liberty Bell
  - Multiple Languages
  - Light/Dark / switch themes

- **Theme/Style:**
  - Red/Yellow & Black/White
  - Blue / Pink (sweat theme)
  - Dollar signs ($)
  - Medieval theme (1900s) - brown


## 3. AI-Driven Development Workflow

We will follow an incremental, AI-assisted process for building the application. Each feature or phase will follow this standard workflow:

1.  **Prompt:** Clearly define the task for the AI.
2.  **Review & Validate:**
    -   Manually review the generated code for clarity and correctness (e.g., clear variable names, clean structure).
    -   Use linters and validators to ensure code quality:
        -   **HTML:** [W3C HTML Validator](https://validator.w3.org/#validate_by_upload)
        -   **CSS:** [W3C CSS Validator](https://jigsaw.w3.org/css-validator/)
        -   **JavaScript:** Run `npm run lint` to use ESLint.
3.  **Log:** Document the results, findings, and any necessary refinements.
4.  **Commit:** Save the changes to version control with a descriptive message.

## 4. Development Phases

The project will be developed in distinct phases, building upon each other.

### Phase 0: AI Priming & Context Loading

**Goal:** Inform the AI of the project's background, goals, and constraints.
- **Actions:**
    -   Provide the AI with the research overview, user personas, and user stories.
    -   Establish the desired architecture and development plan.
- **Note:** No code/files will be generated in this phase.
- **Prompt:** Can be found in [ai-use-log](./ai-use-log.md)

### Phase 1: Core Game Engine (JavaScript)

**Goal:** Build the pure game logic without any UI.
- **Features:**
    -   Symbol definitions
    -   Reel data model
    -   Spin and Random Number Generation (RNG) logic
    -   Win detection logic
    -   Coin balance management
- **Process:**
    -   For each feature, follow the standard AI-Driven Development Workflow.
    -   Prompt the AI to generate unit tests to ensure the functionality of each feature.

### Phase 2: Basic UI (HTML)

**Goal:** Structure the basic user interface and connect the JavaScript engine.
- **Actions:**
    -   Prompt the AI to build the basic HTML structure.
    -   Wire the existing JavaScript engine to the HTML elements.
    -   Ensure no JavaScript logic is in the HTML file.
- **Process:**
    -   Follow the standard workflow and test the full application to ensure the engine and UI are correctly integrated.

### Phase 3: Styling & Game Feel (CSS)

**Goal:** Apply the desired visual theme and improve the user experience.
- **Actions:**
    -   Based on the chosen theme, prompt the AI to generate the CSS.
    -   Ensure the AI only modifies CSS files and does not significantly alter the HTML structure.
- **Process:**
    -   Iteratively prompt and refine until the desired look and feel are achieved.

### Phase 4: Bonus Features

**Goal:** Implement advanced gameplay mechanics.
- **Features:**
    -   Wild symbols
    -   Scatter symbols
    -   Free spins
    -   Other planned bonus rounds
- **Process:**
    -   For each bonus feature, follow the standard AI-Driven Development Workflow, including logic, UI, and styling.
