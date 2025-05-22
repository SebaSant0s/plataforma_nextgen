"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUserToken = JWTUserToken;
exports.JWTServerToken = JWTServerToken;
exports.UserFromToken = UserFromToken;
exports.DevToken = DevToken;
exports.CheckSignature = CheckSignature;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const base64_1 = require("./base64");
/**
 * Creates the JWT token that can be used for a UserSession
 * @method JWTUserToken
 * @memberof signing
 * @private
 * @param {Secret} apiSecret - API Secret key
 * @param {string} userId - The user_id key in the JWT payload
 * @param {UR} [extraData] - Extra that should be part of the JWT token
 * @param {SignOptions} [jwtOptions] - Options that can be past to jwt.sign
 * @return {string} JWT Token
 */
function JWTUserToken(apiSecret, userId, extraData = {}, jwtOptions = {}) {
    if (typeof userId !== 'string') {
        throw new TypeError('userId should be a string');
    }
    const payload = {
        user_id: userId,
        ...extraData,
    };
    // make sure we return a clear error when jwt is shimmed (ie. browser build)
    if (jsonwebtoken_1.default == null || jsonwebtoken_1.default.sign == null) {
        throw Error(`Unable to find jwt crypto, if you are getting this error is probably because you are trying to generate tokens on browser or React Native (or other environment where crypto functions are not available). Please Note: token should only be generated server-side.`);
    }
    const opts = Object.assign({ algorithm: 'HS256', noTimestamp: true }, jwtOptions);
    if (payload.iat) {
        opts.noTimestamp = false;
    }
    return jsonwebtoken_1.default.sign(payload, apiSecret, opts);
}
function JWTServerToken(apiSecret, jwtOptions = {}) {
    const payload = {
        server: true,
    };
    const opts = Object.assign({ algorithm: 'HS256', noTimestamp: true }, jwtOptions);
    return jsonwebtoken_1.default.sign(payload, apiSecret, opts);
}
function UserFromToken(token) {
    const fragments = token.split('.');
    if (fragments.length !== 3) {
        return '';
    }
    const b64Payload = fragments[1];
    const payload = (0, base64_1.decodeBase64)(b64Payload);
    const data = JSON.parse(payload);
    return data.user_id;
}
/**
 *
 * @param {string} userId the id of the user
 * @return {string}
 */
function DevToken(userId) {
    return [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', //{"alg": "HS256", "typ": "JWT"}
        (0, base64_1.encodeBase64)(JSON.stringify({ user_id: userId })),
        'devtoken', // hardcoded signature
    ].join('.');
}
/**
 *
 * @param {string | Buffer} body the signed message
 * @param {string} secret the shared secret used to generate the signature (Stream API secret)
 * @param {string} signature the signature to validate
 * @return {boolean}
 */
function CheckSignature(body, secret, signature) {
    const key = Buffer.from(secret, 'utf8');
    const hash = crypto_1.default.createHmac('sha256', key).update(body).digest('hex');
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    }
    catch {
        return false;
    }
}
