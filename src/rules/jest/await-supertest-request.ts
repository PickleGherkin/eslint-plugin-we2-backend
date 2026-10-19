/**
 * await-supertest-request
 *
 * Every HTTP request made with a supertest client has to be awaited right away:
 *
 *   const testee = supertest(app);                // <- client
 *   const response = testee.post('/users');       // <- reported, must be awaited right away
 *
 * How it works
 *   1. A "client" is the result of calling the supertest factory (default import,
 *      namespace import, require('supertest') or `import { agent }`) or `<factory>.agent(app)`.
 *      Variables are resolved with ESLint's scope manager, so shadowed names, aliases
 *      (`const request = supertest`) and clients assigned later (`let testee; testee = ...`)
 *      are handled correctly.
 *   2. A "request" is `<client>.<httpMethod>(...)`, e.g. `testee.post('/users')`.
 *   3. The request chain (`.send().set().expect()...`) is followed up to its outermost call.
 *      That outermost call has to be the argument of an `await`.
 */
import {
    ASTUtils,
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from '@typescript-eslint/utils';
import { unwrap } from '../utils/ast-utils';
import { createRule } from '../utils/createRule';

type Variable = TSESLint.Scope.Variable;

export type Options = [
    {
        /**
         * Allow the callback style, which does not need an await:
         * `.end((err, res) => ...)`, `.expect(200, done)`. Default: true.
         */
        allowCallbackStyle?: boolean;
        /**
         * Allow returning the request (`return testee.get('/')`,
         * `it('...', () => testee.get('/'))`) instead of awaiting it. Default: false.
         */
        allowReturn?: boolean;
    },
];
export type MessageIds = 'notAwaited' | 'assignedWithoutAwait';

const DEFAULTS: Required<Options[0]> = {
    allowCallbackStyle: true,
    allowReturn: false,
};

const HTTP_METHODS = new Set([
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'del',
    'head',
    'options',
    'trace',
    'connect',
    'search',
]);

// ---------------------------------------------------------------- AST helpers

function memberName(node: TSESTree.MemberExpression): string | null {
    const p = node.property;
    if (!node.computed && p.type === AST_NODE_TYPES.Identifier) return p.name;
    if (p.type === AST_NODE_TYPES.Literal && typeof p.value === 'string') return p.value;
    return null;
}

// FIXME: Use TypeChecker instead of this...
function isSupertestImport(node: TSESTree.Node | undefined): boolean {
    return node?.type === AST_NODE_TYPES.ImportDeclaration && node.source.value === 'supertest';
}

function isRequireSupertest(node: TSESTree.Node): boolean {
    const n = unwrap(node);
    if (n.type !== AST_NODE_TYPES.CallExpression) return false;
    const callee = unwrap(n.callee);
    const arg = n.arguments[0] as TSESTree.Node | undefined;
    return (
        callee.type === AST_NODE_TYPES.Identifier &&
        callee.name === 'require' &&
        arg?.type === AST_NODE_TYPES.Literal &&
        arg.value === 'supertest'
    );
}

// ----------------------------------------------------------------------- rule

export const awaitSupertestRequest = createRule<Options, MessageIds>({
    name: 'await-supertest-request',
    meta: {
        type: 'problem',
        docs: {
            description: 'Verlangt, dass jede supertest-Anfrage direkt mit await abgewartet wird',
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    allowCallbackStyle: { type: 'boolean' },
                    allowReturn: { type: 'boolean' },
                },
            },
        ],
        messages: {
            notAwaited:
                'Die supertest-Anfrage "{{request}}" wird nicht mit "await" abgewartet. ' +
                'Der Supertest-Client sendet die Anfrage erst, wenn das Ergebnis mit "await", "then()" oder "end()" verarbeitet wird. ' +
                'Ohne "await" läuft der Test weiter, bevor die Antwort da ist, und die Prüfungen aus "expect()" werden nicht oder erst nach dem Testende ausgeführt. ' +
                'Schreibe "await {{request}}" und werte die Antwort danach aus.',
            assignedWithoutAwait:
                'Die supertest-Anfrage "{{request}}" wird "{{variable}}" zugewiesen, ohne sie direkt abzuwarten. ' +
                'In "{{variable}}" steht dann nur das Test-Objekt der noch nicht abgeschlossenen Anfrage und nicht die Antwort. ' +
                'Zugriffe wie "{{variable}}.status" oder "{{variable}}.body" liefern undefined, und ein späteres "await" ändert nichts daran, wenn dazwischen schon auf die Antwort zugegriffen wird. ' +
                'Warte die Anfrage sofort ab: "const {{variable}} = await {{request}}".',
        },
        defaultOptions: [DEFAULTS],
    },

    create(context, [userOptions]) {
        const o = { ...DEFAULTS, ...userOptions };
        const sourceCode = context.sourceCode;

        const resolve = (id: TSESTree.Identifier): Variable | null =>
            ASTUtils.findVariable(sourceCode.getScope(id), id);

        // ------------------------------------------------------- supertest detection

        /** 'factory' = supertest(app), 'agent' = agent(app); null = not supertest. */
        const factoryKind = (
            id: TSESTree.Identifier,
            seen = new Set<Variable>(),
        ): 'factory' | 'agent' | null => {
            const variable = resolve(id);
            if (!variable || seen.has(variable)) return null;
            seen.add(variable);

            for (const def of variable.defs) {
                const node = def.node as TSESTree.Node;
                if (
                    (node.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
                        node.type === AST_NODE_TYPES.ImportNamespaceSpecifier) &&
                    isSupertestImport(node.parent)
                ) {
                    return 'factory';
                }
                if (node.type === AST_NODE_TYPES.ImportSpecifier && isSupertestImport(node.parent)) {
                    const imported = node.imported;
                    const name = imported.type === AST_NODE_TYPES.Identifier ? imported.name : imported.value;
                    if (name === 'agent') return 'agent';
                    if (name === 'default') return 'factory';
                }
                if (
                    node.type === AST_NODE_TYPES.TSImportEqualsDeclaration &&
                    node.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference &&
                    node.moduleReference.expression.type === AST_NODE_TYPES.Literal &&
                    node.moduleReference.expression.value === 'supertest'
                ) {
                    return 'factory';
                }
            }

            for (const ref of variable.references) {
                if (!ref.isWrite() || !ref.writeExpr) continue;
                // `const { agent } = require('supertest')` is a destructuring -> not handled
                const parent = ref.identifier.parent;
                const plainBinding =
                    (parent.type === AST_NODE_TYPES.VariableDeclarator && parent.id === ref.identifier) ||
                    (parent.type === AST_NODE_TYPES.AssignmentExpression && parent.left === ref.identifier);
                if (!plainBinding) continue;

                if (isRequireSupertest(ref.writeExpr)) return 'factory';
                const written = unwrap(ref.writeExpr);
                // alias: const request = supertest;
                if (written.type === AST_NODE_TYPES.Identifier) {
                    const kind = factoryKind(written, seen);
                    if (kind) return kind;
                }
            }
            return null;
        };

        /** Result of supertest(app) / supertest.agent(app) / agent(app), or a variable holding one. */
        const isClient = (expr: TSESTree.Node, seen = new Set<Variable>()): boolean => {
            const e = unwrap(expr);

            if (e.type === AST_NODE_TYPES.CallExpression) {
                const callee = unwrap(e.callee);
                if (callee.type === AST_NODE_TYPES.Identifier) return factoryKind(callee) !== null;
                if (callee.type === AST_NODE_TYPES.MemberExpression && memberName(callee) === 'agent') {
                    const obj = unwrap(callee.object);
                    return obj.type === AST_NODE_TYPES.Identifier && factoryKind(obj) === 'factory';
                }
                return false;
            }

            if (e.type === AST_NODE_TYPES.Identifier) {
                const variable = resolve(e);
                if (!variable || seen.has(variable)) return false;
                seen.add(variable);
                return variable.references.some(
                    (ref) => ref.isWrite() && ref.writeExpr != null && isClient(ref.writeExpr, seen),
                );
            }
            return false;
        };

        // -------------------------------------------------------------- chain helpers

        /** `.end(...)` or `.expect(200, done)` / `.expect(200, () => ...)` consume the request themselves. */
        const isCallbackCall = (call: TSESTree.CallExpression): boolean => {
            const callee = unwrap(call.callee);
            if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;
            const name = memberName(callee);
            if (name === 'end') return true;
            if (name === 'expect' && call.arguments.length >= 2) {
                const last = unwrap(call.arguments[call.arguments.length - 1]);
                return (
                    last.type === AST_NODE_TYPES.ArrowFunctionExpression ||
                    last.type === AST_NODE_TYPES.FunctionExpression ||
                    (last.type === AST_NODE_TYPES.Identifier && last.name === 'done')
                );
            }
            return false;
        };

        const assignedName = (parent: TSESTree.Node): string => {
            const target =
                parent.type === AST_NODE_TYPES.VariableDeclarator
                    ? parent.id
                    : parent.type === AST_NODE_TYPES.AssignmentExpression
                        ? parent.left
                        : null;
            return target?.type === AST_NODE_TYPES.Identifier ? target.name : 'response';
        };

        // ------------------------------------------------------------------ listener

        return {
            CallExpression(root) {
                const rootCallee = unwrap(root.callee);
                if (rootCallee.type !== AST_NODE_TYPES.MemberExpression) return;
                const method = memberName(rootCallee);
                if (method === null || !HTTP_METHODS.has(method)) return;
                if (!isClient(rootCallee.object)) return;

                // follow the chain .send().set().expect() up to its outermost call
                let top: TSESTree.Node = root;
                const chain: TSESTree.CallExpression[] = [root];
                for (; ;) {
                    const member: TSESTree.Node | undefined = top.parent;
                    const call: TSESTree.Node | undefined = member?.parent;
                    if (
                        member?.type === AST_NODE_TYPES.MemberExpression &&
                        member.object === top &&
                        call?.type === AST_NODE_TYPES.CallExpression &&
                        call.callee === member
                    ) {
                        top = call;
                        chain.push(call);
                    } else {
                        break;
                    }
                }

                if (o.allowCallbackStyle && chain.some(isCallbackCall)) return;

                const parent = top.parent;
                if (!parent) return;
                if (parent.type === AST_NODE_TYPES.AwaitExpression) return;
                if (
                    o.allowReturn &&
                    (parent.type === AST_NODE_TYPES.ReturnStatement ||
                        (parent.type === AST_NODE_TYPES.ArrowFunctionExpression && parent.body === top))
                ) {
                    return;
                }

                const request = `${sourceCode.getText(rootCallee)}(...)`;
                const assigned =
                    (parent.type === AST_NODE_TYPES.VariableDeclarator && parent.init === top) ||
                    (parent.type === AST_NODE_TYPES.AssignmentExpression && parent.right === top);

                if (assigned) {
                    context.report({
                        node: top,
                        messageId: 'assignedWithoutAwait',
                        data: { request, variable: assignedName(parent) },
                    });
                } else {
                    context.report({ node: top, messageId: 'notAwaited', data: { request } });
                }
            },
        };
    },
});

export default awaitSupertestRequest;