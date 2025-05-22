"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const signing_1 = require("./signing");
const utils_1 = require("./utils");
/**
 * TokenManager
 *
 * Handles all the operations around user token.
 */
class TokenManager {
    /**
     * Constructor
     *
     * @param {Secret} secret
     */
    constructor(secret) {
        /**
         * Set the static string token or token provider.
         * Token provider should return a token string or a promise which resolves to string token.
         *
         * @param {TokenOrProvider} tokenOrProvider
         * @param {UserResponse<StreamChatGenerics>} user
         */
        this.setTokenOrProvider = async (tokenOrProvider, user) => {
            this.validateToken(tokenOrProvider, user);
            this.user = user;
            if ((0, utils_1.isFunction)(tokenOrProvider)) {
                this.tokenProvider = tokenOrProvider;
                this.type = 'provider';
            }
            if (typeof tokenOrProvider === 'string') {
                this.token = tokenOrProvider;
                this.type = 'static';
            }
            if (!tokenOrProvider && this.user && this.secret) {
                this.token = (0, signing_1.JWTUserToken)(this.secret, user.id, {}, {});
                this.type = 'static';
            }
            await this.loadToken();
        };
        /**
         * Resets the token manager.
         * Useful for client disconnection or switching user.
         */
        this.reset = () => {
            this.token = undefined;
            this.tokenProvider = undefined;
            this.type = 'static';
            this.user = undefined;
            this.loadTokenPromise = null;
        };
        // Validates the user token.
        this.validateToken = (tokenOrProvider, user) => {
            // allow empty token for anon user
            if (user && user.anon && !tokenOrProvider)
                return;
            // Don't allow empty token for non-server side client.
            if (!this.secret && !tokenOrProvider) {
                throw new Error('User token can not be empty');
            }
            if (tokenOrProvider && typeof tokenOrProvider !== 'string' && !(0, utils_1.isFunction)(tokenOrProvider)) {
                throw new Error('user token should either be a string or a function');
            }
            if (typeof tokenOrProvider === 'string') {
                // Allow empty token for anonymous users
                if (user.anon && tokenOrProvider === '')
                    return;
                const tokenUserId = (0, signing_1.UserFromToken)(tokenOrProvider);
                if (tokenOrProvider != null && (tokenUserId == null || tokenUserId === '' || tokenUserId !== user.id)) {
                    throw new Error('userToken does not have a user_id or is not matching with user.id');
                }
            }
        };
        // Resolves when token is ready. This function is simply to check if loadToken is in progress, in which
        // case a function should wait.
        this.tokenReady = () => this.loadTokenPromise;
        // Fetches a token from tokenProvider function and sets in tokenManager.
        // In case of static token, it will simply resolve to static token.
        this.loadToken = () => {
            // eslint-disable-next-line no-async-promise-executor
            this.loadTokenPromise = new Promise(async (resolve, reject) => {
                if (this.type === 'static') {
                    return resolve(this.token);
                }
                if (this.tokenProvider && typeof this.tokenProvider !== 'string') {
                    try {
                        this.token = await this.tokenProvider();
                    }
                    catch (e) {
                        return reject(new Error(`Call to tokenProvider failed with message: ${e}`));
                    }
                    resolve(this.token);
                }
            });
            return this.loadTokenPromise;
        };
        // Returns a current token
        this.getToken = () => {
            if (this.token) {
                return this.token;
            }
            if (this.user && this.user.anon && !this.token) {
                return this.token;
            }
            if (this.secret) {
                return (0, signing_1.JWTServerToken)(this.secret);
            }
            throw new Error(`Both secret and user tokens are not set. Either client.connectUser wasn't called or client.disconnect was called`);
        };
        this.isStatic = () => this.type === 'static';
        this.loadTokenPromise = null;
        if (secret) {
            this.secret = secret;
        }
        this.type = 'static';
        if (this.secret) {
            this.token = (0, signing_1.JWTServerToken)(this.secret);
        }
    }
}
exports.TokenManager = TokenManager;
