import { createRule } from "../utils/createRule";

type Options = [];
type MessageIds = "noLocalhostHardcoding";

export const noHardcodedUrl = createRule<Options, MessageIds>({
    name: "no-hardcoded-url",
    meta: {
        type: "suggestion",
        docs: {
            description: "Stellt sicher, dass localhost nicht im Quellcode verwendet wird",
        },
        schema: [],
        messages: {
            noLocalhostHardcoding: "Bitte verwende nicht 'localhost' direkt im Quellcode. Importiere stattdessen deine Umgebungsvariablen aus deiner .env Datei.",
        },
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value === "string" && node.value.includes("localhost")) {
                    context.report({
                        node,
                        messageId: "noLocalhostHardcoding",
                    });
                }
            },
            // Matches template strings like `http://localhost:${port}`
            TemplateLiteral(node) {
                const hasLocalhost = node.quasis.some(quasi => 
                    quasi.value.cooked?.includes("localhost")
                );

                if (hasLocalhost) {
                    context.report({
                        node,
                        messageId: "noLocalhostHardcoding",
                    });
                }
            },
        };
    },
});