import {
  getAccessorValue,
  replaceAccessorFixer,
} from '../utils'
import { createRule } from '../utils/createRule'
import { parseVitestFnCall } from '../utils/parse-vitest-fn-call'

const RULE_NAME = 'no-alias-methods'
export type MESSAGE_ID = 'noAliasMethods'
export type Options = []

export default createRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        'Verlangt die kanonischen Namen für Vitest-Matcher anstelle ihrer Alias-Methoden.',
      requiresTypeChecking: false,
    },
    messages: {
      noAliasMethods:
        `Verwende statt '{{ alias }}()' lieber die kanonische Methode '{{ canonical }}()'. Dadurch halten sich die Tests nach aktuellen Anweisungen der Vitest-Dokumentationen und lassen sich besser nachvollziehen.`,
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  create(context) {
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
    }

    return {
      CallExpression(node) {
        const vitestFnCall = parseVitestFnCall(node, context)

        if (vitestFnCall?.type !== 'expect') return

        const { matcher } = vitestFnCall

        const alias = getAccessorValue(matcher)

        if (alias in methodNames) {
          const canonical = methodNames[alias]

          context.report({
            messageId: 'noAliasMethods',
            data: { alias, canonical },
            node: matcher,
            fix: (fixer) => [replaceAccessorFixer(fixer, matcher, canonical)],
          })
        }
      },
    }
  },
})
