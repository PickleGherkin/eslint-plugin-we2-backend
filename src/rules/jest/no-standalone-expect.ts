import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { DescribeAlias, getAccessorValue, getNodeName, isFunction, isTypeOfJestFnCall, parseJestFnCall } from '../utils';
import { createRule } from '../utils/createRule';

const getBlockType = (
  statement: TSESTree.BlockStatement,
  context: TSESLint.RuleContext<string, unknown[]>,
): 'function' | 'describe' | null => {
  const func = statement.parent;

  // functionDeclaration: function func() {}
  if (func.type === AST_NODE_TYPES.FunctionDeclaration) {
    return 'function';
  }

  if (isFunction(func)) {
    const expr = func.parent;

    // arrow function or function expr
    if (expr.type === AST_NODE_TYPES.VariableDeclarator) {
      return 'function';
    }

    // if it's not a variable, it will be callExpr, we only care about describe
    if (
      expr.type === AST_NODE_TYPES.CallExpression &&
      isTypeOfJestFnCall(expr, context, ['describe'])
    ) {
      return 'describe';
    }
  }

  return null;
};

type BlockType = 'test' | 'function' | 'describe' | 'arrow' | 'template';

export default createRule<
  [{ additionalTestBlockFunctions?: string[] }],
  'unexpectedExpect'
>({
  name: 'no-standalone-expect',
  meta: {
    docs: {
      description: 'Verhindert `expect` außerhalb eines Jest-Testblocks.',
    },
    messages: {
      unexpectedExpect: 'Expect muss innerhalb eines `test`-Blocks sein.',
    },
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        properties: {
          additionalTestBlockFunctions: {
            description:
              "Additional function names to treat as test blocks in addition to the built-in 'test' function (e.g. custom wrappers). Provide names as strings.",
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ additionalTestBlockFunctions: undefined }],
  },
  defaultOptions: [{ additionalTestBlockFunctions: [] }],
  create(context, [{ additionalTestBlockFunctions = [] }]) {
    const callStack: BlockType[] = [];

    const isCustomTestBlockFunction = (
      node: TSESTree.CallExpression,
    ): boolean =>
      additionalTestBlockFunctions.includes(getNodeName(node) || '');

    return {
      CallExpression(node) {
        const jestFnCall = parseJestFnCall(node, context);

        if (jestFnCall?.type === 'expect') {
          if (
            jestFnCall.head.node.parent.type ===
            AST_NODE_TYPES.MemberExpression &&
            jestFnCall.members.length === 1 &&
            !['assertions', 'hasAssertions'].includes(
              getAccessorValue(jestFnCall.members[0]),
            )
          ) {
            return;
          }

          const parent = callStack[callStack.length - 1];

          if (!parent || parent === DescribeAlias.describe) {
            context.report({ node, messageId: 'unexpectedExpect' });
          }

          return;
        }

        if (jestFnCall?.type === 'test' || isCustomTestBlockFunction(node)) {
          callStack.push('test');
        }

        if (node.callee.type === AST_NODE_TYPES.TaggedTemplateExpression) {
          callStack.push('template');
        }
      },
      'CallExpression:exit'(node: TSESTree.CallExpression) {
        const top = callStack[callStack.length - 1];

        if (
          (top === 'test' &&
            (isTypeOfJestFnCall(node, context, ['test']) ||
              isCustomTestBlockFunction(node)) &&
            node.callee.type !== AST_NODE_TYPES.MemberExpression) ||
          (top === 'template' &&
            node.callee.type === AST_NODE_TYPES.TaggedTemplateExpression)
        ) {
          callStack.pop();
        }
      },

      BlockStatement(statement) {
        const blockType = getBlockType(statement, context);

        if (blockType) {
          callStack.push(blockType);
        }
      },
      'BlockStatement:exit'(statement: TSESTree.BlockStatement) {
        if (
          callStack[callStack.length - 1] === getBlockType(statement, context)
        ) {
          callStack.pop();
        }
      },

      ArrowFunctionExpression(node) {
        if (node.parent.type !== AST_NODE_TYPES.CallExpression) {
          callStack.push('arrow');
        }
      },
      'ArrowFunctionExpression:exit'() {
        if (callStack[callStack.length - 1] === 'arrow') {
          callStack.pop();
        }
      },
    };
  },
});
