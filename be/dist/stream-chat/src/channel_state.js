"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelState = void 0;
const utils_1 = require("./utils");
const constants_1 = require("./constants");
/**
 * ChannelState - A container class for the channel state.
 */
class ChannelState {
    constructor(channel) {
        /**
         * Disjoint lists of messages
         * Users can jump in the message list (with searching) and this can result in disjoint lists of messages
         * The state manages these lists and merges them when lists overlap
         * The messages array contains the currently active set
         */
        this.messageSets = [];
        /**
         * Takes the message object, parses the dates, sets `__html`
         * and sets the status to `received` if missing; returns a new message object.
         *
         * @param {MessageResponse<StreamChatGenerics>} message `MessageResponse` object
         */
        this.formatMessage = (message) => (0, utils_1.formatMessage)(message);
        /**
         * Setter for isUpToDate.
         *
         * @param isUpToDate  Flag which indicates if channel state contain latest/recent messages or no.
         *                    This flag should be managed by UI sdks using a setter - setIsUpToDate.
         *                    When false, any new message (received by websocket event - message.new) will not
         *                    be pushed on to message list.
         */
        this.setIsUpToDate = (isUpToDate) => {
            this.isUpToDate = isUpToDate;
        };
        this.removeMessageFromArray = (msgArray, msg) => {
            const result = msgArray.filter((message) => !(!!message.id && !!msg.id && message.id === msg.id));
            return { removed: result.length < msgArray.length, result };
        };
        /**
         * Updates the message.user property with updated user object, for messages.
         *
         * @param {UserResponse<StreamChatGenerics>} user
         */
        this.updateUserMessages = (user) => {
            const _updateUserMessages = (messages, user) => {
                for (let i = 0; i < messages.length; i++) {
                    const m = messages[i];
                    if (m.user?.id === user.id) {
                        messages[i] = { ...m, user };
                    }
                }
            };
            this.messageSets.forEach((set) => _updateUserMessages(set.messages, user));
            for (const parentId in this.threads) {
                _updateUserMessages(this.threads[parentId], user);
            }
            _updateUserMessages(this.pinnedMessages, user);
        };
        /**
         * Marks the messages as deleted, from deleted user.
         *
         * @param {UserResponse<StreamChatGenerics>} user
         * @param {boolean} hardDelete
         */
        this.deleteUserMessages = (user, hardDelete = false) => {
            const _deleteUserMessages = (messages, user, hardDelete = false) => {
                for (let i = 0; i < messages.length; i++) {
                    const m = messages[i];
                    if (m.user?.id !== user.id) {
                        continue;
                    }
                    if (hardDelete) {
                        /**
                         * In case of hard delete, we need to strip down all text, html,
                         * attachments and all the custom properties on message
                         */
                        messages[i] = {
                            cid: m.cid,
                            created_at: m.created_at,
                            deleted_at: user.deleted_at,
                            id: m.id,
                            latest_reactions: [],
                            mentioned_users: [],
                            own_reactions: [],
                            parent_id: m.parent_id,
                            reply_count: m.reply_count,
                            status: m.status,
                            thread_participants: m.thread_participants,
                            type: 'deleted',
                            updated_at: m.updated_at,
                            user: m.user,
                        };
                    }
                    else {
                        messages[i] = {
                            ...m,
                            type: 'deleted',
                            deleted_at: user.deleted_at ? new Date(user.deleted_at) : null,
                        };
                    }
                }
            };
            this.messageSets.forEach((set) => _deleteUserMessages(set.messages, user, hardDelete));
            for (const parentId in this.threads) {
                _deleteUserMessages(this.threads[parentId], user, hardDelete);
            }
            _deleteUserMessages(this.pinnedMessages, user, hardDelete);
        };
        this._channel = channel;
        this.watcher_count = 0;
        this.typing = {};
        this.read = {};
        this.initMessages();
        this.pinnedMessages = [];
        this.pending_messages = [];
        this.threads = {};
        // a list of users to hide messages from
        this.mutedUsers = [];
        this.watchers = {};
        this.members = {};
        this.membership = {};
        this.unreadCount = 0;
        /**
         * Flag which indicates if channel state contain latest/recent messages or no.
         * This flag should be managed by UI sdks using a setter - setIsUpToDate.
         * When false, any new message (received by websocket event - message.new) will not
         * be pushed on to message list.
         */
        this.isUpToDate = true;
        this.last_message_at = channel?.state?.last_message_at != null ? new Date(channel.state.last_message_at) : null;
    }
    get messages() {
        return this.messageSets.find((s) => s.isCurrent)?.messages || [];
    }
    set messages(messages) {
        const index = this.messageSets.findIndex((s) => s.isCurrent);
        this.messageSets[index].messages = messages;
    }
    /**
     * The list of latest messages
     * The messages array not always contains the latest messages (for example if a user searched for an earlier message, that is in a different message set)
     */
    get latestMessages() {
        return this.messageSets.find((s) => s.isLatest)?.messages || [];
    }
    set latestMessages(messages) {
        const index = this.messageSets.findIndex((s) => s.isLatest);
        this.messageSets[index].messages = messages;
    }
    get messagePagination() {
        return this.messageSets.find((s) => s.isCurrent)?.pagination || constants_1.DEFAULT_MESSAGE_SET_PAGINATION;
    }
    /**
     * addMessageSorted - Add a message to the state
     *
     * @param {MessageResponse<StreamChatGenerics>} newMessage A new message
     * @param {boolean} timestampChanged Whether updating a message with changed created_at value.
     * @param {boolean} addIfDoesNotExist Add message if it is not in the list, used to prevent out of order updated messages from being added.
     * @param {MessageSetType} messageSetToAddToIfDoesNotExist Which message set to add to if message is not in the list (only used if addIfDoesNotExist is true)
     */
    addMessageSorted(newMessage, timestampChanged = false, addIfDoesNotExist = true, messageSetToAddToIfDoesNotExist = 'latest') {
        return this.addMessagesSorted([newMessage], timestampChanged, false, addIfDoesNotExist, messageSetToAddToIfDoesNotExist);
    }
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
    addMessagesSorted(newMessages, timestampChanged = false, initializing = false, addIfDoesNotExist = true, messageSetToAddToIfDoesNotExist = 'current') {
        const { messagesToAdd, targetMessageSetIndex } = this.findTargetMessageSet(newMessages, addIfDoesNotExist, messageSetToAddToIfDoesNotExist);
        for (let i = 0; i < messagesToAdd.length; i += 1) {
            const isFromShadowBannedUser = messagesToAdd[i].shadowed;
            if (isFromShadowBannedUser) {
                continue;
            }
            // If message is already formatted we can skip the tasks below
            // This will be true for messages that are already present at the state -> this happens when we perform merging of message sets
            // This will be also true for message previews used by some SDKs
            const isMessageFormatted = messagesToAdd[i].created_at instanceof Date;
            let message;
            if (isMessageFormatted) {
                message = messagesToAdd[i];
            }
            else {
                message = this.formatMessage(messagesToAdd[i]);
                if (message.user && this._channel?.cid) {
                    /**
                     * Store the reference to user for this channel, so that when we have to
                     * handle updates to user, we can use the reference map, to determine which
                     * channels need to be updated with updated user object.
                     */
                    this._channel.getClient().state.updateUserReference(message.user, this._channel.cid);
                }
                if (initializing && message.id && this.threads[message.id]) {
                    // If we are initializing the state of channel (e.g., in case of connection recovery),
                    // then in that case we remove thread related to this message from threads object.
                    // This way we can ensure that we don't have any stale data in thread object
                    // and consumer can refetch the replies.
                    delete this.threads[message.id];
                }
                if (!this.last_message_at) {
                    this.last_message_at = new Date(message.created_at.getTime());
                }
                if (message.created_at.getTime() > this.last_message_at.getTime()) {
                    this.last_message_at = new Date(message.created_at.getTime());
                }
            }
            // update or append the messages...
            const parentID = message.parent_id;
            // add to the given message set
            if ((!parentID || message.show_in_channel) && targetMessageSetIndex !== -1) {
                this.messageSets[targetMessageSetIndex].messages = this._addToMessageList(this.messageSets[targetMessageSetIndex].messages, message, timestampChanged, 'created_at', addIfDoesNotExist);
            }
            /**
             * Add message to thread if applicable and the message
             * was added when querying for replies, or the thread already exits.
             * This is to prevent the thread state from getting out of sync if
             * a thread message is shown in channel but older than the newest thread
             * message. This situation can result in a thread state where a random
             * message is "oldest" message, and newer messages are therefore not loaded.
             * This can also occur if an old thread message is updated.
             */
            if (parentID && !initializing) {
                const thread = this.threads[parentID] || [];
                this.threads[parentID] = this._addToMessageList(thread, message, timestampChanged, 'created_at', addIfDoesNotExist);
            }
        }
        return {
            messageSet: this.messageSets[targetMessageSetIndex],
        };
    }
    /**
     * addPinnedMessages - adds messages in pinnedMessages property
     *
     * @param {Array<MessageResponse<StreamChatGenerics>>} pinnedMessages A list of pinned messages
     *
     */
    addPinnedMessages(pinnedMessages) {
        for (let i = 0; i < pinnedMessages.length; i += 1) {
            this.addPinnedMessage(pinnedMessages[i]);
        }
    }
    /**
     * addPinnedMessage - adds message in pinnedMessages
     *
     * @param {MessageResponse<StreamChatGenerics>} pinnedMessage message to update
     *
     */
    addPinnedMessage(pinnedMessage) {
        this.pinnedMessages = this._addToMessageList(this.pinnedMessages, this.formatMessage(pinnedMessage), false, 'pinned_at');
    }
    /**
     * removePinnedMessage - removes pinned message from pinnedMessages
     *
     * @param {MessageResponse<StreamChatGenerics>} message message to remove
     *
     */
    removePinnedMessage(message) {
        const { result } = this.removeMessageFromArray(this.pinnedMessages, message);
        this.pinnedMessages = result;
    }
    addReaction(reaction, message, enforce_unique) {
        if (!message)
            return;
        const messageWithReaction = message;
        this._updateMessage(message, (msg) => {
            messageWithReaction.own_reactions = this._addOwnReactionToMessage(msg.own_reactions, reaction, enforce_unique);
            return this.formatMessage(messageWithReaction);
        });
        return messageWithReaction;
    }
    _addOwnReactionToMessage(ownReactions, reaction, enforce_unique) {
        if (enforce_unique) {
            ownReactions = [];
        }
        else {
            ownReactions = this._removeOwnReactionFromMessage(ownReactions, reaction);
        }
        ownReactions = ownReactions || [];
        if (this._channel.getClient().userID === reaction.user_id) {
            ownReactions.push(reaction);
        }
        return ownReactions;
    }
    _removeOwnReactionFromMessage(ownReactions, reaction) {
        if (ownReactions) {
            return ownReactions.filter((item) => item.user_id !== reaction.user_id || item.type !== reaction.type);
        }
        return ownReactions;
    }
    removeReaction(reaction, message) {
        if (!message)
            return;
        const messageWithReaction = message;
        this._updateMessage(message, (msg) => {
            messageWithReaction.own_reactions = this._removeOwnReactionFromMessage(msg.own_reactions, reaction);
            return this.formatMessage(messageWithReaction);
        });
        return messageWithReaction;
    }
    _updateQuotedMessageReferences({ message, remove, }) {
        const parseMessage = (m) => ({
            ...m,
            created_at: m.created_at.toISOString(),
            pinned_at: m.pinned_at?.toISOString(),
            updated_at: m.updated_at?.toISOString(),
        });
        const update = (messages) => {
            const updatedMessages = messages.reduce((acc, msg) => {
                if (msg.quoted_message_id === message.id) {
                    acc.push({ ...parseMessage(msg), quoted_message: remove ? { ...message, attachments: [] } : message });
                }
                return acc;
            }, []);
            this.addMessagesSorted(updatedMessages, true);
        };
        if (!message.parent_id) {
            this.messageSets.forEach((set) => update(set.messages));
        }
        else if (message.parent_id && this.threads[message.parent_id]) {
            // prevent going through all the threads even though it is possible to quote a message from another thread
            update(this.threads[message.parent_id]);
        }
    }
    removeQuotedMessageReferences(message) {
        this._updateQuotedMessageReferences({ message, remove: true });
    }
    /**
     * Updates all instances of given message in channel state
     * @param message
     * @param updateFunc
     */
    _updateMessage(message, updateFunc) {
        const { parent_id, show_in_channel, pinned } = message;
        if (parent_id && this.threads[parent_id]) {
            const thread = this.threads[parent_id];
            const msgIndex = thread.findIndex((msg) => msg.id === message.id);
            if (msgIndex !== -1) {
                thread[msgIndex] = updateFunc(thread[msgIndex]);
                this.threads[parent_id] = thread;
            }
        }
        if ((!show_in_channel && !parent_id) || show_in_channel) {
            const messageSetIndex = this.findMessageSetIndex(message);
            if (messageSetIndex !== -1) {
                const msgIndex = this.messageSets[messageSetIndex].messages.findIndex((msg) => msg.id === message.id);
                if (msgIndex !== -1) {
                    this.messageSets[messageSetIndex].messages[msgIndex] = updateFunc(this.messageSets[messageSetIndex].messages[msgIndex]);
                }
            }
        }
        if (pinned) {
            const msgIndex = this.pinnedMessages.findIndex((msg) => msg.id === message.id);
            if (msgIndex !== -1) {
                this.pinnedMessages[msgIndex] = updateFunc(this.pinnedMessages[msgIndex]);
            }
        }
    }
    /**
     * _addToMessageList - Adds a message to a list of messages, tries to update first, appends if message isn't found
     *
     * @param {Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>} messages A list of messages
     * @param message
     * @param {boolean} timestampChanged Whether updating a message with changed created_at value.
     * @param {string} sortBy field name to use to sort the messages by
     * @param {boolean} addIfDoesNotExist Add message if it is not in the list, used to prevent out of order updated messages from being added.
     */
    _addToMessageList(messages, message, timestampChanged = false, sortBy = 'created_at', addIfDoesNotExist = true) {
        return (0, utils_1.addToMessageList)(messages, message, timestampChanged, sortBy, addIfDoesNotExist);
    }
    /**
     * removeMessage - Description
     *
     * @param {{ id: string; parent_id?: string }} messageToRemove Object of the message to remove. Needs to have at id specified.
     *
     * @return {boolean} Returns if the message was removed
     */
    removeMessage(messageToRemove) {
        let isRemoved = false;
        if (messageToRemove.parent_id && this.threads[messageToRemove.parent_id]) {
            const { removed, result: threadMessages } = this.removeMessageFromArray(this.threads[messageToRemove.parent_id], messageToRemove);
            this.threads[messageToRemove.parent_id] = threadMessages;
            isRemoved = removed;
        }
        else {
            const messageSetIndex = messageToRemove.messageSetIndex ?? this.findMessageSetIndex(messageToRemove);
            if (messageSetIndex !== -1) {
                const { removed, result: messages } = this.removeMessageFromArray(this.messageSets[messageSetIndex].messages, messageToRemove);
                this.messageSets[messageSetIndex].messages = messages;
                isRemoved = removed;
            }
        }
        return isRemoved;
    }
    /**
     * filterErrorMessages - Removes error messages from the channel state.
     *
     */
    filterErrorMessages() {
        const filteredMessages = this.latestMessages.filter((message) => message.type !== 'error');
        this.latestMessages = filteredMessages;
    }
    /**
     * clean - Remove stale data such as users that stayed in typing state for more than 5 seconds
     */
    clean() {
        const now = new Date();
        // prevent old users from showing up as typing
        for (const [userID, lastEvent] of Object.entries(this.typing)) {
            const receivedAt = typeof lastEvent.received_at === 'string'
                ? new Date(lastEvent.received_at)
                : lastEvent.received_at || new Date();
            if (now.getTime() - receivedAt.getTime() > 7000) {
                delete this.typing[userID];
                this._channel.getClient().dispatchEvent({
                    cid: this._channel.cid,
                    type: 'typing.stop',
                    user: { id: userID },
                });
            }
        }
    }
    clearMessages() {
        this.initMessages();
        this.pinnedMessages = [];
    }
    initMessages() {
        this.messageSets = [{ messages: [], isLatest: true, isCurrent: true, pagination: constants_1.DEFAULT_MESSAGE_SET_PAGINATION }];
    }
    /**
     * loadMessageIntoState - Loads a given message (and messages around it) into the state
     *
     * @param {string} messageId The id of the message, or 'latest' to indicate switching to the latest messages
     * @param {string} parentMessageId The id of the parent message, if we want load a thread reply
     * @param {number} limit The page size if the message has to be queried from the server
     */
    async loadMessageIntoState(messageId, parentMessageId, limit = 25) {
        let messageSetIndex;
        let switchedToMessageSet = false;
        let loadedMessageThread = false;
        const messageIdToFind = parentMessageId || messageId;
        if (messageId === 'latest') {
            if (this.messages === this.latestMessages) {
                return;
            }
            messageSetIndex = this.messageSets.findIndex((s) => s.isLatest);
        }
        else {
            messageSetIndex = this.findMessageSetIndex({ id: messageIdToFind });
        }
        if (messageSetIndex !== -1) {
            this.switchToMessageSet(messageSetIndex);
            switchedToMessageSet = true;
        }
        loadedMessageThread = !parentMessageId || !!this.threads[parentMessageId]?.find((m) => m.id === messageId);
        if (switchedToMessageSet && loadedMessageThread) {
            return;
        }
        if (!switchedToMessageSet) {
            await this._channel.query({ messages: { id_around: messageIdToFind, limit } }, 'new');
        }
        if (!loadedMessageThread && parentMessageId) {
            await this._channel.getReplies(parentMessageId, { id_around: messageId, limit });
        }
        messageSetIndex = this.findMessageSetIndex({ id: messageIdToFind });
        if (messageSetIndex !== -1) {
            this.switchToMessageSet(messageSetIndex);
        }
    }
    /**
     * findMessage - Finds a message inside the state
     *
     * @param {string} messageId The id of the message
     * @param {string} parentMessageId The id of the parent message, if we want load a thread reply
     *
     * @return {ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>} Returns the message, or undefined if the message wasn't found
     */
    findMessage(messageId, parentMessageId) {
        if (parentMessageId) {
            const messages = this.threads[parentMessageId];
            if (!messages) {
                return undefined;
            }
            return messages.find((m) => m.id === messageId);
        }
        const messageSetIndex = this.findMessageSetIndex({ id: messageId });
        if (messageSetIndex === -1) {
            return undefined;
        }
        return this.messageSets[messageSetIndex].messages.find((m) => m.id === messageId);
    }
    switchToMessageSet(index) {
        const currentMessages = this.messageSets.find((s) => s.isCurrent);
        if (!currentMessages) {
            return;
        }
        currentMessages.isCurrent = false;
        this.messageSets[index].isCurrent = true;
    }
    areMessageSetsOverlap(messages1, messages2) {
        return messages1.some((m1) => messages2.find((m2) => m1.id === m2.id));
    }
    findMessageSetIndex(message) {
        return this.messageSets.findIndex((set) => !!set.messages.find((m) => m.id === message.id));
    }
    findTargetMessageSet(newMessages, addIfDoesNotExist = true, messageSetToAddToIfDoesNotExist = 'current') {
        let messagesToAdd = newMessages;
        let targetMessageSetIndex;
        if (addIfDoesNotExist) {
            const overlappingMessageSetIndices = this.messageSets
                .map((_, i) => i)
                .filter((i) => this.areMessageSetsOverlap(this.messageSets[i].messages, newMessages));
            switch (messageSetToAddToIfDoesNotExist) {
                case 'new':
                    if (overlappingMessageSetIndices.length > 0) {
                        targetMessageSetIndex = overlappingMessageSetIndices[0];
                        // No new message set is created if newMessages only contains thread replies
                    }
                    else if (newMessages.some((m) => !m.parent_id)) {
                        this.messageSets.push({
                            messages: [],
                            isCurrent: false,
                            isLatest: false,
                            pagination: constants_1.DEFAULT_MESSAGE_SET_PAGINATION,
                        });
                        targetMessageSetIndex = this.messageSets.length - 1;
                    }
                    break;
                case 'current':
                    targetMessageSetIndex = this.messageSets.findIndex((s) => s.isCurrent);
                    break;
                case 'latest':
                    targetMessageSetIndex = this.messageSets.findIndex((s) => s.isLatest);
                    break;
                default:
                    targetMessageSetIndex = -1;
            }
            // when merging the target set will be the first one from the overlapping message sets
            const mergeTargetMessageSetIndex = overlappingMessageSetIndices.splice(0, 1)[0];
            const mergeSourceMessageSetIndices = [...overlappingMessageSetIndices];
            if (mergeTargetMessageSetIndex !== undefined && mergeTargetMessageSetIndex !== targetMessageSetIndex) {
                mergeSourceMessageSetIndices.push(targetMessageSetIndex);
            }
            // merge message sets
            if (mergeSourceMessageSetIndices.length > 0) {
                const target = this.messageSets[mergeTargetMessageSetIndex];
                const sources = this.messageSets.filter((_, i) => mergeSourceMessageSetIndices.indexOf(i) !== -1);
                sources.forEach((messageSet) => {
                    target.isLatest = target.isLatest || messageSet.isLatest;
                    target.isCurrent = target.isCurrent || messageSet.isCurrent;
                    target.pagination.hasPrev =
                        messageSet.messages[0].created_at < target.messages[0].created_at
                            ? messageSet.pagination.hasPrev
                            : target.pagination.hasPrev;
                    target.pagination.hasNext =
                        target.messages.slice(-1)[0].created_at < messageSet.messages.slice(-1)[0].created_at
                            ? messageSet.pagination.hasNext
                            : target.pagination.hasNext;
                    messagesToAdd = [...messagesToAdd, ...messageSet.messages];
                });
                sources.forEach((s) => this.messageSets.splice(this.messageSets.indexOf(s), 1));
                const overlappingMessageSetIndex = this.messageSets.findIndex((s) => this.areMessageSetsOverlap(s.messages, newMessages));
                targetMessageSetIndex = overlappingMessageSetIndex;
            }
        }
        else {
            // assumes that all new messages belong to the same set
            targetMessageSetIndex = this.findMessageSetIndex(newMessages[0]);
        }
        return { targetMessageSetIndex, messagesToAdd };
    }
}
exports.ChannelState = ChannelState;
