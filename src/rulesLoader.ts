/**
 * This is a helper file for plugin.
 * Jest scans files which include helper functions for tests and doesn't like ESM global variables like 'import.meta' in the same mentioned helper files.
 * Since plugin.ts is not being used by Jest it should not be problem to outsource helper functions here.
 */

import { TSESLint } from "@typescript-eslint/utils";
import { readdirSync } from "fs";
import { dirname, join, parse } from "path";
import { fileURLToPath } from "url";

type RuleModule = TSESLint.RuleModule<string, unknown[]> & {
    meta: Required<Pick<TSESLint.RuleMetaData<string, unknown[]>, 'docs'>>;
};

function getRuleNamespaces(): string[] {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rulesPath = join(__dirname, "rules");

    try {
        const contents = readdirSync(rulesPath, { withFileTypes: true });
        const ruleNamespaces = contents
            .filter(item => item.isDirectory())
            .map(item => item.name);
        return ruleNamespaces;
    } catch (error) {
        // eslint-disable-next-line preserve-caught-error
        throw new Error(`Error reading rules directory: ${error}`);
    }
}

// Gemini calls this a converter which transforms 'kebab-case' (aka. snake-case) into camel-case. Fucking hilarious!
const toExportName = (fileName: string) =>
    fileName.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

export async function getRules(): Promise<Record<string, RuleModule>> {
    const rules: Record<string, RuleModule> = {};
    const ruleNamespaces = getRuleNamespaces();

    for (const namespace of ruleNamespaces) {
        const namespaceDir = new URL(`./rules/${namespace}/`, import.meta.url);
        const files = readdirSync(namespaceDir).filter(file => file.endsWith('.mjs'));

        for (const file of files) {
            const name = parse(file).name;
            const module = await import(
                new URL(`./rules/${namespace}/${file}`, import.meta.url).href
            );
            const ruleModule = (module.default ?? module[toExportName(name)]) as RuleModule;

            rules[`${namespace}/${name}`] = ruleModule;
        }
    }
    return rules;
}