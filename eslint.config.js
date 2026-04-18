/* eslint-disable no-magic-numbers */
const globals = require("globals");
const js = require("@eslint/js");
const jsdoc = require("eslint-plugin-jsdoc");

module.exports = [
  js.configs.recommended,
  {
    plugins: {
      jsdoc: jsdoc,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/require-returns-type": "warn",

      // Clean Code Rules
      "complexity": ["warn", 5], // Limit cyclomatic complexity
      "max-depth": ["warn", 3], // Limit nesting depth
      "max-lines-per-function": ["warn", 50], // Limit function length
      "max-params": ["warn", 3], // Limit number of function parameters
      "no-shadow": "warn", // Disallow variable declarations from shadowing variables declared in the outer scope
      "no-else-return": "warn", // Disallow `else` blocks after `return` statements in `if` statements
      "no-lonely-if": "warn", // Disallow `if` statements as the only statement in an `else` block
      "no-duplicate-imports": "warn", // Disallow duplicate module imports
      "no-magic-numbers": ["warn", { "ignore": [-1, 0, 1, 2] }], // Disallow magic numbers
      "prefer-const": "warn", // Require `const` declarations for variables that are never reassigned after declared
      "no-var": "error", // Require `let` or `const` instead of `var`
    },
  },
];
