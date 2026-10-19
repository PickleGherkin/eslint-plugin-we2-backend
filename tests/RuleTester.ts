import { RuleTester } from "@typescript-eslint/rule-tester";
import { resolve } from "path";

/**
 * RuleTester guidelines taken from typescript-eslint/rule-tester docs.
 * https://typescript-eslint.io/packages/rule-tester/
 */
export const ruleTester = new RuleTester({
    /**
     * for type aware testing setup config was necessary.
     * https://typescript-eslint.io/packages/rule-tester/#type-aware-testing
     */
    languageOptions: {
        parserOptions: {
            projectService: {
                allowDefaultProject: ["*.ts*"]
            },
            tsconfigRootDir: resolve(__dirname, "../"),
        },
    },
});