import { getAccessorValue, parseJestFnCall, replaceAccessorFixer } from '../utils';
import { createRule } from '../utils/createRule';

export default createRule({
  name: 'no-alias-methods',
  meta: {
    docs: {
      description: 'Verlangt die kanonischen Namen für Jest-Matcher anstelle ihrer Alias-Methoden.',
    },
    messages: {
      replaceAlias: `Verwende statt '{{ alias }}()' lieber die kanonische Methode '{{ canonical }}()'. Dadurch halten sich die Tests nach aktuellen Anweisungen der Jest-Dokumentationen und lassen sich besser nachvollziehen.`,
    },
    fixable: 'code',
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // map of jest matcher aliases & their canonical names
    const methodNames: Record<string, string> = {
      toBeCalled: 'toHaveBeenCalled',
      toBeCalledTimes: 'toHaveBeenCalledTimes',
      toBeCalledWith: 'toHaveBeenCalledWith',
      lastCalledWith: 'toHaveBeenLastCalledWith',
      nthCalledWith: 'toHaveBeenNthCalledWith',
      toReturn: 'toHaveReturned',
      toReturnTimes: 'toHaveReturnedTimes',
      toReturnWith: 'toHaveReturnedWith',
      lastReturnedWith: 'toHaveLastReturnedWith',
      nthReturnedWith: 'toHaveNthReturnedWith',
      toThrowError: 'toThrow',
    };

    return {
      CallExpression(node) {
        const jestFnCall = parseJestFnCall(node, context);

        if (jestFnCall?.type !== 'expect') {
          return;
        }

        const { matcher } = jestFnCall;

        const alias = getAccessorValue(matcher);

        if (alias in methodNames) {
          const canonical = methodNames[alias];

          context.report({
            messageId: 'replaceAlias',
            data: { alias, canonical },
            node: matcher,
            fix: fixer => [replaceAccessorFixer(fixer, matcher, canonical)],
          });
        }
      },
    };
  },
});
