const js = require("@eslint/js");
const prettier = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["public/js/lib/**", "test/lib/**", "public/bootstrap/**", "node_modules/**"]
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2017,
      sourceType: "module",
      globals: {
        // Browser
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        alert: "readonly",
        prompt: "readonly",

        // Node
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        Buffer: "readonly",

        // Mocha
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        beforeEach: "readonly",
        after: "readonly",
        afterEach: "readonly",

        // Testing
        expect: "readonly",
        sinon: "readonly",

        // AMD
        define: "readonly",
        requirejs: "readonly",

        // jQuery
        $: "readonly",
        jQuery: "readonly"
      }
    },
    plugins: {
      prettier
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["test/**/*.js"],
    rules: {
      "no-redeclare": "off",
      "no-undef": "off"
    }
  },
  {
    files: ["public/js/**/*.js"],
    rules: {
      "no-redeclare": "off"
    }
  }
];
