import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import WebSocket from 'isomorphic-ws';
import { Channel } from './channel';
import { ClientState } from './client_state';
import { StableWSConnection } from './connection';
import { TokenManager } from './token_manager';
import { WSConnectionFallback } from './connection_fallback';
import { Campaign } from './campaign';
import { Segment } from './segment';
import { APIErrorResponse, APIResponse, AppSettings, AppSettingsAPIResponse, BannedUsersFilters, BannedUsersPaginationOptions, BannedUsersResponse, BannedUsersSort, BanUserOptions, BaseDeviceFields, BlockList, BlockListResponse, BlockUserAPIResponse, CampaignData, CampaignFilters, CampaignQueryOptions, CampaignResponse, CampaignSort, CastVoteAPIResponse, ChannelAPIResponse, ChannelData, ChannelFilters, ChannelMute, ChannelOptions, ChannelResponse, ChannelSort, ChannelStateOptions, CheckPushResponse, CheckSNSResponse, CheckSQSResponse, Configs, ConnectAPIResponse, CreateChannelOptions, CreateChannelResponse, CreateCommandOptions, CreateCommandResponse, CreateImportOptions, CreateImportResponse, CreateImportURLResponse, CreatePollAPIResponse, CreatePollData, CreatePollOptionAPIResponse, CustomPermissionOptions, DeactivateUsersOptions, DefaultGenerics, DeleteCommandResponse, DeleteUserOptions, Device, DeviceIdentifier, EndpointName, ErrorFromResponse, Event, EventHandler, ExportChannelOptions, ExportChannelRequest, ExportChannelResponse, ExportChannelStatusResponse, ExportUsersRequest, ExportUsersResponse, ExtendableGenerics, FlagMessageResponse, FlagReportsFilters, FlagReportsPaginationOptions, FlagReportsResponse, FlagsFilters, FlagsPaginationOptions, FlagsResponse, FlagUserResponse, GetBlockedUsersAPIResponse, GetCallTokenResponse, GetCampaignOptions, GetChannelTypeResponse, GetCommandResponse, GetImportResponse, GetMessageAPIResponse, GetMessageOptions, GetPollAPIResponse, GetPollOptionAPIResponse, GetRateLimitsResponse, GetThreadAPIResponse, GetThreadOptions, GetUnreadCountAPIResponse, GetUnreadCountBatchAPIResponse, ListChannelResponse, ListCommandsResponse, ListImportsPaginationOptions, ListImportsResponse, Logger, MarkChannelsReadOptions, MessageFilters, MessageFlagsFilters, MessageFlagsPaginationOptions, MessageFlagsResponse, MessageResponse, Mute, MuteUserOptions, MuteUserResponse, OGAttachment, OwnUserResponse, PartialMessageUpdate, PartialPollUpdate, PartialThreadUpdate, PartialUserUpdate, PermissionAPIResponse, PermissionsAPIResponse, PollAnswersAPIResponse, PollData, PollOptionData, PollSort, PollVote, PollVoteData, PollVotesAPIResponse, PushPreference, PushProvider, PushProviderConfig, PushProviderID, PushProviderListResponse, PushProviderUpsertResponse, QueryMessageHistoryFilters, QueryMessageHistoryOptions, QueryMessageHistoryResponse, QueryMessageHistorySort, QueryPollsFilters, QueryPollsOptions, QueryPollsResponse, QueryReactionsAPIResponse, QueryReactionsOptions, QuerySegmentsOptions, QuerySegmentTargetsFilter, QueryThreadsOptions, QueryVotesFilters, QueryVotesOptions, ReactionFilters, ReactionResponse, ReactionSort, ReactivateUserOptions, ReactivateUsersOptions, ReviewFlagReportOptions, ReviewFlagReportResponse, SdkIdentifier, SearchAPIResponse, SearchOptions, SegmentData, SegmentResponse, SegmentTargetsResponse, SegmentType, SendFileAPIResponse, SortParam, StreamChatOptions, SyncOptions, SyncResponse, TaskResponse, TaskStatus, TestPushDataInput, TestSNSDataInput, TestSQSDataInput, TokenOrProvider, TranslateResponse, UnBanUserOptions, UpdateChannelOptions, UpdateChannelResponse, UpdateCommandOptions, UpdateCommandResponse, UpdatedMessage, UpdateMessageAPIResponse, UpdateMessageOptions, UpdatePollAPIResponse, UpdatePollOptionAPIResponse, UpdateSegmentData, UpsertPushPreferencesResponse, UserCustomEvent, UserFilters, UserOptions, UserResponse, UserSort, VoteSort, QueryDraftsResponse, DraftFilters, DraftSort, Pager } from './types';
import { InsightMetrics } from './insights';
import { Thread } from './thread';
import { Moderation } from './moderation';
import { ThreadManager } from './thread_manager';
import { PollManager } from './poll_manager';
import { ChannelManager, ChannelManagerEventHandlerOverrides, ChannelManagerOptions } from './channel_manager';
export declare class StreamChat<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    private static _instance?;
    _user?: OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>;
    activeChannels: {
        [key: string]: Channel<StreamChatGenerics>;
    };
    threads: ThreadManager<StreamChatGenerics>;
    polls: PollManager<StreamChatGenerics>;
    anonymous: boolean;
    persistUserOnConnectionFailure?: boolean;
    axiosInstance: AxiosInstance;
    baseURL?: string;
    browser: boolean;
    cleaningIntervalRef?: NodeJS.Timeout;
    clientID?: string;
    configs: Configs<StreamChatGenerics>;
    key: string;
    listeners: Record<string, Array<(event: Event<StreamChatGenerics>) => void>>;
    logger: Logger;
    /**
     * When network is recovered, we re-query the active channels on client. But in single query, you can recover
     * only 30 channels. So its not guaranteed that all the channels in activeChannels object have updated state.
     * Thus in UI sdks, state recovery is managed by components themselves, they don't rely on js client for this.
     *
     * `recoverStateOnReconnect` parameter can be used in such cases, to disable state recovery within js client.
     * When false, user/consumer of this client will need to make sure all the channels present on UI by
     * manually calling queryChannels endpoint.
     */
    recoverStateOnReconnect?: boolean;
    moderation: Moderation<StreamChatGenerics>;
    mutedChannels: ChannelMute<StreamChatGenerics>[];
    mutedUsers: Mute<StreamChatGenerics>[];
    node: boolean;
    options: StreamChatOptions;
    secret?: string;
    setUserPromise: ConnectAPIResponse<StreamChatGenerics> | null;
    state: ClientState<StreamChatGenerics>;
    tokenManager: TokenManager<StreamChatGenerics>;
    user?: OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>;
    userAgent?: string;
    userID?: string;
    wsBaseURL?: string;
    wsConnection: StableWSConnection<StreamChatGenerics> | null;
    wsFallback?: WSConnectionFallback<StreamChatGenerics>;
    wsPromise: ConnectAPIResponse<StreamChatGenerics> | null;
    consecutiveFailures: number;
    insightMetrics: InsightMetrics;
    defaultWSTimeoutWithFallback: number;
    defaultWSTimeout: number;
    sdkIdentifier?: SdkIdentifier;
    deviceIdentifier?: DeviceIdentifier;
    private nextRequestAbortController;
    /**
     * Initialize a client
     *
     * **Only use constructor for advanced usages. It is strongly advised to use `StreamChat.getInstance()` instead of `new StreamChat()` to reduce integration issues due to multiple WebSocket connections**
     * @param {string} key - the api key
     * @param {string} [secret] - the api secret
     * @param {StreamChatOptions} [options] - additional options, here you can pass custom options to axios instance
     * @param {boolean} [options.browser] - enforce the client to be in browser mode
     * @param {boolean} [options.warmUp] - default to false, if true, client will open a connection as soon as possible to speed up following requests
     * @param {Logger} [options.Logger] - custom logger
     * @param {number} [options.timeout] - default to 3000
     * @param {httpsAgent} [options.httpsAgent] - custom httpsAgent, in node it's default to https.agent()
     * @example <caption>initialize the client in user mode</caption>
     * new StreamChat('api_key')
     * @example <caption>initialize the client in user mode with options</caption>
     * new StreamChat('api_key', { warmUp:true, timeout:5000 })
     * @example <caption>secret is optional and only used in server side mode</caption>
     * new StreamChat('api_key', "secret", { httpsAgent: customAgent })
     */
    constructor(key: string, options?: StreamChatOptions);
    constructor(key: string, secret?: string, options?: StreamChatOptions);
    /**
     * Get a client instance
     *
     * This function always returns the same Client instance to avoid issues raised by multiple Client and WS connections
     *
     * **After the first call, the client configuration will not change if the key or options parameters change**
     *
     * @param {string} key - the api key
     * @param {string} [secret] - the api secret
     * @param {StreamChatOptions} [options] - additional options, here you can pass custom options to axios instance
     * @param {boolean} [options.browser] - enforce the client to be in browser mode
     * @param {boolean} [options.warmUp] - default to false, if true, client will open a connection as soon as possible to speed up following requests
     * @param {Logger} [options.Logger] - custom logger
     * @param {number} [options.timeout] - default to 3000
     * @param {httpsAgent} [options.httpsAgent] - custom httpsAgent, in node it's default to https.agent()
     * @example <caption>initialize the client in user mode</caption>
     * StreamChat.getInstance('api_key')
     * @example <caption>initialize the client in user mode with options</caption>
     * StreamChat.getInstance('api_key', { timeout:5000 })
     * @example <caption>secret is optional and only used in server side mode</caption>
     * StreamChat.getInstance('api_key', "secret", { httpsAgent: customAgent })
     */
    static getInstance<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(key: string, options?: StreamChatOptions): StreamChat<StreamChatGenerics>;
    static getInstance<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(key: string, secret?: string, options?: StreamChatOptions): StreamChat<StreamChatGenerics>;
    devToken(userID: string): string;
    getAuthType(): "anonymous" | "jwt";
    setBaseURL(baseURL: string): void;
    _getConnectionID: () => string | undefined;
    _hasConnectionID: () => boolean;
    /**
     * connectUser - Set the current user and open a WebSocket connection
     *
     * @param {OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>} user Data about this user. IE {name: "john"}
     * @param {TokenOrProvider} userTokenOrProvider Token or provider
     *
     * @return {ConnectAPIResponse<StreamChatGenerics>} Returns a promise that resolves when the connection is setup
     */
    connectUser: (user: OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>, userTokenOrProvider: TokenOrProvider) => Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * @deprecated Please use connectUser() function instead. Its naming is more consistent with its functionality.
     *
     * setUser - Set the current user and open a WebSocket connection
     *
     * @param {OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>} user Data about this user. IE {name: "john"}
     * @param {TokenOrProvider} userTokenOrProvider Token or provider
     *
     * @return {ConnectAPIResponse<StreamChatGenerics>} Returns a promise that resolves when the connection is setup
     */
    setUser: (user: OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>, userTokenOrProvider: TokenOrProvider) => Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    _setToken: (user: UserResponse<StreamChatGenerics>, userTokenOrProvider: TokenOrProvider) => Promise<void>;
    _setUser(user: OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>): void;
    /**
     * Disconnects the websocket connection, without removing the user set on client.
     * client.closeConnection will not trigger default auto-retry mechanism for reconnection. You need
     * to call client.openConnection to reconnect to websocket.
     *
     * This is mainly useful on mobile side. You can only receive push notifications
     * if you don't have active websocket connection.
     * So when your app goes to background, you can call `client.closeConnection`.
     * And when app comes back to foreground, call `client.openConnection`.
     *
     * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming succesful disconnection.
     *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
     */
    closeConnection: (timeout?: number) => Promise<void>;
    /**
     * Creates an instance of ChannelManager.
     *
     * @internal
     *
     * @param eventHandlerOverrides - the overrides for event handlers to be used
     * @param options - the options used for the channel manager
     */
    createChannelManager: ({ eventHandlerOverrides, options, }: {
        eventHandlerOverrides?: ChannelManagerEventHandlerOverrides<StreamChatGenerics>;
        options?: ChannelManagerOptions;
    }) => ChannelManager<StreamChatGenerics>;
    /**
     * Creates a new WebSocket connection with the current user. Returns empty promise, if there is an active connection
     */
    openConnection: () => Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * @deprecated Please use client.openConnction instead.
     * @private
     *
     * Creates a new websocket connection with current user.
     */
    _setupConnection: () => Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * updateAppSettings - updates application settings
     *
     * @param {AppSettings} options App settings.
     * IE: {
        'apn_config': {
          'auth_type': 'token',
          'auth_key": fs.readFileSync(
            './apn-push-auth-key.p8',
            'utf-8',
          ),
          'key_id': 'keyid',
          'team_id': 'teamid',
          'notification_template": 'notification handlebars template',
          'bundle_id': 'com.apple.your.app',
          'development': true
        },
        'firebase_config': {
          'server_key': 'server key from fcm',
          'notification_template': 'notification handlebars template',
          'data_template': 'data handlebars template',
          'apn_template': 'apn notification handlebars template under v2'
        },
        'webhook_url': 'https://acme.com/my/awesome/webhook/'
      }
     */
    updateAppSettings(options: AppSettings): Promise<APIResponse>;
    _normalizeDate: (before: Date | string | null) => string | null;
    /**
     * Revokes all tokens on application level issued before given time
     */
    revokeTokens(before: Date | string | null): Promise<APIResponse>;
    /**
     * Revokes token for a user issued before given time
     */
    revokeUserToken(userID: string, before?: Date | string | null): Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * Revokes tokens for a list of users issued before given time
     */
    revokeUsersToken(userIDs: string[], before?: Date | string | null): Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * getAppSettings - retrieves application settings
     */
    getAppSettings(): Promise<AppSettingsAPIResponse<StreamChatGenerics>>;
    /**
     * testPushSettings - Tests the push settings for a user with a random chat message and the configured push templates
     *
     * @param {string} userID User ID. If user has no devices, it will error
     * @param {TestPushDataInput} [data] Overrides for push templates/message used
     *  IE: {
          messageID: 'id-of-message', // will error if message does not exist
          apnTemplate: '{}', // if app doesn't have apn configured it will error
          firebaseTemplate: '{}', // if app doesn't have firebase configured it will error
          firebaseDataTemplate: '{}', // if app doesn't have firebase configured it will error
          skipDevices: true, // skip config/device checks and sending to real devices
          pushProviderName: 'staging' // one of your configured push providers
          pushProviderType: 'apn' // one of supported provider types
        }
    */
    testPushSettings(userID: string, data?: TestPushDataInput): Promise<CheckPushResponse>;
    /**
     * testSQSSettings - Tests that the given or configured SQS configuration is valid
     *
     * @param {TestSQSDataInput} [data] Overrides SQS settings for testing if needed
     *  IE: {
          sqs_key: 'auth_key',
          sqs_secret: 'auth_secret',
          sqs_url: 'url_to_queue',
        }
     */
    testSQSSettings(data?: TestSQSDataInput): Promise<CheckSQSResponse>;
    /**
     * testSNSSettings - Tests that the given or configured SNS configuration is valid
     *
     * @param {TestSNSDataInput} [data] Overrides SNS settings for testing if needed
     *  IE: {
          sns_key: 'auth_key',
          sns_secret: 'auth_secret',
          sns_topic_arn: 'topic_to_publish_to',
        }
     */
    testSNSSettings(data?: TestSNSDataInput): Promise<CheckSNSResponse>;
    /**
     * Disconnects the websocket and removes the user from client.
     *
     * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming successful disconnection.
     *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
     */
    disconnectUser: (timeout?: number) => Promise<void>;
    /**
     *
     * @deprecated Please use client.disconnectUser instead.
     *
     * Disconnects the websocket and removes the user from client.
     */
    disconnect: (timeout?: number) => Promise<void>;
    /**
     * connectAnonymousUser - Set an anonymous user and open a WebSocket connection
     */
    connectAnonymousUser: () => Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * @deprecated Please use connectAnonymousUser. Its naming is more consistent with its functionality.
     */
    setAnonymousUser: () => Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * setGuestUser - Setup a temporary guest user
     *
     * @param {UserResponse<StreamChatGenerics>} user Data about this user. IE {name: "john"}
     *
     * @return {ConnectAPIResponse<StreamChatGenerics>} Returns a promise that resolves when the connection is setup
     */
    setGuestUser(user: UserResponse<StreamChatGenerics>): Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * createToken - Creates a token to authenticate this user. This function is used server side.
     * The resulting token should be passed to the client side when the users registers or logs in.
     *
     * @param {string} userID The User ID
     * @param {number} [exp] The expiration time for the token expressed in the number of seconds since the epoch
     *
     * @return {string} Returns a token
     */
    createToken(userID: string, exp?: number, iat?: number): string;
    /**
     * on - Listen to events on all channels and users your watching
     *
     * client.on('message.new', event => {console.log("my new message", event, channel.state.messages)})
     * or
     * client.on(event => {console.log(event.type)})
     *
     * @param {EventHandler<StreamChatGenerics> | string} callbackOrString  The event type to listen for (optional)
     * @param {EventHandler<StreamChatGenerics>} [callbackOrNothing] The callback to call
     *
     * @return {{ unsubscribe: () => void }} Description
     */
    on(callback: EventHandler<StreamChatGenerics>): {
        unsubscribe: () => void;
    };
    on(eventType: string, callback: EventHandler<StreamChatGenerics>): {
        unsubscribe: () => void;
    };
    /**
     * off - Remove the event handler
     *
     */
    off(callback: EventHandler<StreamChatGenerics>): void;
    off(eventType: string, callback: EventHandler<StreamChatGenerics>): void;
    _logApiRequest(type: string, url: string, data: unknown, config: AxiosRequestConfig & {
        config?: AxiosRequestConfig & {
            maxBodyLength?: number;
        };
    }): void;
    _logApiResponse<T>(type: string, url: string, response: AxiosResponse<T>): void;
    _logApiError(type: string, url: string, error: unknown): void;
    doAxiosRequest: <T>(type: string, url: string, data?: unknown, options?: AxiosRequestConfig & {
        config?: AxiosRequestConfig & {
            maxBodyLength?: number;
        };
    }) => Promise<T>;
    get<T>(url: string, params?: AxiosRequestConfig['params']): Promise<T>;
    put<T>(url: string, data?: unknown): Promise<T>;
    post<T>(url: string, data?: unknown): Promise<T>;
    patch<T>(url: string, data?: unknown): Promise<T>;
    delete<T>(url: string, params?: AxiosRequestConfig['params']): Promise<T>;
    sendFile(url: string, uri: string | NodeJS.ReadableStream | Buffer | File, name?: string, contentType?: string, user?: UserResponse<StreamChatGenerics>): Promise<SendFileAPIResponse>;
    errorFromResponse(response: AxiosResponse<APIErrorResponse>): ErrorFromResponse<APIErrorResponse>;
    handleResponse<T>(response: AxiosResponse<T>): T;
    dispatchEvent: (event: Event<StreamChatGenerics>) => void;
    handleEvent: (messageEvent: WebSocket.MessageEvent) => void;
    /**
     * Updates the members, watchers and read references of the currently active channels that contain this user
     *
     * @param {UserResponse<StreamChatGenerics>} user
     */
    _updateMemberWatcherReferences: (user: UserResponse<StreamChatGenerics>) => void;
    /**
     * @deprecated Please _updateMemberWatcherReferences instead.
     * @private
     */
    _updateUserReferences: (user: UserResponse<StreamChatGenerics>) => void;
    /**
     * @private
     *
     * Updates the messages from the currently active channels that contain this user,
     * with updated user object.
     *
     * @param {UserResponse<StreamChatGenerics>} user
     */
    _updateUserMessageReferences: (user: UserResponse<StreamChatGenerics>) => void;
    /**
     * @private
     *
     * Deletes the messages from the currently active channels that contain this user
     *
     * If hardDelete is true, all the content of message will be stripped down.
     * Otherwise, only 'message.type' will be set as 'deleted'.
     *
     * @param {UserResponse<StreamChatGenerics>} user
     * @param {boolean} hardDelete
     */
    _deleteUserMessageReference: (user: UserResponse<StreamChatGenerics>, hardDelete?: boolean) => void;
    /**
     * @private
     *
     * Handle following user related events:
     * - user.presence.changed
     * - user.updated
     * - user.deleted
     *
     * @param {Event} event
     */
    _handleUserEvent: (event: Event<StreamChatGenerics>) => void;
    _handleClientEvent(event: Event<StreamChatGenerics>): (() => void)[];
    _muteStatus(cid: string): {
        muted: boolean;
        createdAt: Date;
        expiresAt: Date | null;
    } | {
        muted: boolean;
        createdAt: null;
        expiresAt: null;
    };
    _callClientListeners: (event: Event<StreamChatGenerics>) => void;
    recoverState: () => Promise<void>;
    /**
     * @private
     */
    connect(): Promise<void | import("./types").ConnectionOpen<StreamChatGenerics>>;
    /**
     * Check the connectivity with server for warmup purpose.
     *
     * @private
     */
    _sayHi(): void;
    /**
     * queryUsers - Query users and watch user presence
     *
     * @param {UserFilters<StreamChatGenerics>} filterConditions MongoDB style filter conditions
     * @param {UserSort<StreamChatGenerics>} sort Sort options, for instance [{last_active: -1}].
     * When using multiple fields, make sure you use array of objects to guarantee field order, for instance [{last_active: -1}, {created_at: 1}]
     * @param {UserOptions} options Option object, {presence: true}
     *
     * @return {Promise<{ users: Array<UserResponse<StreamChatGenerics>> }>} User Query Response
     */
    queryUsers(filterConditions: UserFilters<StreamChatGenerics>, sort?: UserSort<StreamChatGenerics>, options?: UserOptions): Promise<APIResponse & {
        users: Array<UserResponse<StreamChatGenerics>>;
    }>;
    /**
     * queryBannedUsers - Query user bans
     *
     * @param {BannedUsersFilters} filterConditions MongoDB style filter conditions
     * @param {BannedUsersSort} sort Sort options [{created_at: 1}].
     * @param {BannedUsersPaginationOptions} options Option object, {limit: 10, offset:0, exclude_expired_bans: true}
     *
     * @return {Promise<BannedUsersResponse<StreamChatGenerics>>} Ban Query Response
     */
    queryBannedUsers(filterConditions?: BannedUsersFilters, sort?: BannedUsersSort, options?: BannedUsersPaginationOptions): Promise<BannedUsersResponse<StreamChatGenerics>>;
    /**
     * queryMessageFlags - Query message flags
     *
     * @param {MessageFlagsFilters} filterConditions MongoDB style filter conditions
     * @param {MessageFlagsPaginationOptions} options Option object, {limit: 10, offset:0}
     *
     * @return {Promise<MessageFlagsResponse<StreamChatGenerics>>} Message Flags Response
     */
    queryMessageFlags(filterConditions?: MessageFlagsFilters, options?: MessageFlagsPaginationOptions): Promise<MessageFlagsResponse<StreamChatGenerics>>;
    /**
     * queryChannels - Query channels
     *
     * @param {ChannelFilters<StreamChatGenerics>} filterConditions object MongoDB style filters
     * @param {ChannelSort<StreamChatGenerics>} [sort] Sort options, for instance {created_at: -1}.
     * When using multiple fields, make sure you use array of objects to guarantee field order, for instance [{last_updated: -1}, {created_at: 1}]
     * @param {ChannelOptions} [options] Options object
     * @param {ChannelStateOptions} [stateOptions] State options object. These options will only be used for state management and won't be sent in the request.
     * - stateOptions.skipInitialization - Skips the initialization of the state for the channels matching the ids in the list.
     *
     * @return {Promise<{ channels: Array<ChannelAPIResponse<AStreamChatGenerics>>}> } search channels response
     */
    queryChannels(filterConditions: ChannelFilters<StreamChatGenerics>, sort?: ChannelSort<StreamChatGenerics>, options?: ChannelOptions, stateOptions?: ChannelStateOptions): Promise<Channel<StreamChatGenerics>[]>;
    /**
     * queryReactions - Query reactions
     *
     * @param {ReactionFilters<StreamChatGenerics>} filter object MongoDB style filters
     * @param {ReactionSort<StreamChatGenerics>} [sort] Sort options, for instance {created_at: -1}.
     * @param {QueryReactionsOptions} [options] Pagination object
     *
     * @return {Promise<{ QueryReactionsAPIResponse } search channels response
     */
    queryReactions(messageID: string, filter: ReactionFilters<StreamChatGenerics>, sort?: ReactionSort<StreamChatGenerics>, options?: QueryReactionsOptions): Promise<QueryReactionsAPIResponse<StreamChatGenerics>>;
    hydrateActiveChannels(channelsFromApi?: ChannelAPIResponse<StreamChatGenerics>[], stateOptions?: ChannelStateOptions, queryChannelsOptions?: ChannelOptions): Channel<StreamChatGenerics>[];
    /**
     * search - Query messages
     *
     * @param {ChannelFilters<StreamChatGenerics>} filterConditions MongoDB style filter conditions
     * @param {MessageFilters<StreamChatGenerics> | string} query search query or object MongoDB style filters
     * @param {SearchOptions<StreamChatGenerics>} [options] Option object, {user_id: 'tommaso'}
     *
     * @return {Promise<SearchAPIResponse<StreamChatGenerics>>} search messages response
     */
    search(filterConditions: ChannelFilters<StreamChatGenerics>, query: string | MessageFilters<StreamChatGenerics>, options?: SearchOptions<StreamChatGenerics>): Promise<SearchAPIResponse<StreamChatGenerics>>;
    /**
     * setLocalDevice - Set the device info for the current client(device) that will be sent via WS connection automatically
     *
     * @param {BaseDeviceFields} device the device object
     * @param {string} device.id device id
     * @param {string} device.push_provider the push provider
     *
     */
    setLocalDevice(device: BaseDeviceFields): void;
    /**
     * addDevice - Adds a push device for a user.
     *
     * @param {string} id the device id
     * @param {PushProvider} push_provider the push provider
     * @param {string} [userID] the user id (defaults to current user)
     * @param {string} [push_provider_name] user provided push provider name for multi bundle support
     *
     */
    addDevice(id: string, push_provider: PushProvider, userID?: string, push_provider_name?: string): Promise<APIResponse>;
    /**
     * getDevices - Returns the devices associated with a current user
     *
     * @param {string} [userID] User ID. Only works on serverside
     *
     * @return {Device<StreamChatGenerics>[]} Array of devices
     */
    getDevices(userID?: string): Promise<APIResponse & {
        devices?: Device<StreamChatGenerics>[];
    }>;
    /**
     * getUnreadCount - Returns unread counts for a single user
     *
     * @param {string} [userID] User ID.
     *
     * @return {<GetUnreadCountAPIResponse>}
     */
    getUnreadCount(userID?: string): Promise<GetUnreadCountAPIResponse>;
    /**
     * getUnreadCountBatch - Returns unread counts for multiple users at once. Only works server side.
     *
     * @param {string[]} [userIDs] List of user IDs to fetch unread counts for.
     *
     * @return {<GetUnreadCountBatchAPIResponse>}
     */
    getUnreadCountBatch(userIDs: string[]): Promise<GetUnreadCountBatchAPIResponse>;
    /**
     * setPushPreferences - Applies the list of push preferences.
     *
     * @param {PushPreference[]} A list of push preferences.
     *
     * @return {<UpsertPushPreferencesResponse>}
     */
    setPushPreferences(preferences: PushPreference[]): Promise<UpsertPushPreferencesResponse>;
    /**
     * removeDevice - Removes the device with the given id. Clientside users can only delete their own devices
     *
     * @param {string} id The device id
     * @param {string} [userID] The user id. Only specify this for serverside requests
     *
     */
    removeDevice(id: string, userID?: string): Promise<APIResponse>;
    /**
     * getRateLimits - Returns the rate limits quota and usage for the current app, possibly filter for a specific platform and/or endpoints.
     * Only available server-side.
     *
     * @param {object} [params] The params for the call. If none of the params are set, all limits for all platforms are returned.
     * @returns {Promise<GetRateLimitsResponse>}
     */
    getRateLimits(params?: {
        android?: boolean;
        endpoints?: EndpointName[];
        ios?: boolean;
        serverSide?: boolean;
        web?: boolean;
    }): Promise<GetRateLimitsResponse>;
    _addChannelConfig({ cid, config }: ChannelResponse<StreamChatGenerics>): void;
    /**
     * channel - Returns a new channel with the given type, id and custom data
     *
     * If you want to create a unique conversation between 2 or more users; you can leave out the ID parameter and provide the list of members.
     * Make sure to await channel.create() or channel.watch() before accessing channel functions:
     * ie. channel = client.channel("messaging", {members: ["tommaso", "thierry"]})
     * await channel.create() to assign an ID to channel
     *
     * @param {string} channelType The channel type
     * @param {string | ChannelData<StreamChatGenerics> | null} [channelIDOrCustom]   The channel ID, you can leave this out if you want to create a conversation channel
     * @param {object} [custom]    Custom data to attach to the channel
     *
     * @return {channel} The channel object, initialize it using channel.watch()
     */
    channel(channelType: string, channelID?: string | null, custom?: ChannelData<StreamChatGenerics>): Channel<StreamChatGenerics>;
    channel(channelType: string, custom?: ChannelData<StreamChatGenerics>): Channel<StreamChatGenerics>;
    /**
     * It's a helper method for `client.channel()` method, used to create unique conversation or
     * channel based on member list instead of id.
     *
     * If the channel already exists in `activeChannels` list, then we simply return it, since that
     * means the same channel was already requested or created.
     *
     * Otherwise we create a new instance of Channel class and return it.
     *
     * @private
     *
     * @param {string} channelType The channel type
     * @param {object} [custom]    Custom data to attach to the channel
     *
     * @return {channel} The channel object, initialize it using channel.watch()
     */
    getChannelByMembers: (channelType: string, custom: ChannelData<StreamChatGenerics>) => Channel<StreamChatGenerics>;
    /**
     * Its a helper method for `client.channel()` method, used to channel given the id of channel.
     *
     * If the channel already exists in `activeChannels` list, then we simply return it, since that
     * means the same channel was already requested or created.
     *
     * Otherwise we create a new instance of Channel class and return it.
     *
     * @private
     *
     * @param {string} channelType The channel type
     * @param {string} [channelID] The channel ID
     * @param {object} [custom]    Custom data to attach to the channel
     *
     * @return {channel} The channel object, initialize it using channel.watch()
     */
    getChannelById: (channelType: string, channelID: string, custom: ChannelData<StreamChatGenerics>) => Channel<StreamChatGenerics>;
    /**
     * partialUpdateUser - Update the given user object
     *
     * @param {PartialUserUpdate<StreamChatGenerics>} partialUserObject which should contain id and any of "set" or "unset" params;
     * example: {id: "user1", set:{field: value}, unset:["field2"]}
     *
     * @return {Promise<{ users: { [key: string]: UserResponse<StreamChatGenerics> } }>} list of updated users
     */
    partialUpdateUser(partialUserObject: PartialUserUpdate<StreamChatGenerics>): Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * upsertUsers - Batch upsert the list of users
     *
     * @param {UserResponse<StreamChatGenerics>[]} users list of users
     *
     * @return {Promise<{ users: { [key: string]: UserResponse<StreamChatGenerics> } }>}
     */
    upsertUsers(users: UserResponse<StreamChatGenerics>[]): Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * @deprecated Please use upsertUsers() function instead.
     *
     * updateUsers - Batch update the list of users
     *
     * @param {UserResponse<StreamChatGenerics>[]} users list of users
     * @return {Promise<{ users: { [key: string]: UserResponse<StreamChatGenerics> } }>}
     */
    updateUsers: (users: UserResponse<StreamChatGenerics>[]) => Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * upsertUser - Update or Create the given user object
     *
     * @param {UserResponse<StreamChatGenerics>} userObject user object, the only required field is the user id. IE {id: "myuser"} is valid
     *
     * @return {Promise<{ users: { [key: string]: UserResponse<StreamChatGenerics> } }>}
     */
    upsertUser(userObject: UserResponse<StreamChatGenerics>): Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * @deprecated Please use upsertUser() function instead.
     *
     * updateUser - Update or Create the given user object
     *
     * @param {UserResponse<StreamChatGenerics>} userObject user object, the only required field is the user id. IE {id: "myuser"} is valid
     * @return {Promise<{ users: { [key: string]: UserResponse<StreamChatGenerics> } }>}
     */
    updateUser: (userObject: UserResponse<StreamChatGenerics>) => Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    /**
     * partialUpdateUsers - Batch partial update of users
     *
     * @param {PartialUserUpdate<StreamChatGenerics>[]} users list of partial update requests
     *
     * @return {Promise<{ users: { [key: string]: UserResponse<StreamChatGenerics> } }>}
     */
    partialUpdateUsers(users: PartialUserUpdate<StreamChatGenerics>[]): Promise<APIResponse & {
        users: {
            [key: string]: UserResponse<StreamChatGenerics>;
        };
    }>;
    deleteUser(userID: string, params?: {
        delete_conversation_channels?: boolean;
        hard_delete?: boolean;
        mark_messages_deleted?: boolean;
    }): Promise<APIResponse & {
        user: UserResponse<StreamChatGenerics>;
    } & {
        task_id?: string;
    }>;
    /**
     * restoreUsers - Restore soft deleted users
     *
     * @param {string[]} user_ids which users to restore
     *
     * @return {APIResponse} An API response
     */
    restoreUsers(user_ids: string[]): Promise<APIResponse>;
    /**
     * reactivateUser - Reactivate one user
     *
     * @param {string} userID which user to reactivate
     * @param {ReactivateUserOptions} [options]
     *
     * @return {UserResponse} Reactivated user
     */
    reactivateUser(userID: string, options?: ReactivateUserOptions): Promise<APIResponse & {
        user: UserResponse<StreamChatGenerics>;
    }>;
    /**
     * reactivateUsers - Reactivate many users asynchronously
     *
     * @param {string[]} user_ids which users to reactivate
     * @param {ReactivateUsersOptions} [options]
     *
     * @return {TaskResponse} A task ID
     */
    reactivateUsers(user_ids: string[], options?: ReactivateUsersOptions): Promise<APIResponse & TaskResponse>;
    /**
     * deactivateUser - Deactivate one user
     *
     * @param {string} userID which user to deactivate
     * @param {DeactivateUsersOptions} [options]
     *
     * @return {UserResponse} Deactivated user
     */
    deactivateUser(userID: string, options?: DeactivateUsersOptions): Promise<APIResponse & {
        user: UserResponse<StreamChatGenerics>;
    }>;
    /**
     * deactivateUsers - Deactivate many users asynchronously
     *
     * @param {string[]} user_ids which users to deactivate
     * @param {DeactivateUsersOptions} [options]
     *
     * @return {TaskResponse} A task ID
     */
    deactivateUsers(user_ids: string[], options?: DeactivateUsersOptions): Promise<APIResponse & TaskResponse>;
    exportUser(userID: string, options?: Record<string, string>): Promise<APIResponse & {
        messages: MessageResponse<StreamChatGenerics>[];
        reactions: ReactionResponse<StreamChatGenerics>[];
        user: UserResponse<StreamChatGenerics>;
    }>;
    /** banUser - bans a user from all channels
     *
     * @param {string} targetUserID
     * @param {BanUserOptions<StreamChatGenerics>} [options]
     * @returns {Promise<APIResponse>}
     */
    banUser(targetUserID: string, options?: BanUserOptions<StreamChatGenerics>): Promise<APIResponse>;
    /** unbanUser - revoke global ban for a user
     *
     * @param {string} targetUserID
     * @param {UnBanUserOptions} [options]
     * @returns {Promise<APIResponse>}
     */
    unbanUser(targetUserID: string, options?: UnBanUserOptions): Promise<APIResponse>;
    /** shadowBan - shadow bans a user from all channels
     *
     * @param {string} targetUserID
     * @param {BanUserOptions<StreamChatGenerics>} [options]
     * @returns {Promise<APIResponse>}
     */
    shadowBan(targetUserID: string, options?: BanUserOptions<StreamChatGenerics>): Promise<APIResponse>;
    /** removeShadowBan - revoke global shadow ban for a user
     *
     * @param {string} targetUserID
     * @param {UnBanUserOptions} [options]
     * @returns {Promise<APIResponse>}
     */
    removeShadowBan(targetUserID: string, options?: UnBanUserOptions): Promise<APIResponse>;
    blockUser(blockedUserID: string, user_id?: string): Promise<BlockUserAPIResponse>;
    getBlockedUsers(user_id?: string): Promise<GetBlockedUsersAPIResponse>;
    unBlockUser(blockedUserID: string, userID?: string): Promise<APIResponse>;
    /** muteUser - mutes a user
     *
     * @param {string} targetID
     * @param {string} [userID] Only used with serverside auth
     * @param {MuteUserOptions<StreamChatGenerics>} [options]
     * @returns {Promise<MuteUserResponse<StreamChatGenerics>>}
     */
    muteUser(targetID: string, userID?: string, options?: MuteUserOptions<StreamChatGenerics>): Promise<MuteUserResponse<StreamChatGenerics>>;
    /** unmuteUser - unmutes a user
     *
     * @param {string} targetID
     * @param {string} [currentUserID] Only used with serverside auth
     * @returns {Promise<APIResponse>}
     */
    unmuteUser(targetID: string, currentUserID?: string): Promise<APIResponse>;
    /** userMuteStatus - check if a user is muted or not, can be used after connectUser() is called
     *
     * @param {string} targetID
     * @returns {boolean}
     */
    userMuteStatus(targetID: string): boolean;
    /**
     * flagMessage - flag a message
     * @param {string} targetMessageID
     * @param {string} [options.user_id] currentUserID, only used with serverside auth
     * @returns {Promise<APIResponse>}
     */
    flagMessage(targetMessageID: string, options?: {
        reason?: string;
        user_id?: string;
    }): Promise<FlagMessageResponse<StreamChatGenerics>>;
    /**
     * flagUser - flag a user
     * @param {string} targetID
     * @param {string} [options.user_id] currentUserID, only used with serverside auth
     * @returns {Promise<APIResponse>}
     */
    flagUser(targetID: string, options?: {
        reason?: string;
        user_id?: string;
    }): Promise<FlagUserResponse<StreamChatGenerics>>;
    /**
     * unflagMessage - unflag a message
     * @param {string} targetMessageID
     * @param {string} [options.user_id] currentUserID, only used with serverside auth
     * @returns {Promise<APIResponse>}
     */
    unflagMessage(targetMessageID: string, options?: {
        user_id?: string;
    }): Promise<FlagMessageResponse<StreamChatGenerics>>;
    /**
     * unflagUser - unflag a user
     * @param {string} targetID
     * @param {string} [options.user_id] currentUserID, only used with serverside auth
     * @returns {Promise<APIResponse>}
     */
    unflagUser(targetID: string, options?: {
        user_id?: string;
    }): Promise<FlagUserResponse<StreamChatGenerics>>;
    /**
     * getCallToken - retrieves the auth token needed to join a call
     *
     * @param {string} callID
     * @param {object} options
     * @returns {Promise<GetCallTokenResponse>}
     */
    getCallToken(callID: string, options?: {
        user_id?: string;
    }): Promise<GetCallTokenResponse>;
    /**
     * _queryFlags - Query flags.
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {FlagsFilters} filterConditions MongoDB style filter conditions
     * @param {FlagsPaginationOptions} options Option object, {limit: 10, offset:0}
     *
     * @return {Promise<FlagsResponse<StreamChatGenerics>>} Flags Response
     */
    _queryFlags(filterConditions?: FlagsFilters, options?: FlagsPaginationOptions): Promise<FlagsResponse<StreamChatGenerics>>;
    /**
     * _queryFlagReports - Query flag reports.
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {FlagReportsFilters} filterConditions MongoDB style filter conditions
     * @param {FlagReportsPaginationOptions} options Option object, {limit: 10, offset:0}
     *
     * @return {Promise<FlagReportsResponse<StreamChatGenerics>>} Flag Reports Response
     */
    _queryFlagReports(filterConditions?: FlagReportsFilters, options?: FlagReportsPaginationOptions): Promise<FlagReportsResponse<StreamChatGenerics>>;
    /**
     * _reviewFlagReport - review flag report
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {string} [id] flag report to review
     * @param {string} [reviewResult] flag report review result
     * @param {string} [options.user_id] currentUserID, only used with serverside auth
     * @param {string} [options.review_details] custom information about review result
     * @returns {Promise<ReviewFlagReportResponse>>}
     */
    _reviewFlagReport(id: string, reviewResult: string, options?: ReviewFlagReportOptions): Promise<ReviewFlagReportResponse<StreamChatGenerics>>;
    /**
     * unblockMessage - unblocks message blocked by automod
     *
     *
     * @param {string} targetMessageID
     * @param {string} [options.user_id] currentUserID, only used with serverside auth
     * @returns {Promise<APIResponse>}
     */
    unblockMessage(targetMessageID: string, options?: {
        user_id?: string;
    }): Promise<APIResponse>;
    _unblockMessage: (targetMessageID: string, options?: {
        user_id?: string;
    }) => Promise<APIResponse>;
    /**
     * @deprecated use markChannelsRead instead
     *
     * markAllRead - marks all channels for this user as read
     * @param {MarkAllReadOptions<StreamChatGenerics>} [data]
     *
     * @return {Promise<APIResponse>}
     */
    markAllRead: (data?: MarkChannelsReadOptions<StreamChatGenerics>) => Promise<void>;
    /**
     * markChannelsRead - marks channels read -
     * it accepts a map of cid:messageid pairs, if messageid is empty, the whole channel will be marked as read
     *
     * @param {MarkChannelsReadOptions <StreamChatGenerics>} [data]
     *
     * @return {Promise<APIResponse>}
     */
    markChannelsRead(data?: MarkChannelsReadOptions<StreamChatGenerics>): Promise<void>;
    createCommand(data: CreateCommandOptions<StreamChatGenerics>): Promise<CreateCommandResponse<StreamChatGenerics>>;
    getCommand(name: string): Promise<GetCommandResponse<StreamChatGenerics>>;
    updateCommand(name: string, data: UpdateCommandOptions<StreamChatGenerics>): Promise<UpdateCommandResponse<StreamChatGenerics>>;
    deleteCommand(name: string): Promise<DeleteCommandResponse<StreamChatGenerics>>;
    listCommands(): Promise<ListCommandsResponse<StreamChatGenerics>>;
    createChannelType(data: CreateChannelOptions<StreamChatGenerics>): Promise<CreateChannelResponse<StreamChatGenerics>>;
    getChannelType(channelType: string): Promise<GetChannelTypeResponse<StreamChatGenerics>>;
    updateChannelType(channelType: string, data: UpdateChannelOptions<StreamChatGenerics>): Promise<UpdateChannelResponse<StreamChatGenerics>>;
    deleteChannelType(channelType: string): Promise<APIResponse>;
    listChannelTypes(): Promise<ListChannelResponse<StreamChatGenerics>>;
    /**
     * translateMessage - adds the translation to the message
     *
     * @param {string} messageId
     * @param {string} language
     *
     * @return {MessageResponse<StreamChatGenerics>} Response that includes the message
     */
    translateMessage(messageId: string, language: string): Promise<APIResponse & StreamChatGenerics["messageType"] & {
        id: string;
        attachments?: import("./types").Attachment<StreamChatGenerics>[] | undefined;
        html?: string;
        mml?: string;
        parent_id?: string;
        pin_expires?: string | null;
        pinned?: boolean;
        pinned_at?: string | null;
        poll_id?: string;
        quoted_message_id?: string;
        restricted_visibility?: string[];
        show_in_channel?: boolean;
        silent?: boolean;
        text?: string;
        user?: UserResponse<StreamChatGenerics> | null | undefined;
        user_id?: string;
    } & {
        type: import("./types").MessageLabel;
        args?: string;
        before_message_send_failed?: boolean;
        channel?: ChannelResponse<StreamChatGenerics> | undefined;
        cid?: string;
        command?: string;
        command_info?: {
            name?: string;
        };
        created_at?: string;
        deleted_at?: string;
        deleted_reply_count?: number;
        i18n?: import("./types").RequireAtLeastOne<Record<`${import("./types").TranslationLanguages}_text`, string>> & {
            language: import("./types").TranslationLanguages;
        };
        latest_reactions?: ReactionResponse<StreamChatGenerics>[] | undefined;
        mentioned_users?: UserResponse<StreamChatGenerics>[] | undefined;
        message_text_updated_at?: string;
        moderation?: import("./types").ModerationResponse;
        moderation_details?: import("./types").ModerationDetailsResponse;
        own_reactions?: ReactionResponse<StreamChatGenerics>[] | null | undefined;
        pin_expires?: string | null;
        pinned_at?: string | null;
        pinned_by?: UserResponse<StreamChatGenerics> | null | undefined;
        poll?: import("./types").PollResponse<StreamChatGenerics> | undefined;
        reaction_counts?: {
            [key: string]: number;
        } | null;
        reaction_groups?: {
            [key: string]: import("./types").ReactionGroupResponse;
        } | null;
        reaction_scores?: {
            [key: string]: number;
        } | null;
        reply_count?: number;
        shadowed?: boolean;
        status?: string;
        thread_participants?: UserResponse<StreamChatGenerics>[] | undefined;
        updated_at?: string;
    } & {
        quoted_message?: import("./types").MessageResponseBase<StreamChatGenerics> | undefined;
    }>;
    /**
     * translate - translates the given text to provided language
     *
     * @param {string} text
     * @param {string} destination_language
     * @param {string} source_language
     *
     * @return {TranslateResponse} Response that includes the message
     */
    translate(text: string, destination_language: string, source_language: string): Promise<APIResponse & TranslateResponse>;
    /**
     * _normalizeExpiration - transforms expiration value into ISO string
     * @param {undefined|null|number|string|Date} timeoutOrExpirationDate expiration date or timeout. Use number type to set timeout in seconds, string or Date to set exact expiration date
     */
    _normalizeExpiration(timeoutOrExpirationDate?: null | number | string | Date): string | null;
    /**
     * _messageId - extracts string message id from either message object or message id
     * @param {string | { id: string }} messageOrMessageId message object or message id
     * @param {string} errorText error message to report in case of message id absence
     */
    _validateAndGetMessageId(messageOrMessageId: string | {
        id: string;
    }, errorText: string): string;
    /**
     * pinMessage - pins the message
     * @param {string | { id: string }} messageOrMessageId message object or message id
     * @param {undefined|null|number|string|Date} timeoutOrExpirationDate expiration date or timeout. Use number type to set timeout in seconds, string or Date to set exact expiration date
     * @param {undefined|string | { id: string }} [pinnedBy] who will appear as a user who pinned a message. Only for server-side use. Provide `undefined` when pinning message client-side
     * @param {undefined|number|string|Date} pinnedAt date when message should be pinned. It affects the order of pinned messages. Use negative number to set relative time in the past, string or Date to set exact date of pin
     */
    pinMessage(messageOrMessageId: string | {
        id: string;
    }, timeoutOrExpirationDate?: null | number | string | Date, pinnedBy?: string | {
        id: string;
    }, pinnedAt?: number | string | Date): Promise<UpdateMessageAPIResponse<StreamChatGenerics>>;
    /**
     * unpinMessage - unpins the message that was previously pinned
     * @param {string | { id: string }} messageOrMessageId message object or message id
     * @param {string | { id: string }} [userId]
     */
    unpinMessage(messageOrMessageId: string | {
        id: string;
    }, userId?: string | {
        id: string;
    }): Promise<UpdateMessageAPIResponse<StreamChatGenerics>>;
    /**
     * updateMessage - Update the given message
     *
     * @param {Omit<MessageResponse<StreamChatGenerics>, 'mentioned_users'> & { mentioned_users?: string[] }} message object, id needs to be specified
     * @param {string | { id: string }} [userId]
     * @param {boolean} [options.skip_enrich_url] Do not try to enrich the URLs within message
     *
     * @return {{ message: MessageResponse<StreamChatGenerics> }} Response that includes the message
     */
    updateMessage(message: UpdatedMessage<StreamChatGenerics>, userId?: string | {
        id: string;
    }, options?: UpdateMessageOptions): Promise<UpdateMessageAPIResponse<StreamChatGenerics>>;
    /**
     * partialUpdateMessage - Update the given message id while retaining additional properties
     *
     * @param {string} id the message id
     *
     * @param {PartialUpdateMessage<StreamChatGenerics>}  partialMessageObject which should contain id and any of "set" or "unset" params;
     *         example: {id: "user1", set:{text: "hi"}, unset:["color"]}
     * @param {string | { id: string }} [userId]
     *
     * @param {boolean} [options.skip_enrich_url] Do not try to enrich the URLs within message
     *
     * @return {{ message: MessageResponse<StreamChatGenerics> }} Response that includes the updated message
     */
    partialUpdateMessage(id: string, partialMessageObject: PartialMessageUpdate<StreamChatGenerics>, userId?: string | {
        id: string;
    }, options?: UpdateMessageOptions): Promise<UpdateMessageAPIResponse<StreamChatGenerics>>;
    deleteMessage(messageID: string, hardDelete?: boolean): Promise<APIResponse & {
        message: MessageResponse<StreamChatGenerics>;
    }>;
    /**
     * undeleteMessage - Undelete a message
     *
     * undeletes a message that was previous soft deleted. Hard deleted messages
     * cannot be undeleted. This is only allowed to be called from server-side
     * clients.
     *
     * @param {string} messageID The id of the message to undelete
     * @param {string} userID The id of the user who undeleted the message
     *
     * @return {{ message: MessageResponse<StreamChatGenerics> }} Response that includes the message
     */
    undeleteMessage(messageID: string, userID: string): Promise<APIResponse & {
        message: MessageResponse<StreamChatGenerics>;
    }>;
    getMessage(messageID: string, options?: GetMessageOptions): Promise<GetMessageAPIResponse<StreamChatGenerics>>;
    /**
     * queryThreads - returns the list of threads of current user.
     *
     * @param {QueryThreadsOptions} options Options object for pagination and limiting the participants and replies.
     * @param {number}  options.limit Limits the number of threads to be returned.
     * @param {boolean} options.watch Subscribes the user to the channels of the threads.
     * @param {number}  options.participant_limit Limits the number of participants returned per threads.
     * @param {number}  options.reply_limit Limits the number of replies returned per threads.
     *
     * @returns {{ threads: Thread<StreamChatGenerics>[], next: string }} Returns the list of threads and the next cursor.
     */
    queryThreads(options?: QueryThreadsOptions): Promise<{
        threads: Thread<StreamChatGenerics>[];
        next: string | undefined;
    }>;
    /**
     * getThread - returns the thread of a message by its id.
     *
     * @param {string}            messageId The message id
     * @param {GetThreadOptions}  options Options object for pagination and limiting the participants and replies.
     * @param {boolean}           options.watch Subscribes the user to the channel of the thread.
     * @param {number}            options.participant_limit Limits the number of participants returned per threads.
     * @param {number}            options.reply_limit Limits the number of replies returned per threads.
     *
     * @returns {Thread<StreamChatGenerics>} Returns the thread.
     */
    getThread(messageId: string, options?: GetThreadOptions): Promise<Thread<StreamChatGenerics>>;
    /**
     * partialUpdateThread - updates the given thread
     *
     * @param {string}              messageId The id of the thread message which needs to be updated.
     * @param {PartialThreadUpdate} partialThreadObject should contain "set" or "unset" params for any of the thread's non-reserved fields.
     *
     * @returns {GetThreadAPIResponse<StreamChatGenerics>} Returns the updated thread.
     */
    partialUpdateThread(messageId: string, partialThreadObject: PartialThreadUpdate): Promise<GetThreadAPIResponse<StreamChatGenerics>>;
    getUserAgent(): string;
    /**
     * @deprecated use sdkIdentifier instead
     * @param userAgent
     */
    setUserAgent(userAgent: string): void;
    /**
     * _isUsingServerAuth - Returns true if we're using server side auth
     */
    _isUsingServerAuth: () => boolean;
    _cacheEnabled: () => boolean;
    _enrichAxiosOptions(options?: AxiosRequestConfig & {
        config?: AxiosRequestConfig;
    }): AxiosRequestConfig;
    _getToken(): string | null | undefined;
    _startCleaning(): void;
    /**
     * encode ws url payload
     * @private
     * @returns json string
     */
    _buildWSPayload: (client_request_id?: string) => string;
    /**
     * checks signature of a request
     * @param {string | Buffer} rawBody
     * @param {string} signature from HTTP header
     * @returns {boolean}
     */
    verifyWebhook(requestBody: string | Buffer, xSignature: string): boolean;
    /** getPermission - gets the definition for a permission
     *
     * @param {string} name
     * @returns {Promise<PermissionAPIResponse>}
     */
    getPermission(name: string): Promise<PermissionAPIResponse>;
    /** createPermission - creates a custom permission
     *
     * @param {CustomPermissionOptions} permissionData the permission data
     * @returns {Promise<APIResponse>}
     */
    createPermission(permissionData: CustomPermissionOptions): Promise<APIResponse>;
    /** updatePermission - updates an existing custom permission
     *
     * @param {string} id
     * @param {Omit<CustomPermissionOptions, 'id'>} permissionData the permission data
     * @returns {Promise<APIResponse>}
     */
    updatePermission(id: string, permissionData: Omit<CustomPermissionOptions, 'id'>): Promise<APIResponse>;
    /** deletePermission - deletes a custom permission
     *
     * @param {string} name
     * @returns {Promise<APIResponse>}
     */
    deletePermission(name: string): Promise<APIResponse>;
    /** listPermissions - returns the list of all permissions for this application
     *
     * @returns {Promise<APIResponse>}
     */
    listPermissions(): Promise<PermissionsAPIResponse>;
    /** createRole - creates a custom role
     *
     * @param {string} name the new role name
     * @returns {Promise<APIResponse>}
     */
    createRole(name: string): Promise<APIResponse>;
    /** listRoles - returns the list of all roles for this application
     *
     * @returns {Promise<APIResponse>}
     */
    listRoles(): Promise<APIResponse>;
    /** deleteRole - deletes a custom role
     *
     * @param {string} name the role name
     * @returns {Promise<APIResponse>}
     */
    deleteRole(name: string): Promise<APIResponse>;
    /** sync - returns all events that happened for a list of channels since last sync
     * @param {string[]} channel_cids list of channel CIDs
     * @param {string} last_sync_at last time the user was online and in sync. RFC3339 ie. "2020-05-06T15:05:01.207Z"
     * @param {SyncOptions} options See JSDoc in the type fields for more info
     *
     * @returns {Promise<SyncResponse>}
     */
    sync(channel_cids: string[], last_sync_at: string, options?: SyncOptions): Promise<SyncResponse>;
    /**
     * sendUserCustomEvent - Send a custom event to a user
     *
     * @param {string} targetUserID target user id
     * @param {UserCustomEvent} event for example {type: 'friendship-request'}
     *
     * @return {Promise<APIResponse>} The Server Response
     */
    sendUserCustomEvent(targetUserID: string, event: UserCustomEvent): Promise<APIResponse>;
    /**
     * Creates a new block list
     *
     * @param {BlockList} blockList - The block list to create
     * @param {string} blockList.name - The name of the block list
     * @param {string[]} blockList.words - List of words to block
     * @param {string} [blockList.team] - Team ID the block list belongs to
     *
     * @returns {Promise<APIResponse>} The server response
     */
    createBlockList(blockList: BlockList): Promise<APIResponse>;
    /**
     * Lists all block lists
     *
     * @param {Object} [data] - Query parameters
     * @param {string} [data.team] - Team ID to filter block lists by
     *
     * @returns {Promise<APIResponse & {blocklists: BlockListResponse[]}>} Response containing array of block lists
     */
    listBlockLists(data?: {
        team?: string;
    }): Promise<APIResponse & {
        blocklists: BlockListResponse[];
    }>;
    /**
     * Gets a specific block list
     *
     * @param {string} name - The name of the block list to retrieve
     * @param {Object} [data] - Query parameters
     * @param {string} [data.team] - Team ID that blocklist belongs to
     *
     * @returns {Promise<APIResponse & {blocklist: BlockListResponse}>} Response containing the block list
     */
    getBlockList(name: string, data?: {
        team?: string;
    }): Promise<APIResponse & {
        blocklist: BlockListResponse;
    }>;
    /**
     * Updates an existing block list
     *
     * @param {string} name - The name of the block list to update
     * @param {Object} data - The update data
     * @param {string[]} data.words - New list of words to block
     * @param {string} [data.team] - Team ID that blocklist belongs to
     *
     * @returns {Promise<APIResponse>} The server response
     */
    updateBlockList(name: string, data: {
        words: string[];
        team?: string;
    }): Promise<APIResponse>;
    /**
     * Deletes a block list
     *
     * @param {string} name - The name of the block list to delete
     * @param {Object} [data] - Query parameters
     * @param {string} [data.team] - Team ID that blocklist belongs to
     *
     * @returns {Promise<APIResponse>} The server response
     */
    deleteBlockList(name: string, data?: {
        team?: string;
    }): Promise<APIResponse>;
    exportChannels(request: Array<ExportChannelRequest>, options?: ExportChannelOptions): Promise<APIResponse & ExportChannelResponse>;
    exportUsers(request: ExportUsersRequest): Promise<APIResponse & ExportUsersResponse>;
    exportChannel(request: ExportChannelRequest, options?: ExportChannelOptions): Promise<APIResponse & ExportChannelResponse>;
    getExportChannelStatus(id: string): Promise<APIResponse & ExportChannelStatusResponse>;
    campaign(idOrData: string | CampaignData, data?: CampaignData): Campaign<StreamChatGenerics>;
    segment(type: SegmentType, idOrData: string | SegmentData, data?: SegmentData): Segment<StreamChatGenerics>;
    validateServerSideAuth(): void;
    /**
     * createSegment - Creates a segment
     *
     * @private
     * @param {SegmentType} type Segment type
     * @param {string} id Segment ID
     * @param {string} name Segment name
     * @param {SegmentData} params Segment data
     *
     * @return {{segment: SegmentResponse} & APIResponse} The created Segment
     */
    createSegment(type: SegmentType, id: string | null, data?: SegmentData): Promise<{
        segment: SegmentResponse;
    }>;
    /**
     * createUserSegment - Creates a user segment
     *
     * @param {string} id Segment ID
     * @param {string} name Segment name
     * @param {SegmentData} data Segment data
     *
     * @return {Segment} The created Segment
     */
    createUserSegment(id: string | null, data?: SegmentData): Promise<{
        segment: SegmentResponse;
    }>;
    /**
     * createChannelSegment - Creates a channel segment
     *
     * @param {string} id Segment ID
     * @param {string} name Segment name
     * @param {SegmentData} data Segment data
     *
     * @return {Segment} The created Segment
     */
    createChannelSegment(id: string | null, data?: SegmentData): Promise<{
        segment: SegmentResponse;
    }>;
    getSegment(id: string): Promise<{
        segment: SegmentResponse;
    } & APIResponse>;
    /**
     * updateSegment - Update a segment
     *
     * @param {string} id Segment ID
     * @param {Partial<UpdateSegmentData>} data Data to update
     *
     * @return {Segment} Updated Segment
     */
    updateSegment(id: string, data: Partial<UpdateSegmentData>): Promise<{
        segment: SegmentResponse;
    }>;
    /**
     * addSegmentTargets - Add targets to a segment
     *
     * @param {string} id Segment ID
     * @param {string[]} targets Targets to add to the segment
     *
     * @return {APIResponse} API response
     */
    addSegmentTargets(id: string, targets: string[]): Promise<APIResponse>;
    querySegmentTargets(id: string, filter?: QuerySegmentTargetsFilter | null, sort?: SortParam[] | null | [], options?: {}): Promise<{
        targets: SegmentTargetsResponse[];
        next?: string;
    } & APIResponse>;
    /**
     * removeSegmentTargets - Remove targets from a segment
     *
     * @param {string} id Segment ID
     * @param {string[]} targets Targets to add to the segment
     *
     * @return {APIResponse} API response
     */
    removeSegmentTargets(id: string, targets: string[]): Promise<APIResponse>;
    /**
     * querySegments - Query Segments
     *
     * @param {filter} filter MongoDB style filter conditions
     * @param {QuerySegmentsOptions} options Options for sorting/paginating the results
     *
     * @return {Segment[]} Segments
     */
    querySegments(filter: {}, sort?: SortParam[], options?: QuerySegmentsOptions): Promise<{
        segments: SegmentResponse[];
        next?: string;
        prev?: string;
    } & APIResponse>;
    /**
     * deleteSegment - Delete a Campaign Segment
     *
     * @param {string} id Segment ID
     *
     * @return {Promise<APIResponse>} The Server Response
     */
    deleteSegment(id: string): Promise<APIResponse>;
    /**
     * segmentTargetExists - Check if a target exists in a segment
     *
     * @param {string} segmentId Segment ID
     * @param {string} targetId Target ID
     *
     * @return {Promise<APIResponse>} The Server Response
     */
    segmentTargetExists(segmentId: string, targetId: string): Promise<APIResponse>;
    /**
     * createCampaign - Creates a Campaign
     *
     * @param {CampaignData} params Campaign data
     *
     * @return {Campaign} The Created Campaign
     */
    createCampaign(params: CampaignData): Promise<{
        campaign: CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    } & APIResponse>;
    getCampaign(id: string, options?: GetCampaignOptions): Promise<{
        campaign: CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    } & APIResponse>;
    startCampaign(id: string, options?: {
        scheduledFor?: string;
        stopAt?: string;
    }): Promise<{
        campaign: CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    } & APIResponse>;
    /**
     * queryCampaigns - Query Campaigns
     *
     *
     * @return {Campaign[]} Campaigns
     */
    queryCampaigns(filter: CampaignFilters, sort?: CampaignSort, options?: CampaignQueryOptions): Promise<{
        campaigns: CampaignResponse[];
        next?: string;
        prev?: string;
    } & APIResponse>;
    /**
     * updateCampaign - Update a Campaign
     *
     * @param {string} id Campaign ID
     * @param {Partial<CampaignData>} params Campaign data
     *
     * @return {Campaign} Updated Campaign
     */
    updateCampaign(id: string, params: Partial<CampaignData>): Promise<{
        campaign: CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    }>;
    /**
     * deleteCampaign - Delete a Campaign
     *
     * @param {string} id Campaign ID
     *
     * @return {Promise<APIResponse>} The Server Response
     */
    deleteCampaign(id: string): Promise<APIResponse>;
    /**
     * stopCampaign - Stop a Campaign
     *
     * @param {string} id Campaign ID
     *
     * @return {Campaign} Stopped Campaign
     */
    stopCampaign(id: string): Promise<{
        campaign: CampaignResponse;
    }>;
    /**
     * enrichURL - Get OpenGraph data of the given link
     *
     * @param {string} url link
     * @return {OGAttachment} OG Attachment
     */
    enrichURL(url: string): Promise<APIResponse & OGAttachment>;
    /**
     * getTask - Gets status of a long running task
     *
     * @param {string} id Task ID
     *
     * @return {TaskStatus} The task status
     */
    getTask(id: string): Promise<APIResponse & TaskStatus>;
    /**
     * deleteChannels - Deletes a list of channel
     *
     * @param {string[]} cids Channel CIDs
     * @param {boolean} [options.hard_delete] Defines if the channel is hard deleted or not
     *
     * @return {DeleteChannelsResponse} Result of the soft deletion, if server-side, it holds the task ID as well
     */
    deleteChannels(cids: string[], options?: {
        hard_delete?: boolean;
    }): Promise<APIResponse & {
        result: Record<string, string>;
    } & Partial<TaskResponse>>;
    /**
     * deleteUsers - Batch Delete Users
     *
     * @param {string[]} user_ids which users to delete
     * @param {DeleteUserOptions} options Configuration how to delete users
     *
     * @return {TaskResponse} A task ID
     */
    deleteUsers(user_ids: string[], options?: DeleteUserOptions): Promise<APIResponse & TaskResponse>;
    /**
     * _createImportURL - Create an Import upload url.
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {string} filename filename of uploaded data
     * @return {APIResponse & CreateImportResponse} An ImportTask
     */
    _createImportURL(filename: string): Promise<APIResponse & CreateImportURLResponse>;
    /**
     * _createImport - Create an Import Task.
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {string} path path of uploaded data
     * @param {CreateImportOptions} options import options
     * @return {APIResponse & CreateImportResponse} An ImportTask
     */
    _createImport(path: string, options?: CreateImportOptions): Promise<APIResponse & CreateImportResponse>;
    /**
     * _getImport - Get an Import Task.
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {string} id id of Import Task
     *
     * @return {APIResponse & GetImportResponse} An ImportTask
     */
    _getImport(id: string): Promise<APIResponse & GetImportResponse>;
    /**
     * _listImports - Lists Import Tasks.
     *
     * Note: Do not use this.
     * It is present for internal usage only.
     * This function can, and will, break and/or be removed at any point in time.
     *
     * @private
     * @param {ListImportsPaginationOptions} options pagination options
     *
     * @return {APIResponse & ListImportsResponse} An ImportTask
     */
    _listImports(options: ListImportsPaginationOptions): Promise<APIResponse & ListImportsResponse>;
    /**
     * upsertPushProvider - Create or Update a push provider
     *
     * Note: Works only for v2 push version is enabled on app settings.
     *
     * @param {PushProviderConfig} configuration of the provider you want to create or update
     *
     * @return {APIResponse & PushProviderUpsertResponse} A push provider
     */
    upsertPushProvider(pushProvider: PushProviderConfig): Promise<APIResponse & PushProviderUpsertResponse>;
    /**
     * deletePushProvider - Delete a push provider
     *
     * Note: Works only for v2 push version is enabled on app settings.
     *
     * @param {PushProviderID} type and foreign id of the push provider to be deleted
     *
     * @return {APIResponse} An API response
     */
    deletePushProvider({ type, name }: PushProviderID): Promise<APIResponse>;
    /**
     * listPushProviders - Get all push providers in the app
     *
     * Note: Works only for v2 push version is enabled on app settings.
     *
     * @return {APIResponse & PushProviderListResponse} A push provider
     */
    listPushProviders(): Promise<APIResponse & PushProviderListResponse>;
    /**
     * creates an abort controller that will be used by the next HTTP Request.
     */
    createAbortControllerForNextRequest(): AbortController;
    /**
     * commits a pending message, making it visible in the channel and for other users
     * @param id the message id
     *
     * @return {APIResponse & MessageResponse} The message
     */
    commitMessage(id: string): Promise<APIResponse & import("./types").UR & {
        id: string;
        attachments?: import("./types").Attachment<DefaultGenerics>[] | undefined;
        html?: string;
        mml?: string;
        parent_id?: string;
        pin_expires?: string | null;
        pinned?: boolean;
        pinned_at?: string | null;
        poll_id?: string;
        quoted_message_id?: string;
        restricted_visibility?: string[];
        show_in_channel?: boolean;
        silent?: boolean;
        text?: string;
        user?: UserResponse<DefaultGenerics> | null | undefined;
        user_id?: string;
    } & {
        type: import("./types").MessageLabel;
        args?: string;
        before_message_send_failed?: boolean;
        channel?: ChannelResponse<DefaultGenerics> | undefined;
        cid?: string;
        command?: string;
        command_info?: {
            name?: string;
        };
        created_at?: string;
        deleted_at?: string;
        deleted_reply_count?: number;
        i18n?: import("./types").RequireAtLeastOne<Record<`${import("./types").TranslationLanguages}_text`, string>> & {
            language: import("./types").TranslationLanguages;
        };
        latest_reactions?: ReactionResponse<DefaultGenerics>[] | undefined;
        mentioned_users?: UserResponse<DefaultGenerics>[] | undefined;
        message_text_updated_at?: string;
        moderation?: import("./types").ModerationResponse;
        moderation_details?: import("./types").ModerationDetailsResponse;
        own_reactions?: ReactionResponse<DefaultGenerics>[] | null | undefined;
        pin_expires?: string | null;
        pinned_at?: string | null;
        pinned_by?: UserResponse<DefaultGenerics> | null | undefined;
        poll?: import("./types").PollResponse<DefaultGenerics> | undefined;
        reaction_counts?: {
            [key: string]: number;
        } | null;
        reaction_groups?: {
            [key: string]: import("./types").ReactionGroupResponse;
        } | null;
        reaction_scores?: {
            [key: string]: number;
        } | null;
        reply_count?: number;
        shadowed?: boolean;
        status?: string;
        thread_participants?: UserResponse<DefaultGenerics>[] | undefined;
        updated_at?: string;
    } & {
        quoted_message?: import("./types").MessageResponseBase<DefaultGenerics> | undefined;
    }>;
    /**
     * Creates a poll
     * @param poll PollData The poll that will be created
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & CreatePollAPIResponse} The poll
     */
    createPoll(poll: CreatePollData<StreamChatGenerics>, userId?: string): Promise<APIResponse & CreatePollAPIResponse<StreamChatGenerics>>;
    /**
     * Retrieves a poll
     * @param id string The poll id
     *  @param userId string The user id (only serverside)
     * @returns {APIResponse & GetPollAPIResponse} The poll
     */
    getPoll(id: string, userId?: string): Promise<APIResponse & GetPollAPIResponse<StreamChatGenerics>>;
    /**
     * Updates a poll
     * @param poll PollData The poll that will be updated
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & PollResponse} The poll
     */
    updatePoll(poll: PollData<StreamChatGenerics>, userId?: string): Promise<APIResponse & UpdatePollAPIResponse<StreamChatGenerics>>;
    /**
     * Partially updates a poll
     * @param id string The poll id
     * @param {PartialPollUpdate<StreamChatGenerics>} partialPollObject which should contain id and any of "set" or "unset" params;
     * @param userId string The user id (only serverside)
     * example: {id: "44f26af5-f2be-4fa7-9dac-71cf893781de", set:{field: value}, unset:["field2"]}
     * @returns {APIResponse & UpdatePollAPIResponse} The poll
     */
    partialUpdatePoll(id: string, partialPollObject: PartialPollUpdate<StreamChatGenerics>, userId?: string): Promise<APIResponse & UpdatePollAPIResponse<StreamChatGenerics>>;
    /**
     * Delete a poll
     * @param id string The poll id
     * @param userId string The user id (only serverside)
     * @returns
     */
    deletePoll(id: string, userId?: string): Promise<APIResponse>;
    /**
     * Close a poll
     * @param id string The poll id
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & UpdatePollAPIResponse} The poll
     */
    closePoll(id: string, userId?: string): Promise<APIResponse & UpdatePollAPIResponse<StreamChatGenerics>>;
    /**
     * Creates a poll option
     * @param pollId string The poll id
     * @param option PollOptionData The poll option that will be created
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & PollOptionResponse} The poll option
     */
    createPollOption(pollId: string, option: PollOptionData<StreamChatGenerics>, userId?: string): Promise<APIResponse & CreatePollOptionAPIResponse<StreamChatGenerics>>;
    /**
     * Retrieves a poll option
     * @param pollId string The poll id
     * @param optionId string The poll option id
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & PollOptionResponse} The poll option
     */
    getPollOption(pollId: string, optionId: string, userId?: string): Promise<APIResponse & GetPollOptionAPIResponse<StreamChatGenerics>>;
    /**
     * Updates a poll option
     * @param pollId string The poll id
     * @param option PollOptionData The poll option that will be updated
     * @param userId string The user id (only serverside)
     * @returns
     */
    updatePollOption(pollId: string, option: PollOptionData<StreamChatGenerics>, userId?: string): Promise<APIResponse & UpdatePollOptionAPIResponse<StreamChatGenerics>>;
    /**
     * Delete a poll option
     * @param pollId string The poll id
     * @param optionId string The poll option id
     * @param userId string The user id (only serverside)
     * @returns {APIResponse} The poll option
     */
    deletePollOption(pollId: string, optionId: string, userId?: string): Promise<APIResponse>;
    /**
     * Cast vote on a poll
     * @param messageId string The message id
     * @param pollId string The poll id
     * @param vote PollVoteData The vote that will be casted
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & CastVoteAPIResponse} The poll vote
     */
    castPollVote(messageId: string, pollId: string, vote: PollVoteData, userId?: string): Promise<APIResponse & CastVoteAPIResponse<StreamChatGenerics>>;
    /**
     * Add a poll answer
     * @param messageId string The message id
     * @param pollId string The poll id
     * @param answerText string The answer text
     * @param userId string The user id (only serverside)
     */
    addPollAnswer(messageId: string, pollId: string, answerText: string, userId?: string): Promise<APIResponse & CastVoteAPIResponse<StreamChatGenerics>>;
    removePollVote(messageId: string, pollId: string, voteId: string, userId?: string): Promise<APIResponse & {
        vote: PollVote;
    }>;
    /**
     * Queries polls
     * @param filter
     * @param sort
     * @param options Option object, {limit: 10, offset:0}
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & QueryPollsResponse} The polls
     */
    queryPolls(filter?: QueryPollsFilters, sort?: PollSort, options?: QueryPollsOptions, userId?: string): Promise<APIResponse & QueryPollsResponse<StreamChatGenerics>>;
    /**
     * Queries poll votes
     * @param pollId
     * @param filter
     * @param sort
     * @param options Option object, {limit: 10, offset:0}
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & PollVotesAPIResponse} The poll votes
     */
    queryPollVotes(pollId: string, filter?: QueryVotesFilters, sort?: VoteSort, options?: QueryVotesOptions, userId?: string): Promise<APIResponse & PollVotesAPIResponse<StreamChatGenerics>>;
    /**
     * Queries poll answers
     * @param pollId
     * @param filter
     * @param sort
     * @param options Option object, {limit: 10, offset:0}
     * @param userId string The user id (only serverside)
     * @returns {APIResponse & PollAnswersAPIResponse} The poll votes
     */
    queryPollAnswers(pollId: string, filter?: QueryVotesFilters, sort?: VoteSort, options?: QueryVotesOptions, userId?: string): Promise<APIResponse & PollAnswersAPIResponse<StreamChatGenerics>>;
    /**
     * Query message history
     * @param filter
     * @param sort
     * @param options Option object, {limit: 10}
     * @returns {APIResponse & QueryMessageHistoryResponse} The message histories
     */
    queryMessageHistory(filter?: QueryMessageHistoryFilters, sort?: QueryMessageHistorySort, options?: QueryMessageHistoryOptions): Promise<APIResponse & QueryMessageHistoryResponse<StreamChatGenerics>>;
    /**
     * updateFlags - reviews/unflags flagged message
     *
     * @param {string[]} message_ids list of message IDs
     * @param {string} options Option object in case user ID is set to review all the flagged messages by the user
     * @param {string} reviewed_by user ID who reviewed the flagged message
     * @returns {APIResponse}
     */
    updateFlags(message_ids: string[], reviewed_by: string, options?: {
        user_id?: string;
    }): Promise<APIResponse>;
    /**
     * queryDrafts - Queries drafts for the current user
     *
     * @param {object} [options] Query options
     * @param {object} [options.filter] Filters for the query
     * @param {number} [options.sort] Sort parameters
     * @param {number} [options.limit] Limit the number of results
     * @param {string} [options.next] Pagination parameter
     * @param {string} [options.prev] Pagination parameter
     * @param {string} [options.user_id] Has to be provided when called server-side
     *
     * @return {Promise<APIResponse & { drafts: DraftResponse<StreamChatGenerics>[]; next?: string }>} Response containing the drafts
     */
    queryDrafts(options?: Pager & {
        filter?: DraftFilters<StreamChatGenerics>;
        sort?: DraftSort;
        user_id?: string;
    }): Promise<QueryDraftsResponse<StreamChatGenerics>>;
}
//# sourceMappingURL=client.d.ts.map