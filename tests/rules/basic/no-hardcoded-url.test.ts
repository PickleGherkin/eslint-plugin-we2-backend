import { noHardcodedUrl } from "../../../src/rules/basic/no-hardcoded-url";
import { ruleTester } from "../../RuleTester";

ruleTester.run("no-hardcoded-url", noHardcodedUrl, {
    valid: [
        {
            code: "const url = process.env.API_URL;",
        },
    ],
    invalid: [
        {
            code: "const url = 'http://localhost:3000';",
            errors: [{ messageId: "noLocalhostHardcoding" }],
        },
        {
            code: "const url = \"localhost\";",
            errors: [{ messageId: "noLocalhostHardcoding" }],
        },
        {
            code: "const url = `http://localhost:${port}/api`;",
            errors: [{ messageId: "noLocalhostHardcoding" }],
        },
        {
            code: "const url = `https://${subdomain}.localhost`;",
            errors: [{ messageId: "noLocalhostHardcoding" }],
        },
    ],
})