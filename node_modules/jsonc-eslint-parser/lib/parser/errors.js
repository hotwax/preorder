"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwErrorAsAdjustingOutsideOfCode = exports.throwUnexpectedNodeError = exports.throwInvalidNumberError = exports.throwUnexpectedSpaceError = exports.throwUnexpectedCommentError = exports.throwUnexpectedTokenError = exports.throwUnexpectedError = exports.throwExpectedTokenError = exports.throwEmptyError = exports.ParseError = void 0;
const convert_1 = require("./convert");
class ParseError extends SyntaxError {
    constructor(message, offset, line, column) {
        super(message);
        this.index = offset;
        this.lineNumber = line;
        this.column = column;
    }
    static normalize(x) {
        if (ParseError.isParseError(x)) {
            return x;
        }
        if (isAcornStyleParseError(x)) {
            return new ParseError(x.message, x.pos, x.loc.line, x.loc.column);
        }
        return null;
    }
    static isParseError(x) {
        return (x instanceof ParseError ||
            (typeof x.message === "string" &&
                typeof x.index === "number" &&
                typeof x.lineNumber === "number" &&
                typeof x.column === "number"));
    }
}
exports.ParseError = ParseError;
function throwEmptyError(expected) {
    const err = new ParseError(`Expected to be ${expected}, but got empty.`, 0, 1, 1);
    throw err;
}
exports.throwEmptyError = throwEmptyError;
function throwExpectedTokenError(name, beforeToken) {
    const locs = convert_1.getFixLocation(beforeToken);
    const err = new ParseError(`Expected token '${name}'.`, locs.range[1], locs.loc.end.line, locs.loc.end.column + 1);
    throw err;
}
exports.throwExpectedTokenError = throwExpectedTokenError;
function throwUnexpectedError(name, token) {
    const locs = convert_1.getFixLocation(token);
    const err = new ParseError(`Unexpected ${name}.`, locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
    throw err;
}
exports.throwUnexpectedError = throwUnexpectedError;
function throwUnexpectedTokenError(name, token) {
    return throwUnexpectedError(`token '${name}'`, token);
}
exports.throwUnexpectedTokenError = throwUnexpectedTokenError;
function throwUnexpectedCommentError(token) {
    return throwUnexpectedError("comment", token);
}
exports.throwUnexpectedCommentError = throwUnexpectedCommentError;
function throwUnexpectedSpaceError(beforeToken) {
    const locs = convert_1.getFixLocation(beforeToken);
    const err = new ParseError("Unexpected whitespace.", locs.range[1], locs.loc.end.line, locs.loc.end.column + 1);
    throw err;
}
exports.throwUnexpectedSpaceError = throwUnexpectedSpaceError;
function throwInvalidNumberError(text, token) {
    const locs = convert_1.getFixLocation(token);
    const err = new ParseError(`Invalid number ${text}.`, locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
    throw err;
}
exports.throwInvalidNumberError = throwInvalidNumberError;
function throwUnexpectedNodeError(node, tokens, offset) {
    if (node.type === "Identifier") {
        const locs = convert_1.getFixLocation(node);
        const err = new ParseError(`Unexpected identifier '${node.name}'.`, locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
        throw err;
    }
    if (node.type === "Literal") {
        const type = node.bigint
            ? "bigint"
            : node.regex
                ? "regex"
                : node.value === null
                    ? "null"
                    : typeof node.value;
        const locs = convert_1.getFixLocation(node);
        const err = new ParseError(`Unexpected ${type} literal.`, locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
        throw err;
    }
    if (node.type === "TemplateLiteral") {
        const locs = convert_1.getFixLocation(node);
        const err = new ParseError("Unexpected template literal.", locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
        throw err;
    }
    if (node.type.endsWith("Expression") &&
        node.type !== "FunctionExpression") {
        const name = node.type.replace(/\B([A-Z])/gu, " $1").toLowerCase();
        const locs = convert_1.getFixLocation(node);
        const err = new ParseError(`Unexpected ${name}.`, locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
        throw err;
    }
    const index = node.range[0] + (offset || 0);
    const t = tokens.findTokenByOffset(index);
    const name = (t === null || t === void 0 ? void 0 : t.value) || "unknown";
    const locs = convert_1.getFixLocation(t || node);
    const err = new ParseError(`Unexpected token '${name}'.`, locs.range[0], locs.loc.start.line, locs.loc.start.column + 1);
    throw err;
}
exports.throwUnexpectedNodeError = throwUnexpectedNodeError;
function throwErrorAsAdjustingOutsideOfCode(err, code) {
    if (ParseError.isParseError(err)) {
        const endOffset = code.length;
        if (err.index >= endOffset) {
            err.message = "Unexpected end of expression.";
        }
    }
    throw err;
}
exports.throwErrorAsAdjustingOutsideOfCode = throwErrorAsAdjustingOutsideOfCode;
function isAcornStyleParseError(x) {
    return (typeof x.message === "string" &&
        typeof x.pos === "number" &&
        typeof x.loc === "object" &&
        x.loc !== null &&
        typeof x.loc.line === "number" &&
        typeof x.loc.column === "number");
}
