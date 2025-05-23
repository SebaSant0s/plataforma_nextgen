import WebSocket from 'isomorphic-ws';
import { ConnectAPIResponse, ConnectionOpen, ExtendableGenerics, DefaultGenerics, UR, LogLevel } from './types';
import { StreamChat } from './client';
/**
 * StableWSConnection - A WS connection that reconnects upon failure.
 * - the browser will sometimes report that you're online or offline
 * - the WS connection can break and fail (there is a 30s health check)
 * - sometimes your WS connection will seem to work while the user is in fact offline
 * - to speed up online/offline detection you can use the window.addEventListener('offline');
 *
 * There are 4 ways in which a connection can become unhealthy:
 * - websocket.onerror is called
 * - websocket.onclose is called
 * - the health check fails and no event is received for ~40 seconds
 * - the browser indicates the connection is now offline
 *
 * There are 2 assumptions we make about the server:
 * - state can be recovered by querying the channel again
 * - if the servers fails to publish a message to the client, the WS connection is destroyed
 */
export declare class StableWSConnection<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    client: StreamChat<StreamChatGenerics>;
    connectionID?: string;
    connectionOpen?: ConnectAPIResponse<StreamChatGenerics>;
    consecutiveFailures: number;
    pingInterval: number;
    healthCheckTimeoutRef?: NodeJS.Timeout;
    isConnecting: boolean;
    isDisconnected: boolean;
    isHealthy: boolean;
    isResolved?: boolean;
    lastEvent: Date | null;
    connectionCheckTimeout: number;
    connectionCheckTimeoutRef?: NodeJS.Timeout;
    rejectPromise?: (reason?: Error & {
        code?: string | number;
        isWSFailure?: boolean;
        StatusCode?: string | number;
    }) => void;
    requestID: string | undefined;
    resolvePromise?: (value: ConnectionOpen<StreamChatGenerics>) => void;
    totalFailures: number;
    ws?: WebSocket;
    wsID: number;
    constructor({ client }: {
        client: StreamChat<StreamChatGenerics>;
    });
    _log(msg: string, extra?: UR, level?: LogLevel): void;
    setClient(client: StreamChat<StreamChatGenerics>): void;
    /**
     * connect - Connect to the WS URL
     * the default 15s timeout allows between 2~3 tries
     * @return {ConnectAPIResponse<ChannelType, CommandType, UserType>} Promise that completes once the first health check message is received
     */
    connect(timeout?: number): Promise<void | ConnectionOpen<StreamChatGenerics>>;
    /**
     * _waitForHealthy polls the promise connection to see if its resolved until it times out
     * the default 15s timeout allows between 2~3 tries
     * @param timeout duration(ms)
     */
    _waitForHealthy(timeout?: number): Promise<void | ConnectionOpen<StreamChatGenerics>>;
    /**
     * Builds and returns the url for websocket.
     * @private
     * @returns url string
     */
    _buildUrl: () => string;
    /**
     * disconnect - Disconnect the connection and doesn't recover...
     *
     */
    disconnect(timeout?: number): Promise<void>;
    /**
     * _connect - Connect to the WS endpoint
     *
     * @return {ConnectAPIResponse<ChannelType, CommandType, UserType>} Promise that completes once the first health check message is received
     */
    _connect(): Promise<ConnectionOpen<StreamChatGenerics> | undefined>;
    /**
     * _reconnect - Retry the connection to WS endpoint
     *
     * @param {{ interval?: number; refreshToken?: boolean }} options Following options are available
     *
     * - `interval`	{int}			number of ms that function should wait before reconnecting
     * - `refreshToken` {boolean}	reload/refresh user token be refreshed before attempting reconnection.
     */
    _reconnect(options?: {
        interval?: number;
        refreshToken?: boolean;
    }): Promise<void>;
    /**
     * onlineStatusChanged - this function is called when the browser connects or disconnects from the internet.
     *
     * @param {Event} event Event with type online or offline
     *
     */
    onlineStatusChanged: (event: Event) => void;
    onopen: (wsID: number) => void;
    onmessage: (wsID: number, event: WebSocket.MessageEvent) => void;
    onclose: (wsID: number, event: WebSocket.CloseEvent) => void;
    onerror: (wsID: number, event: WebSocket.ErrorEvent) => void;
    /**
     * _setHealth - Sets the connection to healthy or unhealthy.
     * Broadcasts an event in case the connection status changed.
     *
     * @param {boolean} healthy boolean indicating if the connection is healthy or not
     *
     */
    _setHealth: (healthy: boolean) => void;
    /**
     * _errorFromWSEvent - Creates an error object for the WS event
     *
     */
    _errorFromWSEvent: (event: WebSocket.CloseEvent | WebSocket.Data | WebSocket.ErrorEvent, isWSFailure?: boolean) => Error & {
        code?: string | number;
        isWSFailure?: boolean;
        StatusCode?: string | number;
    };
    /**
     * _destroyCurrentWSConnection - Removes the current WS connection
     *
     */
    _destroyCurrentWSConnection(): void;
    /**
     * _setupPromise - sets up the this.connectOpen promise
     */
    _setupConnectionPromise: () => void;
    /**
     * Schedules a next health check ping for websocket.
     */
    scheduleNextPing: () => void;
    /**
     * scheduleConnectionCheck - schedules a check for time difference between last received event and now.
     * If the difference is more than 35 seconds, it means our health check logic has failed and websocket needs
     * to be reconnected.
     */
    scheduleConnectionCheck: () => void;
}
//# sourceMappingURL=connection.d.ts.map