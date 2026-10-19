import { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/createRule";
import { isExpressRouteHandler } from "../utils/ExpressHelper";

type MessageIds = "noVerify" | "noBcrypt" | "noLogin"; // instead of verify use verifyJWT | instead of bcrypt.compare or login use verifyPasswordAndCreateJWT

type Options = [];

export const validLoginRouter = createRule<Options, MessageIds>({
    name: "valid-login-router",
    meta: {
        type: "suggestion",
        docs: {
            description: "Stellt sicher, das der Login Router korrekt implementiert wird. Es wird nach der Integrierung von Funktionen der JWTServices innerhalb des Login-Routers geprüft.",
        },
        messages: {
            noVerify: "Bitte verwende anstatt 'verify' lieber das von dir implementierte 'verifyJWT' vom JWTService. Damit wird das DRY Prinzip einbehalten.",
            noBcrypt: "Bitte verwende anstatt 'bcrypt.compare' lieber das von dir implementierte 'verifyPasswordAndCreateJWT' vom JWTService. Damit wird das DRY Prinzip einbehalten.",
            noLogin: "Bitte verwende anstatt 'login' lieber das von dir implementierte 'verifyPasswordAndCreateJWT' vom JWTService. Damit wird das DRY Prinzip einbehalten."
        },
        schema: [],
        fixable: "code"
    },
    // AST Specification taken from https://typescript-eslint.io/packages/typescript-estree/ast-spec/
    create(context) {
        let isLoginRouterContext = false;

        function isLoginRouter(node: TSESTree.CallExpression): boolean {
            if (node.callee.type !== "MemberExpression") return false;

            const routerNames = ["loginRouter", "login", "loginRoute"];

            const object = node.callee.object;
            if (object.type !== "Identifier") return false;
            return routerNames.includes(object.name);
        }

        function handleFunctionCall(node: TSESTree.Identifier) {
            const identifier = node.name;

            switch (identifier) {
                case "login": {
                    context.report({
                        node: node.parent,
                        messageId: "noLogin"
                    });
                    return;
                }
                case "verify": {
                    context.report({
                        node: node.parent,
                        messageId: "noVerify"
                    });
                    return;
                }
                case "compare": {
                    context.report({
                        node: node.parent,
                        messageId: "noBcrypt"
                    });
                    return;
                }
            }
        }

        // https://stackoverflow.com/questions/47972903/difference-between-callexpression-and-memberexpression
        function handleMethodCall(node: TSESTree.MemberExpression) {
            const object = node.object;
            const property = node.property;

            if (object.type === "Identifier" && property.type === "Identifier") {
                if (object.name === "bcrypt" && property.name === "compare") {
                    context.report({
                        node: node,
                        messageId: "noBcrypt"
                    });
                    return;
                }

                if ((object.name === "jwt" || object.name === "jsonwebtoken") && property.name === "verify") {
                    context.report({
                        node: node,
                        messageId: "noVerify"
                    });
                    return;
                }
            }
        }

        return {
            CallExpression(node) {
                if (isExpressRouteHandler(context, node) && isLoginRouter(node)) {
                    isLoginRouterContext = true;
                    return;
                }

                if (!isLoginRouterContext) {
                    return;
                }

                if (node.callee.type === "Identifier") {
                    handleFunctionCall(node.callee);
                    return;
                }

                if (node.callee.type === "MemberExpression") { // z.b bcrypt.compare or jwt.verify}
                    handleMethodCall(node.callee);
                    return;
                }
            },
            // https://eslint.org/docs/latest/extend/selectors#what-is-a-selector
            'CallExpression:exit'(node) {
                if (isExpressRouteHandler(context, node) && isLoginRouter(node)) {
                    isLoginRouterContext = false;
                }
            }
        };
    }
})

