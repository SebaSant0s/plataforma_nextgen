import { DebouncedFunc } from './utils';
import { StateStore } from './store';
import type { Channel } from './channel';
import type { StreamChat } from './client';
import type { ChannelFilters, ChannelOptions, ChannelSort, DefaultGenerics, ExtendableGenerics, MessageFilters, MessageResponse, SearchMessageSort, UserFilters, UserOptions, UserResponse, UserSort } from './types';
export type SearchSourceType = 'channels' | 'users' | 'messages' | (string & {});
export type QueryReturnValue<T> = {
    items: T[];
    next?: string;
};
export type DebounceOptions = {
    debounceMs: number;
};
type DebouncedExecQueryFunction = DebouncedFunc<(searchString?: string) => Promise<void>>;
export interface SearchSource<T = any> {
    activate(): void;
    deactivate(): void;
    readonly hasNext: boolean;
    readonly hasResults: boolean;
    readonly initialState: SearchSourceState<T>;
    readonly isActive: boolean;
    readonly isLoading: boolean;
    readonly items: T[] | undefined;
    readonly lastQueryError: Error | undefined;
    readonly next: string | undefined;
    readonly offset: number | undefined;
    resetState(): void;
    search(text?: string): void;
    searchDebounced: DebouncedExecQueryFunction;
    readonly searchQuery: string;
    setDebounceOptions(options: DebounceOptions): void;
    readonly state: StateStore<SearchSourceState<T>>;
    readonly type: SearchSourceType;
}
export type SearchSourceState<T = any> = {
    hasNext: boolean;
    isActive: boolean;
    isLoading: boolean;
    items: T[] | undefined;
    searchQuery: string;
    lastQueryError?: Error;
    next?: string;
    offset?: number;
};
export type SearchSourceOptions = {
    /** The number of milliseconds to debounce the search query. The default interval is 300ms. */
    debounceMs?: number;
    pageSize?: number;
};
export declare abstract class BaseSearchSource<T> implements SearchSource<T> {
    state: StateStore<SearchSourceState<T>>;
    protected pageSize: number;
    abstract readonly type: SearchSourceType;
    searchDebounced: DebouncedExecQueryFunction;
    protected constructor(options?: SearchSourceOptions);
    get lastQueryError(): Error | undefined;
    get hasNext(): boolean;
    get hasResults(): boolean;
    get isActive(): boolean;
    get isLoading(): boolean;
    get initialState(): {
        hasNext: boolean;
        isActive: boolean;
        isLoading: boolean;
        items: undefined;
        lastQueryError: undefined;
        next: undefined;
        offset: number;
        searchQuery: string;
    };
    get items(): T[] | undefined;
    get next(): string | undefined;
    get offset(): number | undefined;
    get searchQuery(): string;
    protected abstract query(searchQuery: string): Promise<QueryReturnValue<T>>;
    protected abstract filterQueryResults(items: T[]): T[] | Promise<T[]>;
    setDebounceOptions: ({ debounceMs }: DebounceOptions) => void;
    activate: () => void;
    deactivate: () => void;
    executeQuery(newSearchString?: string): Promise<void>;
    search: (searchQuery?: string) => void;
    resetState(): void;
}
export declare class UserSearchSource<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> extends BaseSearchSource<UserResponse<StreamChatGenerics>> {
    readonly type = "users";
    private client;
    filters: UserFilters<StreamChatGenerics> | undefined;
    sort: UserSort<StreamChatGenerics> | undefined;
    searchOptions: Omit<UserOptions, 'limit' | 'offset'> | undefined;
    constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions);
    protected query(searchQuery: string): Promise<{
        items: UserResponse<StreamChatGenerics>[];
    }>;
    protected filterQueryResults(items: UserResponse<StreamChatGenerics>[]): UserResponse<StreamChatGenerics>[];
}
export declare class ChannelSearchSource<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> extends BaseSearchSource<Channel<StreamChatGenerics>> {
    readonly type = "channels";
    private client;
    filters: ChannelFilters<StreamChatGenerics> | undefined;
    sort: ChannelSort<StreamChatGenerics> | undefined;
    searchOptions: Omit<ChannelOptions, 'limit' | 'offset'> | undefined;
    constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions);
    protected query(searchQuery: string): Promise<{
        items: Channel<StreamChatGenerics>[];
    }>;
    protected filterQueryResults(items: Channel<StreamChatGenerics>[]): Channel<StreamChatGenerics>[];
}
export declare class MessageSearchSource<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> extends BaseSearchSource<MessageResponse<StreamChatGenerics>> {
    readonly type = "messages";
    private client;
    messageSearchChannelFilters: ChannelFilters<StreamChatGenerics> | undefined;
    messageSearchFilters: MessageFilters<StreamChatGenerics> | undefined;
    messageSearchSort: SearchMessageSort<StreamChatGenerics> | undefined;
    channelQueryFilters: ChannelFilters<StreamChatGenerics> | undefined;
    channelQuerySort: ChannelSort<StreamChatGenerics> | undefined;
    channelQueryOptions: Omit<ChannelOptions, 'limit' | 'offset'> | undefined;
    constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions);
    protected query(searchQuery: string): Promise<{
        items: never[];
        next?: undefined;
    } | {
        items: MessageResponse<StreamChatGenerics>[];
        next: string | undefined;
    }>;
    protected filterQueryResults(items: MessageResponse<StreamChatGenerics>[]): MessageResponse<StreamChatGenerics>[];
}
export type DefaultSearchSources<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> = [
    UserSearchSource<StreamChatGenerics>,
    ChannelSearchSource<StreamChatGenerics>,
    MessageSearchSource<StreamChatGenerics>
];
export type SearchControllerState = {
    isActive: boolean;
    searchQuery: string;
    sources: SearchSource[];
};
export type InternalSearchControllerState<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> = {
    focusedMessage?: MessageResponse<StreamChatGenerics>;
};
export type SearchControllerConfig = {
    keepSingleActiveSource: boolean;
};
export type SearchControllerOptions = {
    config?: Partial<SearchControllerConfig>;
    sources?: SearchSource[];
};
export declare class SearchController<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    /**
     * Not intended for direct use by integrators, might be removed without notice resulting in
     * broken integrations.
     */
    _internalState: StateStore<InternalSearchControllerState<StreamChatGenerics>>;
    state: StateStore<SearchControllerState>;
    config: SearchControllerConfig;
    constructor({ config, sources }?: SearchControllerOptions);
    get hasNext(): boolean;
    get sources(): SearchSource<any>[];
    get activeSources(): SearchSource<any>[];
    get isActive(): boolean;
    get searchQuery(): string;
    get searchSourceTypes(): Array<SearchSource['type']>;
    addSource: (source: SearchSource) => void;
    getSource: (sourceType: SearchSource["type"]) => SearchSource<any> | undefined;
    removeSource: (sourceType: SearchSource["type"]) => void;
    activateSource: (sourceType: SearchSource["type"]) => void;
    deactivateSource: (sourceType: SearchSource["type"]) => void;
    activate: () => void;
    search: (searchQuery?: string) => Promise<void>;
    cancelSearchQueries: () => void;
    clear: () => void;
    exit: () => void;
}
export {};
//# sourceMappingURL=search_controller.d.ts.map