import FormData from 'form-data';
import { AscDesc, ExtendableGenerics, DefaultGenerics, Logger, OwnUserResponse, UserResponse, MessageResponse, FormatMessageResponse, MessageSet, MessagePaginationOptions, ChannelQueryOptions, ChannelSort, ChannelFilters, ChannelSortBase, PromoteChannelParams } from './types';
import { StreamChat } from './client';
import { Channel } from './channel';
import { AxiosRequestConfig } from 'axios';
/**
 * logChatPromiseExecution - utility function for logging the execution of a promise..
 *  use this when you want to run the promise and handle errors by logging a warning
 *
 * @param {Promise<T>} promise The promise you want to run and log
 * @param {string} name    A descriptive name of what the promise does for log output
 *
 */
export declare function logChatPromiseExecution<T>(promise: Promise<T>, name: string): void;
export declare const sleep: (m: number) => Promise<void>;
export declare function isFunction<T>(value: Function | T): value is Function;
export declare const chatCodes: {
    TOKEN_EXPIRED: number;
    WS_CLOSED_SUCCESS: number;
};
export declare function isOwnUser<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(user?: OwnUserResponse<StreamChatGenerics> | UserResponse<StreamChatGenerics>): user is OwnUserResponse<StreamChatGenerics>;
export declare function isOwnUserBaseProperty(property: string): boolean;
export declare function addFileToFormData(uri: string | NodeJS.ReadableStream | Buffer | File, name?: string, contentType?: string): FormData;
export declare function normalizeQuerySort<T extends Record<string, AscDesc | undefined>>(sort: T | T[]): {
    direction: AscDesc;
    field: keyof T;
}[];
/**
 * retryInterval - A retry interval which increases acc to number of failures
 *
 * @return {number} Duration to wait in milliseconds
 */
export declare function retryInterval(numberOfFailures: number): number;
export declare function randomId(): string;
export declare function generateUUIDv4(): string;
export declare function convertErrorToJson(err: Error): Record<string, unknown>;
/**
 * isOnline safely return the navigator.online value for browser env
 * if navigator is not in global object, it always return true
 */
export declare function isOnline(): boolean;
/**
 * listenForConnectionChanges - Adds an event listener fired on browser going online or offline
 */
export declare function addConnectionEventListeners(cb: (e: Event) => void): void;
export declare function removeConnectionEventListeners(cb: (e: Event) => void): void;
export declare const axiosParamsSerializer: AxiosRequestConfig['paramsSerializer'];
/**
 * Takes the message object, parses the dates, sets `__html`
 * and sets the status to `received` if missing; returns a new message object.
 *
 * @param {MessageResponse<StreamChatGenerics>} message `MessageResponse` object
 */
export declare function formatMessage<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(message: MessageResponse<StreamChatGenerics> | FormatMessageResponse<StreamChatGenerics>): FormatMessageResponse<StreamChatGenerics>;
export declare const findIndexInSortedArray: <T, L>({ needle, sortedArray, selectKey, selectValueToCompare, sortDirection, }: {
    needle: T;
    sortedArray: readonly T[];
    /**
     * In an array of objects (like messages), pick a unique property identifying
     * an element. It will be used to find a direct match for the needle element
     * in case compare values are not unique.
     *
     * @example
     * ```ts
     * selectKey: (message) => message.id
     * ```
     */
    selectKey?: (arrayElement: T) => string;
    /**
     * In an array of objects (like messages), pick a specific
     * property to compare the needle value to.
     *
     * @example
     * ```ts
     * selectValueToCompare: (message) => message.created_at.getTime()
     * ```
     */
    selectValueToCompare?: (arrayElement: T) => L | T;
    /**
     * @default ascending
     * @description
     * ```md
     * ascending  - [1,2,3,4,5...]
     * descending - [...5,4,3,2,1]
     * ```
     */
    sortDirection?: "ascending" | "descending";
}) => number;
export declare function addToMessageList<T extends FormatMessageResponse>(messages: readonly T[], newMessage: T, timestampChanged?: boolean, sortBy?: 'pinned_at' | 'created_at', addIfDoesNotExist?: boolean): T[];
export interface DebouncedFunc<T extends (...args: any[]) => any> {
    /**
     * Call the original function, but applying the debounce rules.
     *
     * If the debounced function can be run immediately, this calls it and returns its return
     * value.
     *
     * Otherwise, it returns the return value of the last invocation, or undefined if the debounced
     * function was not invoked yet.
     */
    (...args: Parameters<T>): ReturnType<T> | undefined;
    /**
     * Throw away any pending invocation of the debounced function.
     */
    cancel(): void;
    /**
     * If there is a pending invocation of the debounced function, invoke it immediately and return
     * its return value.
     *
     * Otherwise, return the value from the last invocation, or undefined if the debounced function
     * was never invoked.
     */
    flush(): ReturnType<T> | undefined;
}
export declare const debounce: <T extends (...args: any[]) => any>(fn: T, timeout?: number, { leading, trailing }?: {
    leading?: boolean;
    trailing?: boolean;
}) => DebouncedFunc<T>;
export declare const throttle: <T extends (...args: unknown[]) => unknown>(fn: T, timeout?: number, { leading, trailing }?: {
    leading?: boolean;
    trailing?: boolean;
}) => (...args: Parameters<T>) => void;
export declare const uniqBy: <T>(array: T[] | unknown, iteratee: ((item: T) => unknown) | keyof T) => T[];
type MessagePaginationUpdatedParams<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> = {
    parentSet: MessageSet;
    requestedPageSize: number;
    returnedPage: MessageResponse<StreamChatGenerics>[];
    logger?: Logger;
    messagePaginationOptions?: MessagePaginationOptions;
};
export declare function binarySearchByDateEqualOrNearestGreater(array: {
    created_at?: string;
}[], targetDate: Date): number;
export declare const messageSetPagination: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(params: MessagePaginationUpdatedParams<StreamChatGenerics>) => {
    hasNext: boolean;
    hasPrev: boolean;
};
type GetChannelParams<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> = {
    client: StreamChat<StreamChatGenerics>;
    channel?: Channel<StreamChatGenerics>;
    id?: string;
    members?: string[];
    options?: ChannelQueryOptions<StreamChatGenerics>;
    type?: string;
};
/**
 * Calls channel.watch() if it was not already recently called. Waits for watch promise to resolve even if it was invoked previously.
 * If the channel is not passed as a property, it will get it either by its channel.cid or by its members list and do the same.
 * @param client
 * @param members
 * @param options
 * @param type
 * @param id
 * @param channel
 */
export declare const getAndWatchChannel: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>({ channel, client, id, members, options, type, }: GetChannelParams<StreamChatGenerics>) => Promise<Channel<StreamChatGenerics>>;
/**
 * Generates a temporary channel.cid for channels created without ID, as they need to be referenced
 * by an identifier until the back-end generates the final ID. The cid is generated by its member IDs
 * which are sorted and can be recreated the same every time given the same arguments.
 * @param channelType
 * @param members
 */
export declare const generateChannelTempCid: (channelType: string, members: string[]) => string | undefined;
/**
 * Checks if a channel is pinned or not. Will return true only if channel.state.membership.pinned_at exists.
 * @param channel
 */
export declare const isChannelPinned: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(channel: Channel<StreamChatGenerics>) => boolean;
/**
 * Checks if a channel is archived or not. Will return true only if channel.state.membership.archived_at exists.
 * @param channel
 */
export declare const isChannelArchived: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(channel: Channel<StreamChatGenerics>) => boolean;
/**
 * A utility that tells us whether we should consider archived channels or not based
 * on filters. Will return true only if filters.archived exists and is a boolean value.
 * @param filters
 */
export declare const shouldConsiderArchivedChannels: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(filters: ChannelFilters<StreamChatGenerics>) => boolean;
/**
 * Extracts the value of the sort parameter at a given index, for a targeted key. Can
 * handle both array and object versions of sort. Will return null if the index/key
 * combination does not exist.
 * @param atIndex - the index at which we'll examine the sort value, if it's an array one
 * @param sort - the sort value - both array and object notations are accepted
 * @param targetKey - the target key which needs to exist for the sort at a certain index
 */
export declare const extractSortValue: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>({ atIndex, sort, targetKey, }: {
    atIndex: number;
    targetKey: keyof ChannelSortBase<StreamChatGenerics>;
    sort?: ChannelSort<StreamChatGenerics>;
}) => NonNullable<ChannelSortBase<StreamChatGenerics>["unread_count" | "created_at" | "pinned_at" | "updated_at" | "last_message_at" | "member_count" | keyof StreamChatGenerics["channelType"] | "has_unread" | "last_updated"]> | null;
/**
 * Returns true only if `{ pinned_at: -1 }` or `{ pinned_at: 1 }` option is first within the `sort` array.
 */
export declare const shouldConsiderPinnedChannels: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>(sort: ChannelSort<StreamChatGenerics>) => boolean;
/**
 * Checks whether the sort value of type object contains a pinned_at value or if
 * an array sort value type has the first value be an object containing pinned_at.
 * @param sort
 */
export declare const findPinnedAtSortOrder: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>({ sort, }: {
    sort: ChannelSort<StreamChatGenerics>;
}) => NonNullable<ChannelSortBase<StreamChatGenerics>["unread_count" | "created_at" | "pinned_at" | "updated_at" | "last_message_at" | "member_count" | "has_unread" | "last_updated" | keyof StreamChatGenerics["channelType"]]> | null;
/**
 * Finds the index of the last consecutively pinned channel, starting from the start of the
 * array. Will not consider any pinned channels after the contiguous subsequence at the
 * start of the array.
 * @param channels
 */
export declare const findLastPinnedChannelIndex: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>({ channels, }: {
    channels: Channel<StreamChatGenerics>[];
}) => number | null;
/**
 * A utility used to move a channel towards the beginning of a list of channels (promote it to a higher position). It
 * considers pinned channels in the process if needed and makes sure to only update the list reference if the list
 * should actually change. It will try to move the channel as high as it can within the list.
 * @param channels - the list of channels we want to modify
 * @param channelToMove - the channel we want to promote
 * @param channelToMoveIndexWithinChannels - optionally, the index of the channel we want to move if we know it (will skip a manual check)
 * @param sort - the sort value used to check for pinned channels
 */
export declare const promoteChannel: <StreamChatGenerics extends ExtendableGenerics = DefaultGenerics>({ channels, channelToMove, channelToMoveIndexWithinChannels, sort, }: PromoteChannelParams<StreamChatGenerics>) => Channel<StreamChatGenerics>[];
export {};
//# sourceMappingURL=utils.d.ts.map