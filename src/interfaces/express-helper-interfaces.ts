import { TSESTree } from "@typescript-eslint/utils";
import { Segment } from "../rules/utils/ast-utils";
export interface HandlerInfo {
    resName: string;
    nextName: string | null;
}

export interface Frame {
    parent: Frame | null;
    handler: HandlerInfo | null;
    node: TSESTree.Node;
    /** Segments that are "current" right now (several inside try/finally). */
    current: Set<Segment>;
    /** Segments of the parent that were current when this function was created. */
    creationSegments: Set<Segment>;
    /** Segments that contain a response / next() call. */
    terminating: Set<Segment>;
    /** Explicit `return` statement that ends a segment (absent for falling off the end). */
    returnNodes: Map<Segment, TSESTree.ReturnStatement>;
}