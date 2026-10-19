/* eslint-disable eslint-plugin/require-meta-schema-description */

/**
 * valid-express-endpoint
 *
 * Reports Express handlers / middleware in which at least one control-flow path
 * can reach the end of the function (or a bare `return`) without
 *   - sending a response (res.send / res.json / res.status(...).json / ...), or
 *   - handing control on via next(...).
 *
 * Built on ESLint's official code path analysis events:
 *   onCodePathStart / onCodePathEnd
 *   onCodePathSegmentStart / onCodePathSegmentEnd
 *   onUnreachableCodePathSegmentStart / onUnreachableCodePathSegmentEnd
 * https://eslint.org/docs/latest/extend/code-path-analysis
 *
 * Strategy
 *   1. While walking a function, remember which code path segments contain a
 *      "terminating" call (collected on `CallExpression:exit`, i.e. after the
 *      arguments were evaluated and after ESLint forked the try/catch path).
 *   2. On `onCodePathEnd`, walk the segment graph from `initialSegment` without
 *      ever stepping *through* a terminating segment. If that walk reaches one
 *      of `codePath.returnedSegments`, there is a path that leaves the handler
 *      without terminating -> report it.
 *   (always on)  missingBlockStatement: a handler must have a block body, never an
 *                expression body (`(req, res) => res.send()`).
 *   (always on)  finallyHasSend: a `finally` block must not call res.<method>() / next().
 *   (optional)   requireReturn: every direct `res.<method>()` / `next()` call must be
 *   followed by a `return` (or be `return`ed itself), unless it is the last thing
 *   that can happen in the function. Calls in unreachable segments (i.e. after a
 *   `return`) are not checked, which comes straight from the code path analysis.
 *   `thrownSegments` are intentionally ignored: Express catches sync throws
 *   (and Express 5 also rejected promises) and forwards them to the error handler.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import {
    annotatedTypeName,
    CodePath,
    earlierResponseInChain,
    enclosingStatement,
    FunctionNode,
    isFollowedByReturnOrLast,
    isFunctionNode,
    isInsideFinally,
    memberName,
    paramName,
    rootIdentifier,
    Segment,
    unwrap
} from '../utils/ast-utils';
import { Frame, HandlerInfo } from '../../interfaces/express-helper-interfaces';

export type Options = [
    {
        /** Methods on `res` that end the response. */
        responseMethods?: string[];
        /** Parameter names recognised as the response object. */
        responseParamNames?: string[];
        /** Parameter names recognised as the request object. */
        requestParamNames?: string[];
        /** Parameter names recognised as the next function. */
        nextParamNames?: string[];
        /**
         * Treat passing `res` or `next` as an argument (e.g. `stream.pipe(res)`,
         * `promise.catch(next)`, `delegate(req, res)`) as handing the request off.
         */
        allowDelegation?: boolean;
        /**
         * Treat a terminating call inside a nested callback (e.g.
         * `db.query(q, (e, rows) => res.json(rows))`) as terminating the
         * enclosing handler path where the callback was created.
         */
        allowDeferredCallbacks?: boolean;
        /**
         * Require `return res.json()` / `return next()` (or a `return;` right after the
         * call) for every direct response / next() call, except when the call is the
         * last thing that happens in the function. Default: true.
         */
        requireReturn?: boolean;
    },
];

export type MessageIds =
    | 'missingTerminationAtReturn'
    | 'missingTerminationAtEnd'
    | 'missingReturn'
    | 'missingBlockStatement'
    | 'finallyHasSend'
    | 'multipleSendInChain'

const DEFAULTS: Required<Options[0]> = {
    responseMethods: [
        'send',
        'json',
        'jsonp',
        'end',
        'redirect',
        'render',
        'sendFile',
        'sendStatus',
        'download',
    ],
    responseParamNames: ['res', 'response'],
    requestParamNames: ['req', 'request'],
    nextParamNames: ['next', '_next'],
    allowDelegation: true,
    allowDeferredCallbacks: true,
    requireReturn: true,
};

// ----------------------------------------------------------------------- rule

export const validExpressEndpoint = createRule<Options, MessageIds>({
    name: 'valid-express-endpoint',
    meta: {
        type: 'problem',
        docs: {
            description:
                'Jeder Express Route-Handler muss entweder mit einer Response oder einem Aufruf der nächsten Middleware abgeschlossen werden',
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    responseMethods: { type: 'array', items: { type: 'string' } },
                    responseParamNames: { type: 'array', items: { type: 'string' } },
                    requestParamNames: { type: 'array', items: { type: 'string' } },
                    nextParamNames: { type: 'array', items: { type: 'string' } },
                    allowDelegation: { type: 'boolean' },
                    allowDeferredCallbacks: { type: 'boolean' },
                    requireReturn: { type: 'boolean' },
                },
            },
        ],
        defaultOptions: [DEFAULTS],
        messages: {
            missingBlockStatement:
                'Ein Express-Handler muss einen Block-Body haben ({ ... }), keine One-Liner mit nur einer Expression.',
            finallyHasSend:
                '{{call}} darf nicht in einem Finally-Block aufgerufen werden. Finally ist nur fürs Aufräumen gedacht, während Try und Catch die Response behandeln sollen',
            missingReturn:
                '{{call}} muss mit einem Return-Statement gefolgt werden (nach `{{call}}` muss `return;` in die darunter liegende Zeile).',
            missingTerminationAtReturn:
                'Dieses Return-Statement verlässt den Route-Handler ohne eine Response zu versenden oder NextFunction aufzurufen. Stelle sicher, dass du bei jedem Codepfad dem Client immer eine Antwort sendest.',
            missingTerminationAtEnd:
                'Nicht jeder Codepfad endet mit einer Response oder dem Aufruf von NextFunction. Stelle sicher, dass du bei jedem Codepfad dem Client immer eine Antwort sendest.',
            multipleSendInChain:
                '{{second}} folgt nach {{first}} in der selben Call-Chain, so wird {{first}} gesendet und der nachfolgende {{second}} erzeugt einen Fehler, da nur einmal eine Response versendet werden kann. Versende immer nur exakt eine Response in einer Call-Chain.',
        },
    },

    create(context, [userOptions]) {
        const o = { ...DEFAULTS, ...userOptions };
        const responseMethods = new Set(o.responseMethods);

        let frame: Frame | null = null; // top of the code path stack

        // ------------------------------------------------------ handler detection

        const looksLike = (
            param: TSESTree.Parameter,
            names: string[],
            typeName: string,
        ): boolean => {
            const name = paramName(param);
            return (name !== null && names.includes(name)) || annotatedTypeName(param) === typeName;
        };

        /** Recognises (req, res), (req, res, next) and (err, req, res, next). */
        const detectHandler = (fn: FunctionNode): HandlerInfo | null => {
            const ps = fn.params;
            for (let i = 1; i < ps.length; i++) {
                const resName = paramName(ps[i]);
                if (resName === null) continue;
                if (!looksLike(ps[i], o.responseParamNames, 'Response')) continue;

                const prevIsReq = looksLike(ps[i - 1], o.requestParamNames, 'Request');
                const nextParam = ps[i + 1] as TSESTree.Parameter | undefined;
                const nextIsNext =
                    nextParam !== undefined && looksLike(nextParam, o.nextParamNames, 'NextFunction');

                // Requiring a neighbour avoids false positives on callbacks like (err, res) => ...
                if (prevIsReq || nextIsNext) {
                    return { resName, nextName: nextIsNext ? paramName(nextParam) : null };
                }
            }
            return null;
        };

        // ------------------------------------------------- terminating-call check

        /**
         * `direct`    : next(...) or res.<method>(...)  -> terminates, may require a return
         * `delegated` : res / next passed as an argument -> terminates, never needs a return
         */
        const classifyCall = (
            call: TSESTree.CallExpression,
            h: HandlerInfo,
        ): { kind: 'direct' | 'delegated'; label: string } | null => {
            const callee = unwrap(call.callee);

            // next(...)
            if (h.nextName && callee.type === AST_NODE_TYPES.Identifier && callee.name === h.nextName) {
                return { kind: 'direct', label: `${h.nextName}()` };
            }

            // res.json(...), res.status(201).send(...), res.set(..).end()
            if (callee.type === AST_NODE_TYPES.MemberExpression) {
                const method = memberName(callee);
                if (method !== null && responseMethods.has(method)) {
                    if (rootIdentifier(callee.object)?.name === h.resName) {
                        return { kind: 'direct', label: `${h.resName}.${method}()` };
                    }
                }
            }

            // stream.pipe(res), promise.catch(next), delegate(req, res, next)
            if (o.allowDelegation) {
                const delegated = call.arguments.some((arg) => {
                    const a = unwrap(arg);
                    return (
                        a.type === AST_NODE_TYPES.Identifier &&
                        (a.name === h.resName || a.name === h.nextName)
                    );
                });
                if (delegated) return { kind: 'delegated', label: 'call' };
            }
            return null;
        };

        // ------------------------------------------------------------- reporting

        const analyse = (codePath: CodePath, f: Frame): void => {
            const fn = f.node as FunctionNode;
            const returned = new Set<Segment>(codePath.returnedSegments);
            const seen = new Set<Segment>();
            const work: Segment[] = [];
            const offending: Segment[] = [];

            if (!f.terminating.has(codePath.initialSegment)) {
                seen.add(codePath.initialSegment);
                work.push(codePath.initialSegment);
            }

            // Every segment reached here has a path from the start that has NOT yet
            // responded / called next(). If it is also a returned segment -> violation.
            while (work.length > 0) {
                const seg = work.pop() as Segment;
                if (returned.has(seg)) offending.push(seg);
                for (const nxt of seg.nextSegments) {
                    if (!seen.has(nxt) && !f.terminating.has(nxt)) {
                        seen.add(nxt);
                        work.push(nxt);
                    }
                }
            }

            const reported = new Set<string>();
            for (const seg of offending) {
                const endNode = f.returnNodes.get(seg);
                if (endNode) {
                    const key = `r:${endNode.range[0]}`;
                    if (reported.has(key)) continue;
                    reported.add(key);
                    context.report({ node: endNode, messageId: 'missingTerminationAtReturn' });
                } else {
                    if (reported.has('end')) continue;
                    reported.add('end');
                    const body = fn.body;
                    if (body.type === AST_NODE_TYPES.BlockStatement) {
                        // point at the closing brace
                        context.report({
                            loc: {
                                start: { line: body.loc.end.line, column: body.loc.end.column - 1 },
                                end: body.loc.end,
                            },
                            messageId: 'missingTerminationAtEnd',
                        });
                    } else {
                        context.report({ node: body, messageId: 'missingTerminationAtEnd' });
                    }
                }
            }
        };

        // ------------------------------------------------------ segment bookkeeping

        const segmentStart = (segment: Segment): void => {
            frame?.current.add(segment);
        };
        const segmentEnd = (segment: Segment): void => {
            frame?.current.delete(segment);
        };

        // ESLint reports segment ends lazily (the node passed to onCodePathSegmentEnd is
        // *not* the ReturnStatement), so the return statement is associated with the
        // segments that are current while it is visited.
        const rememberReturn = (node: TSESTree.ReturnStatement): void => {
            if (!frame) return;
            for (const seg of frame.current) {
                if (!frame.returnNodes.has(seg)) frame.returnNodes.set(seg, node);
            }
        };

        const listener = {
            onCodePathStart(_codePath: CodePath, node: TSESTree.Node) {
                frame = {
                    parent: frame,
                    node,
                    handler: isFunctionNode(node) ? detectHandler(node) : null,
                    current: new Set(),
                    creationSegments: new Set(frame?.current ?? []),
                    terminating: new Set(),
                    returnNodes: new Map(),
                };

                // A handler must not be a one-liner: `(req, res) => res.send()` is rejected.
                if (
                    frame.handler &&
                    node.type === AST_NODE_TYPES.ArrowFunctionExpression &&
                    node.body.type !== AST_NODE_TYPES.BlockStatement
                ) {
                    context.report({ node: node.body, messageId: 'missingBlockStatement' });
                }
            },

            onCodePathEnd(codePath: CodePath) {
                const finished = frame as Frame;
                frame = finished.parent;
                if (finished.handler) analyse(codePath, finished);
            },

            onCodePathSegmentStart: segmentStart,
            onCodePathSegmentEnd: segmentEnd,
            onUnreachableCodePathSegmentStart: segmentStart,
            onUnreachableCodePathSegmentEnd: segmentEnd,

            ReturnStatement: rememberReturn,
            'ReturnStatement:exit': rememberReturn,

            // `:exit` -> arguments are evaluated and the try/catch fork (which ESLint
            // creates at the callee's MemberExpression) is already in place, so a
            // `try { res.json() } catch {}` catch path is not wrongly counted as terminated.
            'CallExpression:exit'(call: TSESTree.CallExpression) {
                if (!frame) return;

                // nearest enclosing Express handler (callbacks inside it are not handlers themselves)
                let owner: Frame | null = frame;
                while (owner && !owner.handler) owner = owner.parent;
                if (!owner?.handler) return;
                const hit = classifyCall(call, owner.handler);
                if (!hit) return;

                // double send in one chain: res.sendStatus(400).send('x')
                if (hit.kind === 'direct') {
                    const callee = unwrap(call.callee);
                    if (callee.type === AST_NODE_TYPES.MemberExpression) {
                        const method = memberName(callee);
                        const earlier =
                            method !== null && responseMethods.has(method)
                                ? earlierResponseInChain(callee, responseMethods)
                                : null;
                        if (earlier !== null) {
                            context.report({
                                node: callee,
                                messageId: 'multipleSendInChain',
                                data: { first: `${owner.handler.resName}.${earlier}()`, second: hit.label },
                            });
                        }
                    }
                }

                // finally blocks must never respond / call next()
                if (hit.kind === 'direct' && isInsideFinally(call)) {
                    context.report({
                        node: call,
                        messageId: 'finallyHasSend',
                        data: { call: hit.label },
                    });
                }

                // requireReturn: skip calls in unreachable segments (code after a `return`).
                if (
                    o.requireReturn &&
                    hit.kind === 'direct' &&
                    [...frame.current].some((seg) => seg.reachable)
                ) {
                    const stmt = enclosingStatement(call);
                    if (stmt && !isFollowedByReturnOrLast(stmt)) {
                        context.report({
                            node: call,
                            messageId: 'missingReturn',
                            data: { call: hit.label },
                        });
                    }
                }

                let f: Frame = frame;
                let segs: Segment[] = [...f.current];
                for (; ;) {
                    for (const s of segs) f.terminating.add(s);
                    if (f === owner || !f.parent || !o.allowDeferredCallbacks) break;
                    // propagate to where the callback was created in the parent function
                    segs = [...f.creationSegments];
                    f = f.parent;
                }
            },
        };

        // typescript-eslint's RuleListener type does not declare the onCodePath* events.
        return listener as unknown as TSESLint.RuleListener;
    },
});

export default validExpressEndpoint;