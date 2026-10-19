import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

export const isTokenASemicolon = (token: TSESTree.Token): boolean =>
  token.value === ';' && token.type === AST_TOKEN_TYPES.Punctuator;

export const areTokensOnSameLine = (
  left: TSESTree.Node | TSESTree.Token,
  right: TSESTree.Node | TSESTree.Token,
): boolean => left.loc.end.line === right.loc.start.line;

// We'll only verify nodes with these parent types
const STATEMENT_LIST_PARENTS = new Set([
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.BlockStatement,
  AST_NODE_TYPES.SwitchCase,
  AST_NODE_TYPES.SwitchStatement,
]);

export const isValidParent = (parentType: AST_NODE_TYPES): boolean => {
  return STATEMENT_LIST_PARENTS.has(parentType);
};

/**
 * Gets the actual last token.
 *
 * If a semicolon is semicolon-less style's semicolon, this ignores it.
 * For example:
 *
 *     foo()
 *     ;[1, 2, 3].forEach(bar)
 */
export const getActualLastToken = (
  sourceCode: TSESLint.SourceCode,
  node: TSESTree.Node,
): TSESTree.Token => {
  const semiToken = sourceCode.getLastToken(node)!;
  const prevToken = sourceCode.getTokenBefore(semiToken)!;
  const nextToken = sourceCode.getTokenAfter(semiToken);
  const isSemicolonLessStyle = Boolean(
    prevToken &&
    nextToken &&
    prevToken.range[0] >= node.range[0] &&
    isTokenASemicolon(semiToken) &&
    semiToken.loc.start.line !== prevToken.loc.end.line &&
    semiToken.loc.end.line === nextToken.loc.start.line,
  );

  return isSemicolonLessStyle ? prevToken : semiToken;
};

/**
 * Gets padding line sequences between the given 2 statements.
 * Comments are separators of the padding line sequences.
 */
export const getPaddingLineSequences = (
  prevNode: TSESTree.Node,
  nextNode: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): TSESTree.Token[][] => {
  const pairs: TSESTree.Token[][] = [];
  const includeComments = true;
  let prevToken = getActualLastToken(sourceCode, prevNode);

  if (nextNode.loc.start.line - prevToken.loc.end.line >= 2) {
    do {
      const token = sourceCode.getTokenAfter(prevToken, {
        includeComments,
      }) as TSESTree.Token;

      if (token.loc.start.line - prevToken.loc.end.line >= 2) {
        pairs.push([prevToken, token]);
      }

      prevToken = token;
    } while (prevToken.range[0] < nextNode.range[0]);
  }

  return pairs;
};

export type FunctionNode =
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression;

export type CodePath = TSESLint.CodePath;
export type Segment = TSESLint.CodePathSegment;

export function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
    return (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression
    );
}

/** Strips `!`, `as`, `satisfies`, `<T>x` and optional-chain wrappers. */
export function unwrap(node: TSESTree.Node): TSESTree.Node {
    let n = node;
    for (; ;) {
        switch (n.type) {
            case AST_NODE_TYPES.TSNonNullExpression:
            case AST_NODE_TYPES.TSAsExpression:
            case AST_NODE_TYPES.TSSatisfiesExpression:
            case AST_NODE_TYPES.TSTypeAssertion:
            case AST_NODE_TYPES.ChainExpression:
                n = n.expression;
                continue;
            default:
                return n;
        }
    }
}

/** `res.status(404).set(..).json(..)` -> the identifier `res`. */
export function rootIdentifier(node: TSESTree.Node): TSESTree.Identifier | null {
    let n = unwrap(node);
    for (; ;) {
        if (n.type === AST_NODE_TYPES.Identifier) return n;
        if (n.type === AST_NODE_TYPES.CallExpression) n = unwrap(n.callee);
        else if (n.type === AST_NODE_TYPES.MemberExpression) n = unwrap(n.object);
        else return null;
    }
}

export function memberName(node: TSESTree.MemberExpression): string | null {
    const p = node.property;
    if (!node.computed && p.type === AST_NODE_TYPES.Identifier) return p.name;
    if (p.type === AST_NODE_TYPES.Literal && typeof p.value === 'string') return p.value;
    return null;
}

export function paramName(param: TSESTree.Parameter): string | null {
    const p = param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;
    return p.type === AST_NODE_TYPES.Identifier ? p.name : null;
}

/** `req: Request`, `res: express.Response<Foo>`, `next: NextFunction` -> last type name. */
export function annotatedTypeName(param: TSESTree.Parameter): string | null {
    const p = param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;
    if (p.type !== AST_NODE_TYPES.Identifier) return null;
    const t = p.typeAnnotation?.typeAnnotation;
    if (t?.type !== AST_NODE_TYPES.TSTypeReference) return null;
    const n = t.typeName;
    if (n.type === AST_NODE_TYPES.Identifier) return n.name;
    if (n.type === AST_NODE_TYPES.TSQualifiedName) return n.right.name;
    return null;
}

/**
 * `res.sendStatus(400).send('x')`: name of a response method that is called earlier in
 * the same chain, in front of the final method of `callee`, or null.
 */
export function earlierResponseInChain(
  callee: TSESTree.MemberExpression,
  responseMethods: ReadonlySet<string>,
): string | null {
  let n: TSESTree.Node = unwrap(callee.object);
  while (n.type === AST_NODE_TYPES.CallExpression || n.type === AST_NODE_TYPES.MemberExpression) {
    if (n.type === AST_NODE_TYPES.MemberExpression) {
      n = unwrap(n.object);
      continue;
    }
    const c = unwrap(n.callee);
    if (c.type !== AST_NODE_TYPES.MemberExpression) return null;
    const m = memberName(c);
    if (m !== null && responseMethods.has(m)) return m;
    n = unwrap(c.object);
  }
  return null;
}

/** Is the node inside the `finally` block of a try statement (within the same function)? */
export function isInsideFinally(node: TSESTree.Node): boolean {
    let child: TSESTree.Node = node;
    let parent: TSESTree.Node | undefined = node.parent;
    while (parent && !isFunctionNode(parent)) {
        if (parent.type === AST_NODE_TYPES.TryStatement && parent.finalizer === child) return true;
        child = parent;
        parent = parent.parent;
    }
    return false;
}

/**
 * Closest enclosing statement of a call, or null when the call is itself returned
 * (`return res.json()`, `return a && next()`, `() => res.json()`).
 */
export function enclosingStatement(call: TSESTree.CallExpression): TSESTree.Node | null {
    let parent: TSESTree.Node | undefined = call.parent;
    while (parent) {
        if (parent.type === AST_NODE_TYPES.ReturnStatement || isFunctionNode(parent)) return null;
        if (parent.type.endsWith('Statement') || parent.type === AST_NODE_TYPES.VariableDeclaration) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}

/**
 * Is `stmt` directly followed by a `return`, or is it the last thing that can happen
 * in its function (nothing but the end of the function / empty join points follow)?
 * Climbs through if / else / try / catch / switch / labeled / plain blocks; loops and
 * try...finally mean "more code runs afterwards".
 */
export function isFollowedByReturnOrLast(stmt: TSESTree.Node): boolean {
    let s: TSESTree.Node = stmt;
    for (; ;) {
        const p: TSESTree.Node | undefined = s.parent;
        if (!p) return true;
        switch (p.type) {
            case AST_NODE_TYPES.BlockStatement:
            case AST_NODE_TYPES.StaticBlock:
            case AST_NODE_TYPES.Program: {
                const next = (p.body as TSESTree.Node[])[(p.body as TSESTree.Node[]).indexOf(s) + 1];
                if (next) return next.type === AST_NODE_TYPES.ReturnStatement;
                if (p.type !== AST_NODE_TYPES.BlockStatement) return true;
                s = p; // last statement of a block: continue with the block's own position
                continue;
            }
            case AST_NODE_TYPES.SwitchCase: {
                const sw = p.parent as TSESTree.SwitchStatement;
                const next = p.consequent[p.consequent.indexOf(s as TSESTree.Statement) + 1];
                if (next) {
                    if (next.type === AST_NODE_TYPES.ReturnStatement) return true;
                    if (next.type === AST_NODE_TYPES.BreakStatement && !next.label) {
                        s = sw; // `res.send(); break;` -> leaves the switch
                        continue;
                    }
                    return false;
                }
                if (sw.cases[sw.cases.length - 1] !== p) return false; // falls through into next case
                s = sw;
                continue;
            }
            case AST_NODE_TYPES.TryStatement:
                // code in `finally` runs after the try block / catch clause
                if (p.finalizer && s !== p.finalizer) return false;
                s = p;
                continue;
            case AST_NODE_TYPES.IfStatement:
            case AST_NODE_TYPES.LabeledStatement:
            case AST_NODE_TYPES.WithStatement:
            case AST_NODE_TYPES.CatchClause:
                s = p;
                continue;
            case AST_NODE_TYPES.ForStatement:
            case AST_NODE_TYPES.ForInStatement:
            case AST_NODE_TYPES.ForOfStatement:
            case AST_NODE_TYPES.WhileStatement:
            case AST_NODE_TYPES.DoWhileStatement:
                return false; // the loop continues with more iterations / code
            default:
                return true; // function boundary etc. -> nothing follows
        }
    }
}
