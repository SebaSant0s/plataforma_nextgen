import type { StreamChat } from './client';
import type { DefaultGenerics, ExtendableGenerics, Event, ChannelOptions, ChannelStateOptions, ChannelFilters, ChannelSort } from './types';
import { StateStore, ValueOrPatch } from './store';
import { Channel } from './channel';
export type ChannelManagerPagination<SCG extends ExtendableGenerics = DefaultGenerics> = {
    filters: ChannelFilters<SCG>;
    hasNext: boolean;
    isLoading: boolean;
    isLoadingNext: boolean;
    options: ChannelOptions;
    sort: ChannelSort<SCG>;
};
export type ChannelManagerState<SCG extends ExtendableGenerics = DefaultGenerics> = {
    channels: Channel<SCG>[];
    /**
     * This value will become true the first time queryChannels is successfully executed and
     * will remain false otherwise. It's used as a control property regarding whether the list
     * has been initialized yet (i.e a query has already been done at least once) or not. We do
     * this to prevent state.channels from being forced to be nullable.
     */
    initialized: boolean;
    pagination: ChannelManagerPagination<SCG>;
};
export type ChannelSetterParameterType<SCG extends ExtendableGenerics = DefaultGenerics> = ValueOrPatch<ChannelManagerState<SCG>['channels']>;
export type ChannelSetterType<SCG extends ExtendableGenerics = DefaultGenerics> = (arg: ChannelSetterParameterType<SCG>) => void;
export type GenericEventHandlerType<T extends unknown[]> = (...args: T) => void | (() => void) | ((...args: T) => Promise<void>) | Promise<void>;
export type EventHandlerType<SCG extends ExtendableGenerics = DefaultGenerics> = GenericEventHandlerType<[Event<SCG>]>;
export type EventHandlerOverrideType<SCG extends ExtendableGenerics = DefaultGenerics> = GenericEventHandlerType<[
    ChannelSetterType<SCG>,
    Event<SCG>
]>;
export type ChannelManagerEventTypes = 'notification.added_to_channel' | 'notification.message_new' | 'notification.removed_from_channel' | 'message.new' | 'member.updated' | 'channel.deleted' | 'channel.hidden' | 'channel.truncated' | 'channel.visible' | 'channel.updated';
export type ChannelManagerEventHandlerNames = 'channelDeletedHandler' | 'channelHiddenHandler' | 'channelTruncatedHandler' | 'channelUpdatedHandler' | 'channelVisibleHandler' | 'newMessageHandler' | 'memberUpdatedHandler' | 'notificationAddedToChannelHandler' | 'notificationNewMessageHandler' | 'notificationRemovedFromChannelHandler';
export type ChannelManagerEventHandlerOverrides<SCG extends ExtendableGenerics = DefaultGenerics> = Partial<Record<ChannelManagerEventHandlerNames, EventHandlerOverrideType<SCG>>>;
export declare const channelManagerEventToHandlerMapping: {
    [key in ChannelManagerEventTypes]: ChannelManagerEventHandlerNames;
};
export type ChannelManagerOptions = {
    /**
     * Aborts a channels query that is already in progress and runs the new one.
     */
    abortInFlightQuery?: boolean;
    /**
     * Allows channel promotion to be applied where applicable for channels that are
     * currently not part of the channel list within the state. A good example of
     * this would be a channel that is being watched and it receives a new message,
     * but is not part of the list initially.
     */
    allowNotLoadedChannelPromotionForEvent?: {
        'channel.visible': boolean;
        'message.new': boolean;
        'notification.added_to_channel': boolean;
        'notification.message_new': boolean;
    };
    /**
     * Allows us to lock the order of channels within the list. Any event that would
     * change the order of channels within the list will do nothing.
     */
    lockChannelOrder?: boolean;
};
export declare const DEFAULT_CHANNEL_MANAGER_OPTIONS: {
    abortInFlightQuery: boolean;
    allowNotLoadedChannelPromotionForEvent: {
        'channel.visible': boolean;
        'message.new': boolean;
        'notification.added_to_channel': boolean;
        'notification.message_new': boolean;
    };
    lockChannelOrder: boolean;
};
export declare const DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS: {
    limit: number;
    offset: number;
};
/**
 * A class that manages a list of channels and changes it based on configuration and WS events. The
 * list of channels is reactive as well as the pagination and it can be subscribed to for state updates.
 *
 * @internal
 */
export declare class ChannelManager<SCG extends ExtendableGenerics = DefaultGenerics> {
    readonly state: StateStore<ChannelManagerState<SCG>>;
    private client;
    private unsubscribeFunctions;
    private eventHandlers;
    private eventHandlerOverrides;
    private options;
    private stateOptions;
    constructor({ client, eventHandlerOverrides, options, }: {
        client: StreamChat<SCG>;
        eventHandlerOverrides?: ChannelManagerEventHandlerOverrides<SCG>;
        options?: ChannelManagerOptions;
    });
    setChannels: (valueOrFactory: ChannelSetterParameterType<SCG>) => void;
    setEventHandlerOverrides: (eventHandlerOverrides?: ChannelManagerEventHandlerOverrides<SCG>) => void;
    setOptions: (options?: ChannelManagerOptions) => void;
    queryChannels: (filters: ChannelFilters<SCG>, sort?: ChannelSort<SCG>, options?: ChannelOptions, stateOptions?: ChannelStateOptions) => Promise<void>;
    loadNext: () => Promise<void>;
    private notificationAddedToChannelHandler;
    private channelDeletedHandler;
    private channelHiddenHandler;
    private newMessageHandler;
    private notificationNewMessageHandler;
    private channelVisibleHandler;
    private notificationRemovedFromChannelHandler;
    private memberUpdatedHandler;
    private subscriptionOrOverride;
    registerSubscriptions: () => void;
    unregisterSubscriptions: () => void;
}
//# sourceMappingURL=channel_manager.d.ts.map