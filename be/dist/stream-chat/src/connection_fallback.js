"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSConnectionFallback = exports.ConnectionState = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const errors_1 = require("./errors");
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["Closed"] = "CLOSED";
    ConnectionState["Connected"] = "CONNECTED";
    ConnectionState["Connecting"] = "CONNECTING";
    ConnectionState["Disconnected"] = "DISCONNECTED";
    ConnectionState["Init"] = "INIT";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
class WSConnectionFallback {
    constructor({ client }) {
        /** @private */
        this._onlineStatusChanged = (event) => {
            this._log(`_onlineStatusChanged() - ${event.type}`);
            if (event.type === 'offline') {
                this._setState(ConnectionState.Closed);
                this.cancelToken?.cancel('disconnect() is called');
                this.cancelToken = undefined;
                return;
            }
            if (event.type === 'online' && this.state === ConnectionState.Closed) {
                this.connect(true);
            }
        };
        /** @private */
        this._req = async (params, config, retry) => {
            if (!this.cancelToken && !params.close) {
                this.cancelToken = axios_1.default.CancelToken.source();
            }
            try {
                const res = await this.client.doAxiosRequest('get', this.client.baseURL.replace(':3030', ':8900') + '/longpoll', // replace port if present for testing with local API
                undefined, {
                    config: { ...config, cancelToken: this.cancelToken?.token },
                    params,
                });
                this.consecutiveFailures = 0; // always reset in case of no error
                return res;
            }
            catch (err) {
                const error = err;
                this.consecutiveFailures += 1;
                if (retry && (0, errors_1.isErrorRetryable)(error)) {
                    this._log(`_req() - Retryable error, retrying request`);
                    await (0, utils_1.sleep)((0, utils_1.retryInterval)(this.consecutiveFailures));
                    return this._req(params, config, retry);
                }
                throw error;
            }
        };
        /** @private */
        this._poll = async () => {
            while (this.state === ConnectionState.Connected) {
                try {
                    const data = await this._req({}, { timeout: 30000 }, true); // 30s => API responds in 20s if there is no event
                    if (data.events?.length) {
                        for (let i = 0; i < data.events.length; i++) {
                            this.client.dispatchEvent(data.events[i]);
                        }
                    }
                }
                catch (err) {
                    if (axios_1.default.isCancel(err)) {
                        this._log(`_poll() - axios canceled request`);
                        return;
                    }
                    /** client.doAxiosRequest will take care of TOKEN_EXPIRED error */
                    const error = err; // Ensure TypeScript recognizes it as APIError
                    /** client.doAxiosRequest will take care of TOKEN_EXPIRED error */
                    if ((0, errors_1.isConnectionIDError)(error)) {
                        this._log(`_poll() - ConnectionID error, connecting without ID...`);
                        this._setState(ConnectionState.Disconnected);
                        this.connect(true);
                        return;
                    }
                    if ((0, errors_1.isAPIError)(error) && !(0, errors_1.isErrorRetryable)(error)) {
                        this._setState(ConnectionState.Closed);
                        return;
                    }
                    await (0, utils_1.sleep)((0, utils_1.retryInterval)(this.consecutiveFailures));
                }
            }
        };
        /**
         * connect try to open a longpoll request
         * @param reconnect should be false for first call and true for subsequent calls to keep the connection alive and call recoverState
         */
        this.connect = async (reconnect = false) => {
            if (this.state === ConnectionState.Connecting) {
                this._log('connect() - connecting already in progress', { reconnect }, 'warn');
                return;
            }
            if (this.state === ConnectionState.Connected) {
                this._log('connect() - already connected and polling', { reconnect }, 'warn');
                return;
            }
            this._setState(ConnectionState.Connecting);
            this.connectionID = undefined; // connect should be sent with empty connection_id so API creates one
            try {
                const { event } = await this._req({ json: this.client._buildWSPayload() }, { timeout: 8000 }, // 8s
                reconnect);
                this._setState(ConnectionState.Connected);
                this.connectionID = event.connection_id;
                // @ts-expect-error
                this.client.dispatchEvent(event);
                this._poll();
                if (reconnect) {
                    this.client.recoverState();
                }
                return event;
            }
            catch (err) {
                this._setState(ConnectionState.Closed);
                throw err;
            }
        };
        /**
         * isHealthy checks if there is a connectionID and connection is in Connected state
         */
        this.isHealthy = () => {
            return !!this.connectionID && this.state === ConnectionState.Connected;
        };
        this.disconnect = async (timeout = 2000) => {
            (0, utils_1.removeConnectionEventListeners)(this._onlineStatusChanged);
            this._setState(ConnectionState.Disconnected);
            this.cancelToken?.cancel('disconnect() is called');
            this.cancelToken = undefined;
            const connection_id = this.connectionID;
            this.connectionID = undefined;
            try {
                await this._req({ close: true, connection_id }, { timeout }, false);
                this._log(`disconnect() - Closed connectionID`);
            }
            catch (err) {
                this._log(`disconnect() - Failed`, { err }, 'error');
            }
        };
        this.client = client;
        this.state = ConnectionState.Init;
        this.consecutiveFailures = 0;
        (0, utils_1.addConnectionEventListeners)(this._onlineStatusChanged);
    }
    _log(msg, extra = {}, level = 'info') {
        this.client.logger(level, 'WSConnectionFallback:' + msg, { tags: ['connection_fallback', 'connection'], ...extra });
    }
    _setState(state) {
        this._log(`_setState() - ${state}`);
        // transition from connecting => connected
        if (this.state === ConnectionState.Connecting && state === ConnectionState.Connected) {
            this.client.dispatchEvent({ type: 'connection.changed', online: true });
        }
        if (state === ConnectionState.Closed || state === ConnectionState.Disconnected) {
            this.client.dispatchEvent({ type: 'connection.changed', online: false });
        }
        this.state = state;
    }
}
exports.WSConnectionFallback = WSConnectionFallback;
