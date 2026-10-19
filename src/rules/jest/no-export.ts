import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { isTypeOfJestFnCall } from '../utils';
import { createRule } from '../utils/createRule';

export default createRule({
  name: 'no-export',
  meta: {
    docs: {
      description: 'Disallow using `exports` in files containing tests',
    },
    messages: {
      unexpectedExport: "Bitte exportiere keine Funktionen oder Variablen aus deinen Testdateien. Das Problem ist, dass beim Importieren von Testdateien die Tests erneut von Jest registriert werden und dadurch inkonsistente Ergebnisse entstehen können. Wenn du Helfer-Funktionen innerhalb deiner Testdateien verwenden möchtest, solltest du diese in eine eigenständige TS-Dateien implementieren, wie bspw. 'userHelper.ts'."
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const exportNodes: Array<
      | TSESTree.ExportNamedDeclaration
      | TSESTree.ExportDefaultDeclaration
      | TSESTree.TSExportAssignment
      | TSESTree.MemberExpression
    > = [];
    let hasTestCase = false;

    return {
      'Program:exit'() {
        if (hasTestCase && exportNodes.length > 0) {
          for (const node of exportNodes) {
            context.report({ node, messageId: 'unexpectedExport' });
          }
        }
      },

      CallExpression(node) {
        if (isTypeOfJestFnCall(node, context, ['test'])) {
          hasTestCase = true;
        }
      },
      'ExportNamedDeclaration, ExportDefaultDeclaration, TSExportAssignment'(
        node:
          | TSESTree.ExportNamedDeclaration
          | TSESTree.ExportDefaultDeclaration
          | TSESTree.TSExportAssignment,
      ) {
        exportNodes.push(node);
      },
      'AssignmentExpression > MemberExpression'(
        node: TSESTree.MemberExpression,
      ) {
        let { object, property } = node;

        if (object.type === AST_NODE_TYPES.MemberExpression) {
          ({ object, property } = object);
        }

        if (
          'name' in object &&
          object.name === 'module' &&
          property.type === AST_NODE_TYPES.Identifier &&
          /^exports?$/u.test(property.name)
        ) {
          exportNodes.push(node);
        }
      },
    };
  },
});
