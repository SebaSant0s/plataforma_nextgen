"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postInsights = exports.InsightMetrics = void 0;
exports.buildWsFatalInsight = buildWsFatalInsight;
exports.buildWsSuccessAfterFailureInsight = buildWsSuccessAfterFailureInsight;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
class InsightMetrics {
    constructor() {
        this.connectionStartTimestamp = null;
        this.wsTotalFailures = 0;
        this.wsConsecutiveFailures = 0;
        this.instanceClientId = (0, utils_1.randomId)();
    }
}
exports.InsightMetrics = InsightMetrics;
/**
 * postInsights is not supposed to be used by end users directly within chat application, and thus is kept isolated
 * from all the client/connection code/logic.
 *
 * @param insightType
 * @param insights
 */
const postInsights = async (insightType, insights) => {
    const maxAttempts = 3;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await axios_1.default.post(`http://localhost:4000/insights/${insightType}`, insights);
        }
        catch (e) {
            await (0, utils_1.sleep)((i + 1) * 3000);
            continue;
        }
        break;
    }
};
exports.postInsights = postInsights;
function buildWsFatalInsight(connection, event) {
    return {
        ...event,
        ...buildWsBaseInsight(connection),
    };
}
function buildWsBaseInsight(connection) {
    const { client } = connection;
    return {
        ready_state: connection.ws?.readyState,
        url: connection._buildUrl(),
        api_key: client.key,
        start_ts: client.insightMetrics.connectionStartTimestamp,
        end_ts: new Date().getTime(),
        auth_type: client.getAuthType(),
        token: client.tokenManager.token,
        user_id: client.userID,
        user_details: client._user,
        device: client.options.device,
        client_id: connection.connectionID,
        ws_details: connection.ws,
        ws_consecutive_failures: client.insightMetrics.wsConsecutiveFailures,
        ws_total_failures: client.insightMetrics.wsTotalFailures,
        request_id: connection.requestID,
        online: typeof navigator !== 'undefined' ? navigator?.onLine : null,
        user_agent: typeof navigator !== 'undefined' ? navigator?.userAgent : null,
        instance_client_id: client.insightMetrics.instanceClientId,
    };
}
function buildWsSuccessAfterFailureInsight(connection) {
    return buildWsBaseInsight(connection);
}
