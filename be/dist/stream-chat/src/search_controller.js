"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = exports.MessageSearchSource = exports.ChannelSearchSource = exports.UserSearchSource = exports.BaseSearchSource = void 0;
const utils_1 = require("./utils");
const store_1 = require("./store");
const DEFAULT_SEARCH_SOURCE_OPTIONS = {
    debounceMs: 300,
    pageSize: 10,
};
class BaseSearchSource {
    constructor(options) {
        this.setDebounceOptions = ({ debounceMs }) => {
            this.searchDebounced = (0, utils_1.debounce)(this.executeQuery.bind(this), debounceMs);
        };
        this.activate = () => {
            if (this.isActive)
                return;
            this.state.partialNext({ isActive: true });
        };
        this.deactivate = () => {
            if (!this.isActive)
                return;
            this.state.partialNext({ isActive: false });
        };
        this.search = (searchQuery) => {
            this.searchDebounced(searchQuery);
        };
        const { debounceMs, pageSize } = { ...DEFAULT_SEARCH_SOURCE_OPTIONS, ...options };
        this.pageSize = pageSize;
        this.state = new store_1.StateStore(this.initialState);
        this.setDebounceOptions({ debounceMs });
    }
    get lastQueryError() {
        return this.state.getLatestValue().lastQueryError;
    }
    get hasNext() {
        return this.state.getLatestValue().hasNext;
    }
    get hasResults() {
        return Array.isArray(this.state.getLatestValue().items);
    }
    get isActive() {
        return this.state.getLatestValue().isActive;
    }
    get isLoading() {
        return this.state.getLatestValue().isLoading;
    }
    get initialState() {
        return {
            hasNext: true,
            isActive: false,
            isLoading: false,
            items: undefined,
            lastQueryError: undefined,
            next: undefined,
            offset: 0,
            searchQuery: '',
        };
    }
    get items() {
        return this.state.getLatestValue().items;
    }
    get next() {
        return this.state.getLatestValue().next;
    }
    get offset() {
        return this.state.getLatestValue().offset;
    }
    get searchQuery() {
        return this.state.getLatestValue().searchQuery;
    }
    async executeQuery(newSearchString) {
        const hasNewSearchQuery = typeof newSearchString !== 'undefined';
        const searchString = newSearchString ?? this.searchQuery;
        if (!this.isActive || this.isLoading || (!this.hasNext && !hasNewSearchQuery) || !searchString)
            return;
        if (hasNewSearchQuery) {
            this.state.next({
                ...this.initialState,
                isActive: this.isActive,
                isLoading: true,
                searchQuery: newSearchString ?? '',
            });
        }
        else {
            this.state.partialNext({ isLoading: true });
        }
        const stateUpdate = {};
        try {
            const results = await this.query(searchString);
            if (!results)
                return;
            const { items, next } = results;
            if (next) {
                stateUpdate.next = next;
                stateUpdate.hasNext = !!next;
            }
            else {
                stateUpdate.offset = (this.offset ?? 0) + items.length;
                stateUpdate.hasNext = items.length === this.pageSize;
            }
            stateUpdate.items = await this.filterQueryResults(items);
        }
        catch (e) {
            stateUpdate.lastQueryError = e;
        }
        finally {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            this.state.next(({ lastQueryError, ...current }) => ({
                ...current,
                ...stateUpdate,
                isLoading: false,
                items: [...(current.items ?? []), ...(stateUpdate.items || [])],
            }));
        }
    }
    resetState() {
        this.state.next(this.initialState);
    }
}
exports.BaseSearchSource = BaseSearchSource;
class UserSearchSource extends BaseSearchSource {
    constructor(client, options) {
        super(options);
        this.type = 'users';
        this.client = client;
    }
    async query(searchQuery) {
        const filters = {
            $or: [{ id: { $autocomplete: searchQuery } }, { name: { $autocomplete: searchQuery } }],
            ...this.filters,
        };
        const sort = { id: 1, ...this.sort };
        const options = { ...this.searchOptions, limit: this.pageSize, offset: this.offset };
        const { users } = await this.client.queryUsers(filters, sort, options);
        return { items: users };
    }
    filterQueryResults(items) {
        return items.filter((u) => u.id !== this.client.user?.id);
    }
}
exports.UserSearchSource = UserSearchSource;
class ChannelSearchSource extends BaseSearchSource {
    constructor(client, options) {
        super(options);
        this.type = 'channels';
        this.client = client;
    }
    async query(searchQuery) {
        const filters = {
            members: { $in: [this.client.userID] },
            name: { $autocomplete: searchQuery },
            ...this.filters,
        };
        const sort = this.sort ?? {};
        const options = { ...this.searchOptions, limit: this.pageSize, offset: this.offset };
        const items = await this.client.queryChannels(filters, sort, options);
        return { items };
    }
    filterQueryResults(items) {
        return items;
    }
}
exports.ChannelSearchSource = ChannelSearchSource;
class MessageSearchSource extends BaseSearchSource {
    constructor(client, options) {
        super(options);
        this.type = 'messages';
        this.client = client;
    }
    async query(searchQuery) {
        if (!this.client.userID)
            return { items: [] };
        const channelFilters = {
            members: { $in: [this.client.userID] },
            ...this.messageSearchChannelFilters,
        };
        const messageFilters = {
            text: searchQuery,
            type: 'regular', // FIXME: type: 'reply' resp. do not filter by type and allow to jump to a message in a thread - missing support
            ...this.messageSearchFilters,
        };
        const sort = {
            created_at: -1,
            ...this.messageSearchSort,
        };
        const options = {
            limit: this.pageSize,
            next: this.next,
            sort,
        };
        const { next, results } = await this.client.search(channelFilters, messageFilters, options);
        const items = results.map(({ message }) => message);
        const cids = Array.from(items.reduce((acc, message) => {
            if (message.cid && !this.client.activeChannels[message.cid])
                acc.add(message.cid);
            return acc;
        }, new Set()));
        const allChannelsLoadedLocally = cids.length === 0;
        if (!allChannelsLoadedLocally) {
            await this.client.queryChannels({
                cid: { $in: cids },
                ...this.channelQueryFilters,
            }, {
                last_message_at: -1,
                ...this.channelQuerySort,
            }, this.channelQueryOptions);
        }
        return { items, next };
    }
    filterQueryResults(items) {
        return items;
    }
}
exports.MessageSearchSource = MessageSearchSource;
class SearchController {
    constructor({ config, sources } = {}) {
        this.addSource = (source) => {
            this.state.partialNext({
                sources: [...this.sources, source],
            });
        };
        this.getSource = (sourceType) => this.sources.find((s) => s.type === sourceType);
        this.removeSource = (sourceType) => {
            const newSources = this.sources.filter((s) => s.type !== sourceType);
            if (newSources.length === this.sources.length)
                return;
            this.state.partialNext({ sources: newSources });
        };
        this.activateSource = (sourceType) => {
            const source = this.getSource(sourceType);
            if (!source || source.isActive)
                return;
            if (this.config.keepSingleActiveSource) {
                this.sources.forEach((s) => {
                    if (s.type !== sourceType) {
                        s.deactivate();
                    }
                });
            }
            source.activate();
            this.state.partialNext({ sources: [...this.sources] });
        };
        this.deactivateSource = (sourceType) => {
            const source = this.getSource(sourceType);
            if (!source?.isActive)
                return;
            if (this.activeSources.length === 1)
                return;
            source.deactivate();
            this.state.partialNext({ sources: [...this.sources] });
        };
        this.activate = () => {
            if (!this.activeSources.length) {
                const sourcesToActivate = this.config.keepSingleActiveSource ? this.sources.slice(0, 1) : this.sources;
                sourcesToActivate.forEach((s) => s.activate());
            }
            if (this.isActive)
                return;
            this.state.partialNext({ isActive: true });
        };
        this.search = async (searchQuery) => {
            const searchedSources = this.activeSources;
            this.state.partialNext({
                searchQuery,
            });
            await Promise.all(searchedSources.map((source) => source.search(searchQuery)));
        };
        this.cancelSearchQueries = () => {
            this.activeSources.forEach((s) => s.searchDebounced.cancel());
        };
        this.clear = () => {
            this.cancelSearchQueries();
            this.sources.forEach((source) => source.state.next({ ...source.initialState, isActive: source.isActive }));
            this.state.next((current) => ({
                ...current,
                isActive: true,
                queriesInProgress: [],
                searchQuery: '',
            }));
        };
        this.exit = () => {
            this.cancelSearchQueries();
            this.sources.forEach((source) => source.state.next({ ...source.initialState, isActive: source.isActive }));
            this.state.next((current) => ({
                ...current,
                isActive: false,
                queriesInProgress: [],
                searchQuery: '',
            }));
        };
        this.state = new store_1.StateStore({
            isActive: false,
            searchQuery: '',
            sources: sources ?? [],
        });
        this._internalState = new store_1.StateStore({});
        this.config = { keepSingleActiveSource: true, ...config };
    }
    get hasNext() {
        return this.sources.some((source) => source.hasNext);
    }
    get sources() {
        return this.state.getLatestValue().sources;
    }
    get activeSources() {
        return this.state.getLatestValue().sources.filter((s) => s.isActive);
    }
    get isActive() {
        return this.state.getLatestValue().isActive;
    }
    get searchQuery() {
        return this.state.getLatestValue().searchQuery;
    }
    get searchSourceTypes() {
        return this.sources.map((s) => s.type);
    }
}
exports.SearchController = SearchController;
