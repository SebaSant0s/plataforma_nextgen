"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeBase64 = exports.encodeBase64 = void 0;
const base64_js_1 = require("base64-js");
function isString(arrayOrString) {
    return typeof arrayOrString === 'string';
}
function isMapStringCallback(arrayOrString, callback) {
    return !!callback && isString(arrayOrString);
}
function map(arrayOrString, callback) {
    const res = [];
    if (isString(arrayOrString) && isMapStringCallback(arrayOrString, callback)) {
        for (let k = 0, len = arrayOrString.length; k < len; k++) {
            if (arrayOrString.charAt(k)) {
                const kValue = arrayOrString.charAt(k);
                const mappedValue = callback(kValue, k, arrayOrString);
                res[k] = mappedValue;
            }
        }
    }
    else if (!isString(arrayOrString) && !isMapStringCallback(arrayOrString, callback)) {
        for (let k = 0, len = arrayOrString.length; k < len; k++) {
            if (k in arrayOrString) {
                const kValue = arrayOrString[k];
                const mappedValue = callback(kValue, k, arrayOrString);
                res[k] = mappedValue;
            }
        }
    }
    return res;
}
const encodeBase64 = (data) => (0, base64_js_1.fromByteArray)(new Uint8Array(map(data, (char) => char.charCodeAt(0))));
exports.encodeBase64 = encodeBase64;
// base-64 decoder throws exception if encoded string is not padded by '=' to make string length
// in multiples of 4. So gonna use our own method for this purpose to keep backwards compatibility
// https://github.com/beatgammit/base64-js/blob/master/index.js#L26
const decodeBase64 = (s) => {
    const e = {}, w = String.fromCharCode, L = s.length;
    let i, b = 0, c, x, l = 0, a, r = '';
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (i = 0; i < 64; i++) {
        e[A.charAt(i)] = i;
    }
    for (x = 0; x < L; x++) {
        c = e[s.charAt(x)];
        b = (b << 6) + c;
        l += 6;
        while (l >= 8) {
            ((a = (b >>> (l -= 8)) & 0xff) || x < L - 2) && (r += w(a));
        }
    }
    return r;
};
exports.decodeBase64 = decodeBase64;
