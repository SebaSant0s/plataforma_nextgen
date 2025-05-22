"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = exports.DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS = exports.DEFAULT_CHANNEL_MANAGER_OPTIONS = exports.channelManagerEventToHandlerMapping = void 0;
const store_1 = require("./store");
const utils_1 = require("./utils");
exports.channelManagerEventToHandlerMapping = {
    'channel.deleted': 'channelDeletedHandler',
    'channel.hidden': 'channelHiddenHandler',
    'channel.truncated': 'channelTruncatedHandler',
    'channel.updated': 'channelUpdatedHandler',
    'channel.visible': 'channelVisibleHandler',
    'message.new': 'newMessageHandler',
    'member.updated': 'memberUpdatedHandler',
    'notification.added_to_channel': 'notificationAddedToChannelHandler',
    'notification.message_new': 'notificationNewMessageHandler',
    'notification.removed_from_channel': 'notificationRemovedFromChannelHandler',
};
exports.DEFAULT_CHANNEL_MANAGER_OPTIONS = {
    abortInFlightQuery: false,
    allowNotLoadedChannelPromotionForEvent: {
        'channel.visible': true,
        'message.new': true,
        'notification.added_to_channel': true,
        'notification.message_new': true,
    },
    lockChannelOrder: false,
};
exports.DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS = {
    limit: 10,
    offset: 0,
};
/**
 * A class that manages a list of channels and changes it based on configuration and WS events. The
 * list of channels is reactive as well as the pagination and it can be subscribed to for state updates.
 *
 * @internal
 */
class ChannelManager {
    constructor({ client, eventHandlerOverrides = {}, options = {}, }) {
        this.unsubscribeFunctions = new Set();
        this.eventHandlers = new Map();
        this.eventHandlerOverrides = new Map();
        this.options = {};
        this.stateOptions = {};
        this.setChannels = (valueOrFactory) => {
            this.state.next((current) => {
                const { channels: currentChannels } = current;
                const newChannels = (0, store_1.isPatch)(valueOrFactory) ? valueOrFactory(currentChannels) : valueOrFactory;
                // If the references between the two values are the same, just return the
                // current state; otherwise trigger a state change.
                if (currentChannels === newChannels) {
                    return current;
                }
                return { ...current, channels: newChannels };
            });
        };
        this.setEventHandlerOverrides = (eventHandlerOverrides = {}) => {
            const truthyEventHandlerOverrides = Object.entries(eventHandlerOverrides).reduce((acc, [key, value]) => {
                if (value) {
                    acc[key] = value;
                }
                return acc;
            }, {});
            this.eventHandlerOverrides = new Map(Object.entries(truthyEventHandlerOverrides));
        };
        this.setOptions = (options = {}) => {
            this.options = { ...exports.DEFAULT_CHANNEL_MANAGER_OPTIONS, ...options };
        };
        this.queryChannels = async (filters, sort = [], options = {}, stateOptions = {}) => {
            const { offset, limit } = { ...exports.DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS, ...options };
            const { pagination: { isLoading }, } = this.state.getLatestValue();
            if (isLoading && !this.options.abortInFlightQuery) {
                return;
            }
            try {
                this.stateOptions = stateOptions;
                this.state.next((currentState) => ({
                    ...currentState,
                    pagination: {
                        ...currentState.pagination,
                        isLoading: true,
                        isLoadingNext: false,
                        filters,
                        sort,
                        options,
                    },
                }));
                const channels = await this.client.queryChannels(filters, sort, options, stateOptions);
                const newOffset = offset + (channels?.length ?? 0);
                const newOptions = { ...options, offset: newOffset };
                const { pagination } = this.state.getLatestValue();
                this.state.partialNext({
                    channels,
                    pagination: {
                        ...pagination,
                        hasNext: (channels?.length ?? 0) >= limit,
                        isLoading: false,
                        options: newOptions,
                    },
                    initialized: true,
                });
            }
            catch (error) {
                this.client.logger('error', error.message);
                this.state.next((currentState) => ({
                    ...currentState,
                    pagination: { ...currentState.pagination, isLoading: false },
                }));
                throw error;
            }
        };
        this.loadNext = async () => {
            const { pagination, initialized } = this.state.getLatestValue();
            const { filters, sort, options, isLoadingNext, hasNext } = pagination;
            if (!initialized || isLoadingNext || !hasNext) {
                return;
            }
            try {
                const { offset, limit } = { ...exports.DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS, ...options };
                this.state.partialNext({
                    pagination: { ...pagination, isLoading: false, isLoadingNext: true },
                });
                const nextChannels = await this.client.queryChannels(filters, sort, options, this.stateOptions);
                const { channels } = this.state.getLatestValue();
                const newOffset = offset + (nextChannels?.length ?? 0);
                const newOptions = { ...options, offset: newOffset };
                this.state.partialNext({
                    channels: (0, utils_1.uniqBy)([...(channels || []), ...nextChannels], 'cid'),
                    pagination: {
                        ...pagination,
                        hasNext: (nextChannels?.length ?? 0) >= limit,
                        isLoading: false,
                        isLoadingNext: false,
                        options: newOptions,
                    },
                });
            }
            catch (error) {
                this.client.logger('error', error.message);
                this.state.next((currentState) => ({
                    ...currentState,
                    pagination: { ...currentState.pagination, isLoadingNext: false },
                }));
                throw error;
            }
        };
        this.notificationAddedToChannelHandler = async (event) => {
            const { id, type, members } = event?.channel ?? {};
            if (!type || !this.options.allowNotLoadedChannelPromotionForEvent?.['notification.added_to_channel']) {
                return;
            }
            const channel = await (0, utils_1.getAndWatchChannel)({
                client: this.client,
                id,
                members: members?.reduce((acc, { user, user_id }) => {
                    const userId = user_id || user?.id;
                    if (userId) {
                        acc.push(userId);
                    }
                    return acc;
                }, []),
                type,
            });
            const { pagination, channels } = this.state.getLatestValue();
            if (!channels) {
                return;
            }
            const { sort } = pagination ?? {};
            this.setChannels((0, utils_1.promoteChannel)({
                channels,
                channelToMove: channel,
                sort,
            }));
        };
        this.channelDeletedHandler = (event) => {
            const { channels } = this.state.getLatestValue();
            if (!channels) {
                return;
            }
            const newChannels = [...channels];
            const channelIndex = newChannels.findIndex((channel) => channel.cid === (event.cid || event.channel?.cid));
            if (channelIndex < 0) {
                return;
            }
            newChannels.splice(channelIndex, 1);
            this.setChannels(newChannels);
        };
        this.channelHiddenHandler = this.channelDeletedHandler;
        this.newMessageHandler = (event) => {
            const { pagination, channels } = this.state.getLatestValue();
            if (!channels) {
                return;
            }
            const { filters, sort } = pagination ?? {};
            const channelType = event.channel_type;
            const channelId = event.channel_id;
            if (!channelType || !channelId) {
                return;
            }
            const targetChannel = this.client.channel(channelType, channelId);
            const targetChannelIndex = channels.indexOf(targetChannel);
            const targetChannelExistsWithinList = targetChannelIndex >= 0;
            const isTargetChannelPinned = (0, utils_1.isChannelPinned)(targetChannel);
            const isTargetChannelArchived = (0, utils_1.isChannelArchived)(targetChannel);
            const considerArchivedChannels = (0, utils_1.shouldConsiderArchivedChannels)(filters);
            const considerPinnedChannels = (0, utils_1.shouldConsiderPinnedChannels)(sort);
            if (
            // filter is defined, target channel is archived and filter option is set to false
            (considerArchivedChannels && isTargetChannelArchived && !filters.archived) ||
                // filter is defined, target channel isn't archived and filter option is set to true
                (considerArchivedChannels && !isTargetChannelArchived && filters.archived) ||
                // sort option is defined, target channel is pinned
                (considerPinnedChannels && isTargetChannelPinned) ||
                // list order is locked
                this.options.lockChannelOrder ||
                // target channel is not within the loaded list and loading from cache is disallowed
                (!targetChannelExistsWithinList && !this.options.allowNotLoadedChannelPromotionForEvent?.['message.new'])) {
                return;
            }
            this.setChannels((0, utils_1.promoteChannel)({
                channels,
                channelToMove: targetChannel,
                channelToMoveIndexWithinChannels: targetChannelIndex,
                sort,
            }));
        };
        this.notificationNewMessageHandler = async (event) => {
            const { id, type } = event?.channel ?? {};
            if (!id || !type) {
                return;
            }
            const channel = await (0, utils_1.getAndWatchChannel)({
                client: this.client,
                id,
                type,
            });
            const { channels, pagination } = this.state.getLatestValue();
            const { filters, sort } = pagination ?? {};
            const considerArchivedChannels = (0, utils_1.shouldConsiderArchivedChannels)(filters);
            const isTargetChannelArchived = (0, utils_1.isChannelArchived)(channel);
            if (!channels ||
                (considerArchivedChannels && isTargetChannelArchived && !filters.archived) ||
                (considerArchivedChannels && !isTargetChannelArchived && filters.archived) ||
                !this.options.allowNotLoadedChannelPromotionForEvent?.['notification.message_new']) {
                return;
            }
            this.setChannels((0, utils_1.promoteChannel)({
                channels,
                channelToMove: channel,
                sort,
            }));
        };
        this.channelVisibleHandler = async (event) => {
            const { channel_type: channelType, channel_id: channelId } = event;
            if (!channelType || !channelId) {
                return;
            }
            const channel = await (0, utils_1.getAndWatchChannel)({
                client: this.client,
                id: event.channel_id,
                type: event.channel_type,
            });
            const { channels, pagination } = this.state.getLatestValue();
            const { sort, filters } = pagination ?? {};
            const considerArchivedChannels = (0, utils_1.shouldConsiderArchivedChannels)(filters);
            const isTargetChannelArchived = (0, utils_1.isChannelArchived)(channel);
            if (!channels ||
                (considerArchivedChannels && isTargetChannelArchived && !filters.archived) ||
                (considerArchivedChannels && !isTargetChannelArchived && filters.archived) ||
                !this.options.allowNotLoadedChannelPromotionForEvent?.['channel.visible']) {
                return;
            }
            this.setChannels((0, utils_1.promoteChannel)({
                channels,
                channelToMove: channel,
                sort,
            }));
        };
        this.notificationRemovedFromChannelHandler = this.channelDeletedHandler;
        this.memberUpdatedHandler = (event) => {
            const { pagination, channels } = this.state.getLatestValue();
            const { filters, sort } = pagination;
            if (!event.member?.user ||
                event.member.user.id !== this.client.userID ||
                !event.channel_type ||
                !event.channel_id) {
                return;
            }
            const channelType = event.channel_type;
            const channelId = event.channel_id;
            const considerPinnedChannels = (0, utils_1.shouldConsiderPinnedChannels)(sort);
            const considerArchivedChannels = (0, utils_1.shouldConsiderArchivedChannels)(filters);
            const pinnedAtSort = (0, utils_1.extractSortValue)({ atIndex: 0, sort, targetKey: 'pinned_at' });
            if (!channels || (!considerPinnedChannels && !considerArchivedChannels) || this.options.lockChannelOrder) {
                return;
            }
            const targetChannel = this.client.channel(channelType, channelId);
            // assumes that channel instances are not changing
            const targetChannelIndex = channels.indexOf(targetChannel);
            const targetChannelExistsWithinList = targetChannelIndex >= 0;
            const isTargetChannelPinned = (0, utils_1.isChannelPinned)(targetChannel);
            const isTargetChannelArchived = (0, utils_1.isChannelArchived)(targetChannel);
            const newChannels = [...channels];
            if (targetChannelExistsWithinList) {
                newChannels.splice(targetChannelIndex, 1);
            }
            // handle archiving (remove channel)
            if (
            // When archived filter true, and channel is unarchived
            (considerArchivedChannels && !isTargetChannelArchived && filters?.archived) ||
                // When archived filter false, and channel is archived
                (considerArchivedChannels && isTargetChannelArchived && !filters?.archived)) {
                this.setChannels(newChannels);
                return;
            }
            // handle pinning
            let lastPinnedChannelIndex = null;
            if (pinnedAtSort === 1 || (pinnedAtSort === -1 && !isTargetChannelPinned)) {
                lastPinnedChannelIndex = (0, utils_1.findLastPinnedChannelIndex)({ channels: newChannels });
            }
            const newTargetChannelIndex = typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0;
            // skip state update if the position of the channel does not change
            if (channels[newTargetChannelIndex] === targetChannel) {
                return;
            }
            newChannels.splice(newTargetChannelIndex, 0, targetChannel);
            this.setChannels(newChannels);
        };
        this.subscriptionOrOverride = (event) => {
            const handlerName = exports.channelManagerEventToHandlerMapping[event.type];
            const defaultEventHandler = this.eventHandlers.get(handlerName);
            const eventHandlerOverride = this.eventHandlerOverrides.get(handlerName);
            if (eventHandlerOverride && typeof eventHandlerOverride === 'function') {
                eventHandlerOverride(this.setChannels, event);
                return;
            }
            if (defaultEventHandler && typeof defaultEventHandler === 'function') {
                defaultEventHandler(event);
            }
        };
        this.registerSubscriptions = () => {
            if (this.unsubscribeFunctions.size) {
                // Already listening for events and changes
                return;
            }
            for (const eventType of Object.keys(exports.channelManagerEventToHandlerMapping)) {
                this.unsubscribeFunctions.add(this.client.on(eventType, this.subscriptionOrOverride).unsubscribe);
            }
        };
        this.unregisterSubscriptions = () => {
            this.unsubscribeFunctions.forEach((cleanupFunction) => cleanupFunction());
            this.unsubscribeFunctions.clear();
        };
        this.client = client;
        this.state = new store_1.StateStore({
            channels: [],
            pagination: {
                isLoading: false,
                isLoadingNext: false,
                hasNext: false,
                filters: {},
                sort: {},
                options: exports.DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS,
            },
            initialized: false,
        });
        this.setEventHandlerOverrides(eventHandlerOverrides);
        this.setOptions(options);
        this.eventHandlers = new Map(Object.entries({
            channelDeletedHandler: this.channelDeletedHandler,
            channelHiddenHandler: this.channelHiddenHandler,
            channelVisibleHandler: this.channelVisibleHandler,
            memberUpdatedHandler: this.memberUpdatedHandler,
            newMessageHandler: this.newMessageHandler,
            notificationAddedToChannelHandler: this.notificationAddedToChannelHandler,
            notificationNewMessageHandler: this.notificationNewMessageHandler,
            notificationRemovedFromChannelHandler: this.notificationRemovedFromChannelHandler,
        }));
    }
}
exports.ChannelManager = ChannelManager;
