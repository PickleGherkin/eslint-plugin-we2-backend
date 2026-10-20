import { getStringValue, isStringNode, isSupportedAccessor, isTypeOfJestFnCall, parseJestFnCall } from '../utils';
import { createRule } from '../utils/createRule';

interface DescribeContext {
  describeTitles: string[];
  testTitles: string[];
}

const newDescribeContext = (): DescribeContext => ({
  describeTitles: [],
  testTitles: [],
});

export default createRule({
  name: 'no-identical-title',
  meta: {
    docs: {
      description: 'Verhindert identische Titel in derselben Jest-Test- oder Describe-Ebene.',
    },
    messages: {
      multipleTestTitle:
        "Bitte benenne deine Tests nicht gleich. Im schlimmsten Fall kann es vorkommen, dass Jest gleich benannte Tests nicht unterscheiden kann und unberechenbare Fehler entstehen können.",
      multipleDescribeTitle:
        "Bitte benenne deine Tests nicht gleich. Im schlimmsten Fall kann es vorkommen, dass Jest gleich benannte Tests nicht unterscheiden kann und unberechenbare Fehler entstehen können."
    },
    schema: [],
    type: 'suggestion',
  },
  defaultOptions: [],
  create(context) {
    const contexts = [newDescribeContext()];

    return {
      CallExpression(node) {
        const currentLayer = contexts[contexts.length - 1];

        const jestFnCall = parseJestFnCall(node, context);

        if (!jestFnCall) {
          return;
        }

        if (jestFnCall.type === 'describe') {
          contexts.push(newDescribeContext());
        }

        if (jestFnCall.members.find(s => isSupportedAccessor(s, 'each'))) {
          return;
        }

        const [argument] = node.arguments;

        if (!argument || !isStringNode(argument)) {
          return;
        }

        const title = getStringValue(argument);

        if (jestFnCall.type === 'test') {
          if (currentLayer.testTitles.includes(title)) {
            context.report({
              messageId: 'multipleTestTitle',
              node: argument,
            });
          }
          currentLayer.testTitles.push(title);
        }

        if (jestFnCall.type !== 'describe') {
          return;
        }
        if (currentLayer.describeTitles.includes(title)) {
          context.report({
            messageId: 'multipleDescribeTitle',
            node: argument,
          });
        }
        currentLayer.describeTitles.push(title);
      },
      'CallExpression:exit'(node) {
        if (isTypeOfJestFnCall(node, context, ['describe'])) {
          contexts.pop();
        }
      },
    };
  },
});
