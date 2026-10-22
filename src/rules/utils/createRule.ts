import { ESLintUtils } from '@typescript-eslint/utils';

const REPO_URL = 'https://github.com/PickleGherkin/eslint-plugin-we2-backend';

// https://typescript-eslint.io/developers/custom-rules
export const createRule = ESLintUtils.RuleCreator<{ requiresTypeChecking?: boolean; }>(
    name => `${REPO_URL}/blob/main/docs/rules/${name}.md`,
);