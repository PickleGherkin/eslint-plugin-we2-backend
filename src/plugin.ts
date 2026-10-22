import type { TSESLint } from '@typescript-eslint/utils';
import { name as packageName, version as packageVersion } from '../package.json';
import globals from './globals.json';
import { getRules } from './rulesLoader';

type RuleModule = TSESLint.RuleModule<string, unknown[]> & {
	meta: Required<Pick<TSESLint.RuleMetaData<string, unknown[]>, 'docs'>>;
};

const rules: Record<string, RuleModule> = await getRules();

const recommendedRules = {
	'we2b/basic/no-hardcoded-url': "error",
	'we2b/express/valid-express-endpoint': 'error',
	'we2b/express/valid-login-router': 'error',
	'we2b/express/no-model-dependencies': 'error',
	'we2b/jest/await-supertest-request': 'error',
	'we2b/jest/expect-expect': 'error',
	'we2b/jest/no-conditional-expect': 'error',
	'we2b/jest/no-export': 'error',
	'we2b/jest/no-identical-title': 'error',
	'we2b/jest/no-standalone-expect': 'error',
	'we2b/jest/valid-expect': 'error',
	'we2b/jest/valid-expect-in-promise': 'error',
	'we2b/jest/valid-title': 'error',
} satisfies Record<string, TSESLint.Linter.RuleLevel>;

const styleRules = {
	'we2b/jest/prefer-to-be': 'warn',
	'we2b/jest/prefer-to-contain': 'warn',
	'we2b/jest/prefer-to-have-length': 'warn',
	'we2b/jest/no-alias-methods': 'warn',
} satisfies Record<string, TSESLint.Linter.RuleLevel>;

const allRules = Object.fromEntries<TSESLint.Linter.RuleLevel>(
	Object.entries(rules)
		.map(([name]) => [`we2b/${name}`, 'error']),
);

const plugin = {
	meta: { name: packageName, version: packageVersion },
	environments: {
		globals: {
			globals,
		},
	},
	rules,
};

const createRCConfig = (rules: Record<string, TSESLint.Linter.RuleLevel>) => ({
	plugins: [packageName],
	env: { 'jest/globals': true },
	rules,
});

const createFlatConfig = (
	rules: Record<string, TSESLint.Linter.RuleLevel>,
) => ({
	plugins: { we2b: plugin },
	languageOptions: { globals },
	rules,
});

const configs = {
	all: createRCConfig(allRules),
	recommended: createRCConfig(recommendedRules),
	style: createRCConfig(styleRules),
	'flat/all': createFlatConfig(allRules),
	'flat/recommended': createFlatConfig(recommendedRules),
	'flat/style': createFlatConfig(styleRules),
} satisfies Record<string, TSESLint.Linter.ConfigType>;

export default {
	...plugin,
	configs
};
