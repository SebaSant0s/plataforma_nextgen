import { ChannelState } from './channel_state';
import { StreamChat } from './client';
import { APIResponse, BanUserOptions, ChannelAPIResponse, ChannelData, ChannelMemberAPIResponse, ChannelMemberResponse, ChannelQueryOptions, ChannelResponse, ChannelUpdateOptions, CreateCallOptions, CreateCallResponse, DefaultGenerics, DeleteChannelAPIResponse, Event, EventAPIResponse, EventHandler, EventTypes, ExtendableGenerics, FormatMessageResponse, GetMultipleMessagesAPIResponse, GetReactionsAPIResponse, GetRepliesAPIResponse, InviteOptions, MarkReadOptions, MarkUnreadOptions, MemberFilters, MemberSort, Message, MessageFilters, MessagePaginationOptions, MessageResponse, MessageSetType, MuteChannelAPIResponse, NewMemberPayload, PartialUpdateChannel, PartialUpdateChannelAPIResponse, PartialUpdateMember, PinnedMessagePaginationOptions, PinnedMessagesSort, QueryMembersOptions, Reaction, ReactionAPIResponse, SearchAPIResponse, SearchOptions, SendMessageAPIResponse, TruncateChannelAPIResponse, TruncateOptions, UpdateChannelAPIResponse, UserResponse, QueryChannelAPIResponse, PollVoteData, SendMessageOptions, AscDesc, PartialUpdateMemberAPIResponse, AIState, MessageOptions, PushPreference, CreateDraftResponse, GetDraftResponse, DraftMessagePayload } from './types';
import { Role } from './permissions';
/**
 * Channel - The Channel class manages it's own state.
 */
export declare class Channel<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    _client: StreamChat<StreamChatGenerics>;
    type: string;
    id: string | undefined;
    data: ChannelData<StreamChatGenerics> | ChannelResponse<StreamChatGenerics> | undefined;
    _data: ChannelData<StreamChatGenerics> | ChannelResponse<StreamChatGenerics>;
    cid: string;
    /**  */
    listeners: {
        [key: string]: (string | EventHandler<StreamChatGenerics>)[];
    };
    state: ChannelState<StreamChatGenerics>;
    /**
     * This boolean is a vague indication of weather the channel exists on chat backend.
     *
     * If the value is true, then that means the channel has been initialized by either calling
     * channel.create() or channel.query() or channel.watch().
     *
     * If the value is false, then channel may or may not exist on the backend. The only way to ensure
     * is by calling channel.create() or channel.query() or channel.watch().
     */
    initialized: boolean;
    /**
     * Indicates weather channel has been initialized by manually populating the state with some messages, members etc.
     * Static state indicates that channel exists on backend, but is not being watched yet.
     */
    offlineMode: boolean;
    lastKeyStroke?: Date;
    lastTypingEvent: Date | null;
    isTyping: boolean;
    disconnected: boolean;
    push_preferences?: PushPreference;
    /**
     * constructor - Create a channel
     *
     * @param {StreamChat<StreamChatGenerics>} client the chat client
     * @param {string} type  the type of channel
     * @param {string} [id]  the id of the chat
     * @param {ChannelData<StreamChatGenerics>} data any additional custom params
     *
     * @return {Channel<StreamChatGenerics>} Returns a new uninitialized channel
     */
    constructor(client: StreamChat<StreamChatGenerics>, type: string, id: string | undefined, data: ChannelData<StreamChatGenerics>);
    /**
     * getClient - Get the chat client for this channel. If client.disconnect() was called, this function will error
     *
     * @return {StreamChat<StreamChatGenerics>}
     */
    getClient(): StreamChat<StreamChatGenerics>;
    /**
     * getConfig - Get the config for this channel id (cid)
     *
     * @return {Record<string, unknown>}
     */
    getConfig(): import("./types").ChannelConfigWithInfo<StreamChatGenerics> | undefined;
    /**
     * sendMessage - Send a message to this channel
     *
     * @param {Message<StreamChatGenerics>} message The Message object
     * @param {boolean} [options.skip_enrich_url] Do not try to enrich the URLs within message
     * @param {boolean} [options.skip_push] Skip sending push notifications
     * @param {boolean} [options.is_pending_message] DEPRECATED, please use `pending` instead.
     * @param {boolean} [options.pending] Make this message pending
     * @param {Record<string,string>} [options.pending_message_metadata] Metadata for the pending message
     * @param {boolean} [options.force_moderation] Apply force moderation for server-side requests
     *
     * @return {Promise<SendMessageAPIResponse<StreamChatGenerics>>} The Server Response
     */
    sendMessage(message: Message<StreamChatGenerics>, options?: SendMessageOptions): Promise<SendMessageAPIResponse<StreamChatGenerics>>;
    sendFile(uri: string | NodeJS.ReadableStream | Buffer | File, name?: string, contentType?: string, user?: UserResponse<StreamChatGenerics>): Promise<import("./types").SendFileAPIResponse>;
    sendImage(uri: string | NodeJS.ReadableStream | File, name?: string, contentType?: string, user?: UserResponse<StreamChatGenerics>): Promise<import("./types").SendFileAPIResponse>;
    deleteFile(url: string): Promise<APIResponse>;
    deleteImage(url: string): Promise<APIResponse>;
    /**
     * sendEvent - Send an event on this channel
     *
     * @param {Event<StreamChatGenerics>} event for example {type: 'message.read'}
     *
     * @return {Promise<EventAPIResponse<StreamChatGenerics>>} The Server Response
     */
    sendEvent(event: Event<StreamChatGenerics>): Promise<EventAPIResponse<StreamChatGenerics>>;
    /**
     * search - Query messages
     *
     * @param {MessageFilters<StreamChatGenerics> | string}  query search query or object MongoDB style filters
     * @param {{client_id?: string; connection_id?: string; query?: string; message_filter_conditions?: MessageFilters<StreamChatGenerics>}} options Option object, {user_id: 'tommaso'}
     *
     * @return {Promise<SearchAPIResponse<StreamChatGenerics>>} search messages response
     */
    search(query: MessageFilters<StreamChatGenerics> | string, options?: SearchOptions<StreamChatGenerics> & {
        client_id?: string;
        connection_id?: string;
        message_filter_conditions?: MessageFilters<StreamChatGenerics>;
        message_options?: MessageOptions;
        query?: string;
    }): Promise<SearchAPIResponse<StreamChatGenerics>>;
    /**
     * queryMembers - Query Members
     *
     * @param {MemberFilters<StreamChatGenerics>}  filterConditions object MongoDB style filters
     * @param {MemberSort<StreamChatGenerics>} [sort] Sort options, for instance [{created_at: -1}].
     * When using multiple fields, make sure you use array of objects to guarantee field order, for instance [{name: -1}, {created_at: 1}]
     * @param {{ limit?: number; offset?: number }} [options] Option object, {limit: 10, offset:10}
     *
     * @return {Promise<ChannelMemberAPIResponse<StreamChatGenerics>>} Query Members response
     */
    queryMembers(filterConditions: MemberFilters<StreamChatGenerics>, sort?: MemberSort<StreamChatGenerics>, options?: QueryMembersOptions): Promise<ChannelMemberAPIResponse<StreamChatGenerics>>;
    /**
     * partialUpdateMember - Partial update a member
     *
     * @param {string} user_id member user id
     * @param {PartialUpdateMember<StreamChatGenerics>}  updates
     *
     * @return {Promise<ChannelMemberResponse<StreamChatGenerics>>} Updated member
     */
    partialUpdateMember(user_id: string, updates: PartialUpdateMember<StreamChatGenerics>): Promise<PartialUpdateMemberAPIResponse<StreamChatGenerics>>;
    /**
     * sendReaction - Send a reaction about a message
     *
     * @param {string} messageID the message id
     * @param {Reaction<StreamChatGenerics>} reaction the reaction object for instance {type: 'love'}
     * @param {{ enforce_unique?: boolean, skip_push?: boolean }} [options] Option object, {enforce_unique: true, skip_push: true} to override any existing reaction or skip sending push notifications
     *
     * @return {Promise<ReactionAPIResponse<StreamChatGenerics>>} The Server Response
     */
    sendReaction(messageID: string, reaction: Reaction<StreamChatGenerics>, options?: {
        enforce_unique?: boolean;
        skip_push?: boolean;
    }): Promise<ReactionAPIResponse<StreamChatGenerics>>;
    /**
     * deleteReaction - Delete a reaction by user and type
     *
     * @param {string} messageID the id of the message from which te remove the reaction
     * @param {string} reactionType the type of reaction that should be removed
     * @param {string} [user_id] the id of the user (used only for server side request) default null
     *
     * @return {Promise<ReactionAPIResponse<StreamChatGenerics>>} The Server Response
     */
    deleteReaction(messageID: string, reactionType: string, user_id?: string): Promise<ReactionAPIResponse<StreamChatGenerics>>;
    /**
     * update - Edit the channel's custom properties
     *
     * @param {ChannelData<StreamChatGenerics>} channelData The object to update the custom properties of this channel with
     * @param {Message<StreamChatGenerics>} [updateMessage] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    update(channelData?: Partial<ChannelData<StreamChatGenerics>> | Partial<ChannelResponse<StreamChatGenerics>>, updateMessage?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * updatePartial - partial update channel properties
     *
     * @param {PartialUpdateChannel<StreamChatGenerics>} partial update request
     *
     * @return {Promise<PartialUpdateChannelAPIResponse<StreamChatGenerics>>}
     */
    updatePartial(update: PartialUpdateChannel<StreamChatGenerics>): Promise<PartialUpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * enableSlowMode - enable slow mode
     *
     * @param {number} coolDownInterval the cooldown interval in seconds
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    enableSlowMode(coolDownInterval: number): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * disableSlowMode - disable slow mode
     *
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    disableSlowMode(): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * delete - Delete the channel. Messages are permanently removed.
     *
     * @param {boolean} [options.hard_delete] Defines if the channel is hard deleted or not
     *
     * @return {Promise<DeleteChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    delete(options?: {
        hard_delete?: boolean;
    }): Promise<DeleteChannelAPIResponse<StreamChatGenerics>>;
    /**
     * truncate - Removes all messages from the channel
     * @param {TruncateOptions<StreamChatGenerics>} [options] Defines truncation options
     * @return {Promise<TruncateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    truncate(options?: TruncateOptions<StreamChatGenerics>): Promise<TruncateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * acceptInvite - accept invitation to the channel
     *
     * @param {InviteOptions<StreamChatGenerics>} [options] The object to update the custom properties of this channel with
     *
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    acceptInvite(options?: InviteOptions<StreamChatGenerics>): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * rejectInvite - reject invitation to the channel
     *
     * @param {InviteOptions<StreamChatGenerics>} [options] The object to update the custom properties of this channel with
     *
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    rejectInvite(options?: InviteOptions<StreamChatGenerics>): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * addMembers - add members to the channel
     *
     * @param {string[] | Array<NewMemberPayload<StreamChatGenerics>>} members An array of members to add to the channel
     * @param {Message<StreamChatGenerics>} [message] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    addMembers(members: string[] | Array<NewMemberPayload<StreamChatGenerics>>, message?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * addModerators - add moderators to the channel
     *
     * @param {string[]} members An array of member identifiers
     * @param {Message<StreamChatGenerics>} [message] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    addModerators(members: string[], message?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * assignRoles - sets member roles in a channel
     *
     * @param {{channel_role: Role, user_id: string}[]} roles List of role assignments
     * @param {Message<StreamChatGenerics>} [message] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    assignRoles(roles: {
        channel_role: Role;
        user_id: string;
    }[], message?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * inviteMembers - invite members to the channel
     *
     * @param {string[] | Array<NewMemberPayload<StreamChatGenerics>>} members An array of members to invite to the channel
     * @param {Message<StreamChatGenerics>} [message] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    inviteMembers(members: string[] | Array<NewMemberPayload<StreamChatGenerics>>, message?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * removeMembers - remove members from channel
     *
     * @param {string[]} members An array of member identifiers
     * @param {Message<StreamChatGenerics>} [message] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    removeMembers(members: string[], message?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * demoteModerators - remove moderator role from channel members
     *
     * @param {string[]} members An array of member identifiers
     * @param {Message<StreamChatGenerics>} [message] Optional message object for channel members notification
     * @param {ChannelUpdateOptions} [options] Option object, configuration to control the behavior while updating
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    demoteModerators(members: string[], message?: Message<StreamChatGenerics>, options?: ChannelUpdateOptions): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * _update - executes channel update request
     * @param payload Object Update Channel payload
     * @return {Promise<UpdateChannelAPIResponse<StreamChatGenerics>>} The server response
     * TODO: introduce new type instead of Object in the next major update
     */
    _update(payload: Object): Promise<UpdateChannelAPIResponse<StreamChatGenerics>>;
    /**
     * mute - mutes the current channel
     * @param {{ user_id?: string, expiration?: string }} opts expiration in minutes or user_id
     * @return {Promise<MuteChannelAPIResponse<StreamChatGenerics>>} The server response
     *
     * example with expiration:
     * await channel.mute({expiration: moment.duration(2, 'weeks')});
     *
     * example server side:
     * await channel.mute({user_id: userId});
     *
     */
    mute(opts?: {
        expiration?: number;
        user_id?: string;
    }): Promise<MuteChannelAPIResponse<StreamChatGenerics>>;
    /**
     * unmute - mutes the current channel
     * @param {{ user_id?: string}} opts user_id
     * @return {Promise<APIResponse>} The server response
     *
     * example server side:
     * await channel.unmute({user_id: userId});
     */
    unmute(opts?: {
        user_id?: string;
    }): Promise<APIResponse>;
    /**
     * archive - archives the current channel
     * @param {{ user_id?: string }} opts user_id if called server side
     * @return {Promise<ChannelMemberResponse<StreamChatGenerics>>} The server response
     *
     * example:
     * await channel.archives();
     *
     * example server side:
     * await channel.archive({user_id: userId});
     *
     */
    archive(opts?: {
        user_id?: string;
    }): Promise<ChannelMemberResponse<StreamChatGenerics>>;
    /**
     * unarchive - unarchives the current channel
     * @param {{ user_id?: string }} opts user_id if called server side
     * @return {Promise<ChannelMemberResponse<StreamChatGenerics>>} The server response
     *
     * example:
     * await channel.unarchive();
     *
     * example server side:
     * await channel.unarchive({user_id: userId});
     *
     */
    unarchive(opts?: {
        user_id?: string;
    }): Promise<ChannelMemberResponse<StreamChatGenerics>>;
    /**
     * pin - pins the current channel
     * @param {{ user_id?: string }} opts user_id if called server side
     * @return {Promise<ChannelMemberResponse<StreamChatGenerics>>} The server response
     *
     * example:
     * await channel.pin();
     *
     * example server side:
     * await channel.pin({user_id: userId});
     *
     */
    pin(opts?: {
        user_id?: string;
    }): Promise<ChannelMemberResponse<StreamChatGenerics>>;
    /**
     * unpin - unpins the current channel
     * @param {{ user_id?: string }} opts user_id if called server side
     * @return {Promise<ChannelMemberResponse<StreamChatGenerics>>} The server response
     *
     * example:
     * await channel.unpin();
     *
     * example server side:
     * await channel.unpin({user_id: userId});
     *
     */
    unpin(opts?: {
        user_id?: string;
    }): Promise<ChannelMemberResponse<StreamChatGenerics>>;
    /**
     * muteStatus - returns the mute status for the current channel
     * @return {{ muted: boolean; createdAt: Date | null; expiresAt: Date | null }} { muted: true | false, createdAt: Date | null, expiresAt: Date | null}
     */
    muteStatus(): {
        createdAt: Date | null;
        expiresAt: Date | null;
        muted: boolean;
    };
    sendAction(messageID: string, formData: Record<string, string>): Promise<SendMessageAPIResponse<StreamChatGenerics>>;
    /**
     * keystroke - First of the typing.start and typing.stop events based on the users keystrokes.
     * Call this on every keystroke
     * @see {@link https://getstream.io/chat/docs/typing_indicators/?language=js|Docs}
     * @param {string} [parent_id] set this field to `message.id` to indicate that typing event is happening in a thread
     */
    keystroke(parent_id?: string, options?: {
        user_id: string;
    }): Promise<void>;
    /**
     * Sends an event to update the AI state for a specific message.
     * Typically used by the server connected to the AI service to notify clients of state changes.
     *
     * @param messageId - The ID of the message associated with the AI state.
     * @param state - The new state of the AI process (e.g., thinking, generating).
     * @param options - Optional parameters, such as `ai_message`, to include additional details in the event.
     */
    updateAIState(messageId: string, state: AIState, options?: {
        ai_message?: string;
    }): Promise<void>;
    /**
     * Sends an event to notify watchers to clear the typing/thinking UI when the AI response starts streaming.
     * Typically used by the server connected to the AI service to inform clients that the AI response has started.
     */
    clearAIIndicator(): Promise<void>;
    /**
     * Sends an event to stop AI response generation, leaving the message in its current state.
     * Triggered by the user to halt the AI response process.
     */
    stopAIResponse(): Promise<void>;
    /**
     * stopTyping - Sets last typing to null and sends the typing.stop event
     * @see {@link https://getstream.io/chat/docs/typing_indicators/?language=js|Docs}
     * @param {string} [parent_id] set this field to `message.id` to indicate that typing event is happening in a thread
     */
    stopTyping(parent_id?: string, options?: {
        user_id: string;
    }): Promise<void>;
    _isTypingIndicatorsEnabled(): boolean;
    /**
     * lastMessage - return the last message, takes into account that last few messages might not be perfectly sorted
     *
     * @return {ReturnType<ChannelState<StreamChatGenerics>['formatMessage']> | undefined} Description
     */
    lastMessage(): FormatMessageResponse<StreamChatGenerics> | undefined;
    /**
     * markRead - Send the mark read event for this user, only works if the `read_events` setting is enabled
     *
     * @param {MarkReadOptions<StreamChatGenerics>} data
     * @return {Promise<EventAPIResponse<StreamChatGenerics> | null>} Description
     */
    markRead(data?: MarkReadOptions<StreamChatGenerics>): Promise<EventAPIResponse<StreamChatGenerics> | null>;
    /**
     * markUnread - Mark the channel as unread from messageID, only works if the `read_events` setting is enabled
     *
     * @param {MarkUnreadOptions<StreamChatGenerics>} data
     * @return {APIResponse} An API response
     */
    markUnread(data: MarkUnreadOptions<StreamChatGenerics>): Promise<APIResponse | null>;
    /**
     * clean - Cleans the channel state and fires stop typing if needed
     */
    clean(): void;
    /**
     * watch - Loads the initial channel state and watches for changes
     *
     * @param {ChannelQueryOptions<StreamChatGenerics>} options additional options for the query endpoint
     *
     * @return {Promise<QueryChannelAPIResponse<StreamChatGenerics>>} The server response
     */
    watch(options?: ChannelQueryOptions<StreamChatGenerics>): Promise<QueryChannelAPIResponse<StreamChatGenerics>>;
    /**
     * stopWatching - Stops watching the channel
     *
     * @return {Promise<APIResponse>} The server response
     */
    stopWatching(): Promise<APIResponse>;
    /**
     * getReplies - List the message replies for a parent message.
     *
     * The recommended way of working with threads is to use the Thread class.
     *
     * @param {string} parent_id The message parent id, ie the top of the thread
     * @param {MessagePaginationOptions & { user?: UserResponse<StreamChatGenerics>; user_id?: string }} options Pagination params, ie {limit:10, id_lte: 10}
     *
     * @return {Promise<GetRepliesAPIResponse<StreamChatGenerics>>} A response with a list of messages
     */
    getReplies(parent_id: string, options: MessagePaginationOptions & {
        user?: UserResponse<StreamChatGenerics>;
        user_id?: string;
    }, sort?: {
        created_at: AscDesc;
    }[]): Promise<GetRepliesAPIResponse<StreamChatGenerics>>;
    /**
     * getPinnedMessages - List list pinned messages of the channel
     *
     * @param {PinnedMessagePaginationOptions & { user?: UserResponse<StreamChatGenerics>; user_id?: string }} options Pagination params, ie {limit:10, id_lte: 10}
     * @param {PinnedMessagesSort} sort defines sorting direction of pinned messages
     *
     * @return {Promise<GetRepliesAPIResponse<StreamChatGenerics>>} A response with a list of messages
     */
    getPinnedMessages(options: PinnedMessagePaginationOptions & {
        user?: UserResponse<StreamChatGenerics>;
        user_id?: string;
    }, sort?: PinnedMessagesSort): Promise<GetRepliesAPIResponse<StreamChatGenerics>>;
    /**
     * getReactions - List the reactions, supports pagination
     *
     * @param {string} message_id The message id
     * @param {{ limit?: number; offset?: number }} options The pagination options
     *
     * @return {Promise<GetReactionsAPIResponse<StreamChatGenerics>>} Server response
     */
    getReactions(message_id: string, options: {
        limit?: number;
        offset?: number;
    }): Promise<GetReactionsAPIResponse<StreamChatGenerics>>;
    /**
     * getMessagesById - Retrieves a list of messages by ID
     *
     * @param {string[]} messageIds The ids of the messages to retrieve from this channel
     *
     * @return {Promise<GetMultipleMessagesAPIResponse<StreamChatGenerics>>} Server response
     */
    getMessagesById(messageIds: string[]): Promise<GetMultipleMessagesAPIResponse<StreamChatGenerics>>;
    /**
     * lastRead - returns the last time the user marked the channel as read if the user never marked the channel as read, this will return null
     * @return {Date | null | undefined}
     */
    lastRead(): Date | null | undefined;
    _countMessageAsUnread(message: FormatMessageResponse<StreamChatGenerics> | MessageResponse<StreamChatGenerics>): boolean;
    /**
     * countUnread - Count of unread messages
     *
     * @param {Date | null} [lastRead] lastRead the time that the user read a message, defaults to current user's read state
     *
     * @return {number} Unread count
     */
    countUnread(lastRead?: Date | null): number;
    /**
     * countUnreadMentions - Count the number of unread messages mentioning the current user
     *
     * @return {number} Unread mentions count
     */
    countUnreadMentions(): number;
    /**
     * create - Creates a new channel
     *
     * @return {Promise<QueryChannelAPIResponse<StreamChatGenerics>>} The Server Response
     *
     */
    create: (options?: ChannelQueryOptions<StreamChatGenerics>) => Promise<QueryChannelAPIResponse<StreamChatGenerics>>;
    /**
     * query - Query the API, get messages, members or other channel fields
     *
     * @param {ChannelQueryOptions<StreamChatGenerics>} options The query options
     * @param {MessageSetType} messageSetToAddToIfDoesNotExist It's possible to load disjunct sets of a channel's messages into state, use `current` to load the initial channel state or if you want to extend the currently displayed messages, use `latest` if you want to load/extend the latest messages, `new` is used for loading a specific message and it's surroundings
     *
     * @return {Promise<QueryChannelAPIResponse<StreamChatGenerics>>} Returns a query response
     */
    query(options?: ChannelQueryOptions<StreamChatGenerics>, messageSetToAddToIfDoesNotExist?: MessageSetType): Promise<QueryChannelAPIResponse<StreamChatGenerics>>;
    /**
     * banUser - Bans a user from a channel
     *
     * @param {string} targetUserID
     * @param {BanUserOptions<StreamChatGenerics>} options
     * @returns {Promise<APIResponse>}
     */
    banUser(targetUserID: string, options: BanUserOptions<StreamChatGenerics>): Promise<APIResponse>;
    /**
     * hides the channel from queryChannels for the user until a message is added
     * If clearHistory is set to true - all messages will be removed for the user
     *
     * @param {string | null} userId
     * @param {boolean} clearHistory
     * @returns {Promise<APIResponse>}
     */
    hide(userId?: string | null, clearHistory?: boolean): Promise<APIResponse>;
    /**
     * removes the hidden status for a channel
     *
     * @param {string | null} userId
     * @returns {Promise<APIResponse>}
     */
    show(userId?: string | null): Promise<APIResponse>;
    /**
     * unbanUser - Removes the bans for a user on a channel
     *
     * @param {string} targetUserID
     * @returns {Promise<APIResponse>}
     */
    unbanUser(targetUserID: string): Promise<APIResponse>;
    /**
     * shadowBan - Shadow bans a user from a channel
     *
     * @param {string} targetUserID
     * @param {BanUserOptions<StreamChatGenerics>} options
     * @returns {Promise<APIResponse>}
     */
    shadowBan(targetUserID: string, options: BanUserOptions<StreamChatGenerics>): Promise<APIResponse>;
    /**
     * removeShadowBan - Removes the shadow ban for a user on a channel
     *
     * @param {string} targetUserID
     * @returns {Promise<APIResponse>}
     */
    removeShadowBan(targetUserID: string): Promise<APIResponse>;
    /**
     * createCall - creates a call for the current channel
     *
     * @param {CreateCallOptions} options
     * @returns {Promise<CreateCallResponse>}
     */
    createCall(options: CreateCallOptions): Promise<CreateCallResponse>;
    /**
     * Cast or cancel one or more votes on a poll
     * @param pollId string The poll id
     * @param votes PollVoteData[] The votes that will be casted (or canceled in case of an empty array)
     * @returns {APIResponse & PollVoteResponse} The poll votes
     */
    vote(messageId: string, pollId: string, vote: PollVoteData): Promise<APIResponse & import("./types").CastVoteAPIResponse<StreamChatGenerics>>;
    removeVote(messageId: string, pollId: string, voteId: string): Promise<APIResponse & {
        vote: import("./types").PollVote;
    }>;
    /**
     * createDraft - Creates or updates a draft message in a channel
     *
     * @param {string} channelType The channel type
     * @param {string} channelID The channel ID
     * @param {DraftMessagePayload<StreamChatGenerics>} message The draft message to create or update
     *
     * @return {Promise<CreateDraftResponse<StreamChatGenerics>>} Response containing the created draft
     */
    createDraft(message: DraftMessagePayload<StreamChatGenerics>): Promise<CreateDraftResponse<StreamChatGenerics>>;
    /**
     * deleteDraft - Deletes a draft message from a channel
     *
     * @param {Object} options
     * @param {string} options.parent_id Optional parent message ID for drafts in threads
     *
     * @return {Promise<APIResponse>} API response
     */
    deleteDraft({ parent_id }?: {
        parent_id?: string;
    }): Promise<APIResponse>;
    /**
     * getDraft - Retrieves a draft message from a channel
     *
     * @param {Object} options
     * @param {string} options.parent_id Optional parent message ID for drafts in threads
     *
     * @return {Promise<GetDraftResponse<StreamChatGenerics>>} Response containing the draft
     */
    getDraft({ parent_id }?: {
        parent_id?: string;
    }): Promise<GetDraftResponse<StreamChatGenerics>>;
    /**
     * on - Listen to events on this channel.
     *
     * channel.on('message.new', event => {console.log("my new message", event, channel.state.messages)})
     * or
     * channel.on(event => {console.log(event.type)})
     *
     * @param {EventHandler<StreamChatGenerics> | EventTypes} callbackOrString  The event type to listen for (optional)
     * @param {EventHandler<StreamChatGenerics>} [callbackOrNothing] The callback to call
     */
    on(eventType: EventTypes, callback: EventHandler<StreamChatGenerics>): {
        unsubscribe: () => void;
    };
    on(callback: EventHandler<StreamChatGenerics>): {
        unsubscribe: () => void;
    };
    /**
     * off - Remove the event handler
     *
     */
    off(eventType: EventTypes, callback: EventHandler<StreamChatGenerics>): void;
    off(callback: EventHandler<StreamChatGenerics>): void;
    _handleChannelEvent(event: Event<StreamChatGenerics>): void;
    _callChannelListeners: (event: Event<StreamChatGenerics>) => void;
    /**
     * _channelURL - Returns the channel url
     *
     * @return {string} The channel url
     */
    _channelURL: () => string;
    _checkInitialized(): void;
    _initializeState(state: ChannelAPIResponse<StreamChatGenerics>, messageSetToAddToIfDoesNotExist?: MessageSetType): {
        messageSet: import("./types").MessageSet;
    };
    _extendEventWithOwnReactions(event: Event<StreamChatGenerics>): void;
    _hydrateMembers({ members, overrideCurrentState, }: {
        members: ChannelMemberResponse<StreamChatGenerics>[];
        /**
         * If set to `true` then `ChannelState.members` will be overriden with the newly
         * provided `members`, setting this property to `false` will merge current `ChannelState.members`
         * object with the newly provided `members`
         * (new members with the same `userId` will replace the old ones).
         */
        overrideCurrentState?: boolean;
    }): void;
    _disconnect(): void;
}
//# sourceMappingURL=channel.d.ts.map