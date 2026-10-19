import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/ts-eslint";

// TODO: Kind of either deprecated or needs refactoring. A lot of Express related analyzing is now being done in ast-utils. 
export function isExpressRouteHandler(context: Readonly<RuleContext<string, unknown[]>>, node: TSESTree.CallExpression): boolean {
    if (node.callee.type !== "MemberExpression") return false;

    const expressMethodNames = ["get", "post", "put", "patch", "delete", "use"];
    const expressRouterDetectionStrings = ["Express", "Application", "Router", "express.Application", "express.Router"];

    // https://typescript-eslint.io/developers/custom-rules/#typed-rules
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const objectTsNode = services.esTreeNodeToTSNodeMap.get(node.callee.object);
    const objectType = checker.getTypeAtLocation(objectTsNode);
    const objectTypeString = checker.typeToString(objectType);
    const isExpressRouter = expressRouterDetectionStrings.includes(objectTypeString);

    const property = node.callee.property;
    if (property.type !== "Identifier") return false;
    const isExpressEndpoint = expressMethodNames.includes(property.name)

    return isExpressRouter && isExpressEndpoint;
}