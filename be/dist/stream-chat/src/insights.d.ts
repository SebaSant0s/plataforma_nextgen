import { StableWSConnection } from './connection';
export type InsightTypes = 'ws_fatal' | 'ws_success_after_failure' | 'http_hi_failed';
export declare class InsightMetrics {
    connectionStartTimestamp: number | null;
    wsConsecutiveFailures: number;
    wsTotalFailures: number;
    instanceClientId: string;
    constructor();
}
/**
 * postInsights is not supposed to be used by end users directly within chat application, and thus is kept isolated
 * from all the client/connection code/logic.
 *
 * @param insightType
 * @param insights
 */
export declare const postInsights: (insightType: InsightTypes, insights: Record<string, unknown>) => Promise<void>;
export declare function buildWsFatalInsight(connection: StableWSConnection, event: Record<string, unknown>): {
    ready_state: 0 | 1 | 2 | 3 | undefined;
    url: string;
    api_key: string;
    start_ts: number | null;
    end_ts: number;
    auth_type: string;
    token: string | undefined;
    user_id: string | undefined;
    user_details: import("./types").UserResponse<import("./types").DefaultGenerics> | import("./types").OwnUserResponse<import("./types").DefaultGenerics> | undefined;
    device: import("./types").BaseDeviceFields | undefined;
    client_id: string | undefined;
    ws_details: import("ws") | undefined;
    ws_consecutive_failures: number;
    ws_total_failures: number;
    request_id: string | undefined;
    online: boolean | null;
    user_agent: string | null;
    instance_client_id: string;
};
export declare function buildWsSuccessAfterFailureInsight(connection: StableWSConnection): {
    ready_state: 0 | 1 | 2 | 3 | undefined;
    url: string;
    api_key: string;
    start_ts: number | null;
    end_ts: number;
    auth_type: string;
    token: string | undefined;
    user_id: string | undefined;
    user_details: import("./types").UserResponse<import("./types").DefaultGenerics> | import("./types").OwnUserResponse<import("./types").DefaultGenerics> | undefined;
    device: import("./types").BaseDeviceFields | undefined;
    client_id: string | undefined;
    ws_details: import("ws") | undefined;
    ws_consecutive_failures: number;
    ws_total_failures: number;
    request_id: string | undefined;
    online: boolean | null;
    user_agent: string | null;
    instance_client_id: string;
};
//# sourceMappingURL=insights.d.ts.map