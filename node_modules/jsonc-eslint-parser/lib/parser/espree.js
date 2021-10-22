"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEspree = void 0;
const path_1 = __importDefault(require("path"));
let espreeCache = null;
function isLinterPath(p) {
    return (p.includes(`eslint${path_1.default.sep}lib${path_1.default.sep}linter${path_1.default.sep}linter.js`) || p.includes(`eslint${path_1.default.sep}lib${path_1.default.sep}linter.js`));
}
function getEspree() {
    if (!espreeCache) {
        const linterPath = Object.keys(require.cache).find(isLinterPath);
        if (linterPath) {
            try {
                espreeCache = createRequire(linterPath)("espree");
            }
            catch (_a) {
            }
        }
    }
    return espreeCache || (espreeCache = require("espree"));
}
exports.getEspree = getEspree;
function createRequire(filename) {
    const Module = require("module");
    const fn = Module.createRequire ||
        Module.createRequireFromPath ||
        ((filename2) => {
            const mod = new Module(filename2);
            mod.filename = filename2;
            mod.paths = Module._nodeModulePaths(path_1.default.dirname(filename2));
            mod._compile("module.exports = require;", filename2);
            return mod.exports;
        });
    return fn(filename);
}
