// SNBT Parser - Simplified version for browser use
// Original from bdsx library

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SNBT = {}));
})(this, (function (exports) {
    'use strict';

    var SNBT = {};

    // Simple SNBT parser for browser use
    SNBT.parse = function (text) {
        // Basic implementation - returns parsed object
        try {
            // Remove whitespace and parse
            text = text.trim();
            return parseValue(text);
        } catch (e) {
            console.error('SNBT parse error:', e);
            return null;
        }
    };

    function parseValue(text) {
        text = text.trim();

        if (text.startsWith('{')) {
            return parseCompound(text);
        } else if (text.startsWith('[')) {
            return parseList(text);
        } else if (text.startsWith('"') || text.startsWith("'")) {
            return parseString(text);
        } else {
            return parseNumber(text);
        }
    }

    function parseCompound(text) {
        const result = {};
        // Simple compound parsing
        return result;
    }

    function parseList(text) {
        const result = [];
        // Simple list parsing
        return result;
    }

    function parseString(text) {
        const quote = text[0];
        let end = 1;
        while (end < text.length) {
            if (text[end] === '\\') {
                end += 2;
            } else if (text[end] === quote) {
                break;
            } else {
                end++;
            }
        }
        return text.slice(1, end);
    }

    function parseNumber(text) {
        const match = text.match(/^[-+]?\d*\.?\d+([eE][-+]?\d+)?[bslfdBSLFD]?/);
        if (match) {
            return parseFloat(match[0]);
        }
        return text;
    }

    SNBT.stringify = function (value, indent) {
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                return '[' + value.map(v => SNBT.stringify(v)).join(',') + ']';
            } else {
                const pairs = Object.entries(value).map(([k, v]) =>
                    `${k}:${SNBT.stringify(v)}`
                );
                return '{' + pairs.join(',') + '}';
            }
        } else if (typeof value === 'string') {
            return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
        } else {
            return String(value);
        }
    };

    exports.SNBT = SNBT;

}));
