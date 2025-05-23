import { Channel } from './channel';
import { ChannelMemberResponse, DefaultGenerics, Event, ExtendableGenerics, FormatMessageResponse, MessageResponse, MessageSet, MessageSetType, PendingMessageResponse, ReactionResponse, UserResponse } from './types';
type ChannelReadStatus<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> = Record<string, {
    last_read: Date;
    unread_messages: number;
    user: UserResponse<StreamChatGenerics>;
    first_unread_message_id?: string;
    last_read_message_id?: string;
}>;
/**
 * ChannelState - A container class for the channel state.
 */
export declare class ChannelState<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    _channel: Channel<StreamChatGenerics>;
    watcher_count: number;
    typing: Record<string, Event<StreamChatGenerics>>;
    read: ChannelReadStatus<StreamChatGenerics>;
    pinnedMessages: Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>;
    pending_messages: Array<PendingMessageResponse<StreamChatGenerics>>;
    threads: Record<string, Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>>;
    mutedUsers: Array<UserResponse<StreamChatGenerics>>;
    watchers: Record<string, UserResponse<StreamChatGenerics>>;
    members: Record<string, ChannelMemberResponse<StreamChatGenerics>>;
    unreadCount: number;
    membership: ChannelMemberResponse<StreamChatGenerics>;
    last_message_at: Date | null;
    /**
     * Flag which indicates if channel state contain latest/recent messages or no.
     * This flag should be managed by UI sdks using a setter - setIsUpToDate.
     * When false, any new message (received by websocket event - message.new) will not
     * be pushed on to message list.
     */
    isUpToDate: boolean;
    /**
     * Disjoint lists of messages
     * Users can jump in the message list (with searching) and this can result in disjoint lists of messages
     * The state manages these lists and merges them when lists overlap
     * The messages array contains the currently active set
     */
    messageSets: MessageSet[];
    constructor(channel: Channel<StreamChatGenerics>);
    get messages(): Array<ReturnType<ChannelState<StreamChatGenerics>["formatMessage"]>>;
    set messages(messages: Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>);
    /**
     * The list of latest messages
     * The messages array not always contains the latest messages (for example if a user searched for an earlier message, that is in a different message set)
     */
    get latestMessages(): Array<ReturnType<ChannelState<StreamChatGenerics>["formatMessage"]>>;
    set latestMessages(messages: Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>);
    get messagePagination(): {
        hasNext: boolean;
        hasPrev: boolean;
    };
    /**
     * addMessageSorted - Add a message to the state
     *
     * @param {MessageResponse<StreamChatGenerics>} newMessage A new message
     * @param {boolean} timestampChanged Whether updating a message with changed created_at value.
     * @param {boolean} addIfDoesNotExist Add message if it is not in the list, used to prevent out of order updated messages from being added.
     * @param {MessageSetType} messageSetToAddToIfDoesNotExist Which message set to add to if message is not in the list (only used if addIfDoesNotExist is true)
     */
    addMessageSorted(newMessage: MessageResponse<StreamChatGenerics>, timestampChanged?: boolean, addIfDoesNotExist?: boolean, messageSetToAddToIfDoesNotExist?: MessageSetType): {
        messageSet: MessageSet;
    };
    /**
     * Takes the message object, parses the dates, sets `__html`
     * and sets the status to `received` if missing; returns a new message object.
     *
     * @param {MessageResponse<StreamChatGenerics>} message `MessageResponse` object
     */
    formatMessage: (message: MessageResponse<StreamChatGenerics>) => FormatMessageResponse<StreamChatGenerics>;
    /**
     * addMessagesSorted - Add the list of messages to state and resorts the messages
     *
     * @param {Array<MessageResponse<StreamChatGenerics>>} newMessages A list of messages
     * @param {boolean} timestampChanged Whether updating messages with changed created_at value.
     * @param {boolean} initializing Whether channel is being initialized.
     * @param {boolean} addIfDoesNotExist Add message if it is not in the list, used to prevent out of order updated messages from being added.
     * @param {MessageSetType} messageSetToAddToIfDoesNotExist Which message set to add to if messages are not in the list (only used if addIfDoesNotExist is true)
     *
     */
    addMessagesSorted(newMessages: MessageResponse<StreamChatGenerics>[], timestampChanged?: boolean, initializing?: boolean, addIfDoesNotExist?: boolean, messageSetToAddToIfDoesNotExist?: MessageSetType): {
        messageSet: MessageSet;
    };
    /**
     * addPinnedMessages - adds messages in pinnedMessages property
     *
     * @param {Array<MessageResponse<StreamChatGenerics>>} pinnedMessages A list of pinned messages
     *
     */
    addPinnedMessages(pinnedMessages: MessageResponse<StreamChatGenerics>[]): void;
    /**
     * addPinnedMessage - adds message in pinnedMessages
     *
     * @param {MessageResponse<StreamChatGenerics>} pinnedMessage message to update
     *
     */
    addPinnedMessage(pinnedMessage: MessageResponse<StreamChatGenerics>): void;
    /**
     * removePinnedMessage - removes pinned message from pinnedMessages
     *
     * @param {MessageResponse<StreamChatGenerics>} message message to remove
     *
     */
    removePinnedMessage(message: MessageResponse<StreamChatGenerics>): void;
    addReaction(reaction: ReactionResponse<StreamChatGenerics>, message?: MessageResponse<StreamChatGenerics>, enforce_unique?: boolean): MessageResponse<StreamChatGenerics> | undefined;
    _addOwnReactionToMessage(ownReactions: ReactionResponse<StreamChatGenerics>[] | null | undefined, reaction: ReactionResponse<StreamChatGenerics>, enforce_unique?: boolean): ReactionResponse<StreamChatGenerics>[];
    _removeOwnReactionFromMessage(ownReactions: ReactionResponse<StreamChatGenerics>[] | null | undefined, reaction: ReactionResponse<StreamChatGenerics>): ReactionResponse<StreamChatGenerics>[] | null | undefined;
    removeReaction(reaction: ReactionResponse<StreamChatGenerics>, message?: MessageResponse<StreamChatGenerics>): MessageResponse<StreamChatGenerics> | undefined;
    _updateQuotedMessageReferences({ message, remove, }: {
        message: MessageResponse<StreamChatGenerics>;
        remove?: boolean;
    }): void;
    removeQuotedMessageReferences(message: MessageResponse<StreamChatGenerics>): void;
    /**
     * Updates all instances of given message in channel state
     * @param message
     * @param updateFunc
     */
    _updateMessage(message: {
        id?: string;
        parent_id?: string;
        pinned?: boolean;
        show_in_channel?: boolean;
    }, updateFunc: (msg: ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>) => ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>): void;
    /**
     * Setter for isUpToDate.
     *
     * @param isUpToDate  Flag which indicates if channel state contain latest/recent messages or no.
     *                    This flag should be managed by UI sdks using a setter - setIsUpToDate.
     *                    When false, any new message (received by websocket event - message.new) will not
     *                    be pushed on to message list.
     */
    setIsUpToDate: (isUpToDate: boolean) => void;
    /**
     * _addToMessageList - Adds a message to a list of messages, tries to update first, appends if message isn't found
     *
     * @param {Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>} messages A list of messages
     * @param message
     * @param {boolean} timestampChanged Whether updating a message with changed created_at value.
     * @param {string} sortBy field name to use to sort the messages by
     * @param {boolean} addIfDoesNotExist Add message if it is not in the list, used to prevent out of order updated messages from being added.
     */
    _addToMessageList(messages: Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>, message: ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>, timestampChanged?: boolean, sortBy?: 'pinned_at' | 'created_at', addIfDoesNotExist?: boolean): FormatMessageResponse<StreamChatGenerics>[];
    /**
     * removeMessage - Description
     *
     * @param {{ id: string; parent_id?: string }} messageToRemove Object of the message to remove. Needs to have at id specified.
     *
     * @return {boolean} Returns if the message was removed
     */
    removeMessage(messageToRemove: {
        id: string;
        messageSetIndex?: number;
        parent_id?: string;
    }): boolean;
    removeMessageFromArray: (msgArray: Array<ReturnType<ChannelState<StreamChatGenerics>["formatMessage"]>>, msg: {
        id: string;
        parent_id?: string;
    }) => {
        removed: boolean;
        result: FormatMessageResponse<StreamChatGenerics>[];
    };
    /**
     * Updates the message.user property with updated user object, for messages.
     *
     * @param {UserResponse<StreamChatGenerics>} user
     */
    updateUserMessages: (user: UserResponse<StreamChatGenerics>) => void;
    /**
     * Marks the messages as deleted, from deleted user.
     *
     * @param {UserResponse<StreamChatGenerics>} user
     * @param {boolean} hardDelete
     */
    deleteUserMessages: (user: UserResponse<StreamChatGenerics>, hardDelete?: boolean) => void;
    /**
     * filterErrorMessages - Removes error messages from the channel state.
     *
     */
    filterErrorMessages(): void;
    /**
     * clean - Remove stale data such as users that stayed in typing state for more than 5 seconds
     */
    clean(): void;
    clearMessages(): void;
    initMessages(): void;
    /**
     * loadMessageIntoState - Loads a given message (and messages around it) into the state
     *
     * @param {string} messageId The id of the message, or 'latest' to indicate switching to the latest messages
     * @param {string} parentMessageId The id of the parent message, if we want load a thread reply
     * @param {number} limit The page size if the message has to be queried from the server
     */
    loadMessageIntoState(messageId: string | 'latest', parentMessageId?: string, limit?: number): Promise<void>;
    /**
     * findMessage - Finds a message inside the state
     *
     * @param {string} messageId The id of the message
     * @param {string} parentMessageId The id of the parent message, if we want load a thread reply
     *
     * @return {ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>} Returns the message, or undefined if the message wasn't found
     */
    findMessage(messageId: string, parentMessageId?: string): FormatMessageResponse<DefaultGenerics> | undefined;
    private switchToMessageSet;
    private areMessageSetsOverlap;
    private findMessageSetIndex;
    private findTargetMessageSet;
}
export {};
//# sourceMappingURL=channel_state.d.ts.map