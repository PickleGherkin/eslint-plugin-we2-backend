// https://eslint.org/docs/latest/extend/plugins#linting-a-plugin

// https://www.npmjs.com/package/eslint-plugin-n
// https://www.npmjs.com/package/eslint-plugin-eslint-plugin
// https://typescript-eslint.io/getting-started/

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import nodePlugin from 'eslint-plugin-n';
import globals from 'globals'

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPlugin.configs.recommended,
  nodePlugin.configs["flat/recommended"],
  { ignores: ["dist", "**/coverage"] },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    rules: {
      "n/no-missing-import": "off", // off because when working in devcontainer it triggers as false positive
      "n/no-extraneous-import": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "no-prototype-builtins": "off",
      "no-empty": "warn",
      "eslint-plugin/require-meta-schema-description": "off"
    }
  }
]);