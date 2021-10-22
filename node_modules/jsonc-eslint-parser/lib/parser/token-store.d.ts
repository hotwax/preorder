import type { AST } from "eslint";
import type { SourceLocation } from "./ast";
export declare type MaybeNodeOrToken = {
    range?: [number, number];
    loc?: SourceLocation | null;
};
export declare class TokenStore {
    private readonly tokens;
    constructor(tokens: AST.Token[]);
    findIndexByOffset(offset: number): number;
    findTokenByOffset(offset: number): AST.Token | null;
    getFirstToken(nodeOrToken: MaybeNodeOrToken): AST.Token;
    getLastToken(nodeOrToken: MaybeNodeOrToken): AST.Token;
    getTokenBefore(nodeOrToken: MaybeNodeOrToken, filter?: (token: AST.Token) => boolean): AST.Token | null;
    getTokenAfter(nodeOrToken: MaybeNodeOrToken, filter?: (token: AST.Token) => boolean): AST.Token | null;
}
export declare function isComma(token: AST.Token): token is AST.Token & {
    type: "Punctuator";
    value: ",";
};
