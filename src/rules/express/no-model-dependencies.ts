import { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/createRule";
import { isExpressRouteHandler } from "../utils/ExpressHelper";

type MessageIds = "noModelDependencies";

type Options = [];

export const noModelDependencies = createRule<Options, MessageIds>({
    name: "no-model-dependencies",
    meta: {
        type: "suggestion",
        docs: {
            description: "Stellt sicher, das innerhalb der Express Router keine Model-Funktionen verwendet werden.",
        },
        messages: {
            noModelDependencies: "Bitte verwende keine Mongoose-Funktionen innerhalb deiner Router. Benutze lieber Service-Funktionen, da du bereits die Geschäftslogik implementiert hast.",
        },
        schema: [],
    },
    // AST Specification taken from https://typescript-eslint.io/packages/typescript-estree/ast-spec/
    create(context) {
        let isRouteHandlerContext = false;

        // TODO: Make these available as options for the rule, so that it can configured by given entity names and ODM methods.
        const entityNames = ['Prof', 'Gebiet', 'Thema'];
        const ODMMethods = ['create', 'update', 'findOne', 'findById', 'find', 'deleteOne', 'deleteMany'];


        function handleFunctionCall(node: TSESTree.Identifier) {
            const identifier = node.name;

            entityNames.forEach((entityName) => {
                if (entityName === identifier) {
                    context.report({
                        node: node.parent,
                        messageId: "noModelDependencies"
                    });
                    return;
                }
            });
        }

        // https://stackoverflow.com/questions/47972903/difference-between-callexpression-and-memberexpression
        function handleMethodCall(node: TSESTree.MemberExpression) {
            const object = node.object;
            const property = node.property;

            if (object.type === "Identifier" && property.type === "Identifier") {
                entityNames.forEach((entityName) => {
                    ODMMethods.forEach((ODMMethod) => {
                        if (object.name === entityName && property.name === ODMMethod) {
                            context.report({
                                node: node,
                                messageId: "noModelDependencies"
                            });
                            return;
                        }
                    })
                });
            }
        }

        return {
            CallExpression(node) {
                if (isExpressRouteHandler(context, node)) {
                    isRouteHandlerContext = true;
                    return;
                }

                if (!isRouteHandlerContext) {
                    return;
                }

                if (node.callee.type === "Identifier") {
                    handleFunctionCall(node.callee);
                }

                if (node.callee.type === "MemberExpression") {
                    handleMethodCall(node.callee);
                }
            },
            'CallExpression:exit'(node) {
                if (isExpressRouteHandler(context, node)) {
                    isRouteHandlerContext = false;
                }
            }
        };
    }
})

