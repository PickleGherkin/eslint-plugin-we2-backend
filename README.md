# ESLint Plugin WE2 Backend

[![Pipeline Status](https://github.com/PickleGherkin/eslint-plugin-we2-backend/actions/workflows/test.yml/badge.svg)](https://github.com/PickleGherkin/eslint-plugin-we2-backend/actions/workflows/test.yml)

An ESLint plugin tailor-made for educational purposes for students at the Berliner Hochschule für Technik.

⚠️ **Notice:** This plugin is only meant for educational purposes only and is not intended for public use.

## How to install

### 1. ESLint already installed

Just simply use npm by running:

```bash
npm i --save-dev eslint-plugin-we2-backend
```

### 2. Step-by-Step Guide in case ESLint is not installed and configured **(Just-Make-It-Work-Edition)**

First of we need ESLint installed and configured in our TypeScript project.
Start the installation by running the command below (It's a setup tool taken from ESLint [quick-start](https://eslint.org/docs/latest/use/getting-started)):

```bash
npm init @eslint/config@latest
```

While in the installation menu, select the following options in order.
To make this as easy as possible: The `highlighted lines` are console outputs from the setup tool and the arrow indicates which option to choose.

1. `@eslint/create-config@<version>
Ok to proceed? (y)` => y
2. `? What do you want to lint? … 
◉ JavaScript
◯ JSON
◯ JSON with comments
◯ JSON5
◯ Markdown
◯ CSS` => JavaScript
3. `? How would you like to use ESLint? … 
  To check syntax only
▸ To check syntax and find problems` => To check syntax and find problems
4. `? What type of modules does your project use? … 
▸ JavaScript modules (import/export)
  CommonJS (require/exports)
  None of these` => JavaScript modules
5. `? Which framework does your project use? … 
  React
  Vue.js
▸ None of these` => None of These
6. `? Does your project use TypeScript? ‣ No / Yes` => Yes
7. `? Where does your code run? …  (Press <space> to select, <a> to toggle all, <i> to invert selection)
◯ Browser
◉ Node` => Node
8. `? Which language do you want your configuration file be written in? … 
▸ JavaScript
  TypeScript` => JavaScript
9. `eslint, @eslint/js, globals, typescript-eslint
? Would you like to install them now? ‣ No / Yes` => Yes
10. `? Which package manager do you want to use? … 
▸ npm
  yarn
  pnpm
  bun` => npm

Now there should be a configuration file (`eslint.config.js`) in your project.
Replace the existing configurations with the one below.

```ts
// file://eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginWE2Backend from "eslint-plugin-we2-backend";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
    eslintPluginWE2Backend.configs["flat/recommended"],
  {
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  }
]);
```

After doing so install the plugin:

```bash
npm i --save-dev eslint-plugin-we2-backend
```

Now you're good to go. Enjoy!