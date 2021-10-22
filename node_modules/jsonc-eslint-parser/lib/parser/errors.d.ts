import type { Node } from "estree";
import type { TokenStore, MaybeNodeOrToken } from "./token-store";
import type { Comment } from "../types";
export declare class ParseError extends SyntaxError {
    index: number;
    lineNumber: number;
    column: number;
    static normalize(x: any): ParseError | null;
    constructor(message: string, offset: number, line: number, column: number);
    static isParseError(x: any): x is ParseError;
}
export declare function throwEmptyError(expected: string): never;
export declare function throwExpectedTokenError(name: string, beforeToken: MaybeNodeOrToken): never;
export declare function throwUnexpectedError(name: string, token: MaybeNodeOrToken): never;
export declare function throwUnexpectedTokenError(name: string, token: MaybeNodeOrToken): never;
export declare function throwUnexpectedCommentError(token: Comment): never;
export declare function throwUnexpectedSpaceError(beforeToken: MaybeNodeOrToken): never;
export declare function throwInvalidNumberError(text: string, token: MaybeNodeOrToken): never;
export declare function throwUnexpectedNodeError(node: Node, tokens: TokenStore, offset?: number): never;
export declare function throwErrorAsAdjustingOutsideOfCode(err: any, code: string): never;
