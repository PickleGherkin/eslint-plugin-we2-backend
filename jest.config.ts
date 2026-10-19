// https://www.w3tutorials.net/blog/jest-run-coverage-report-for-all-files-in-the-project/
// https://jestjs.io/docs/configuration

import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        "<rootDir>/src/rules/utils/*",
        "<rootDir>/src/*",
    ],
    collectCoverageFrom: [
        "src/**/*.ts"
    ],
    coveragePathIgnorePatterns: [
        "node_modules",
        "\\.d\\.ts",
        "<rootDir>/src/plugin.ts",
        "<rootDir>/src/rules/utils/*",
        "<rootDir>/src/ruleLoader.ts",
    ],
    reporters: [
        "default",
        ["jest-junit", { suiteNameTemplate: "{filename}", "classNameTemplate": "{filename}", "titleTemplate": "{title}" }],
    ],
};

export default config;  