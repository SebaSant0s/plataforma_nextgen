"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadManager = exports.THREAD_MANAGER_INITIAL_STATE = void 0;
const store_1 = require("./store");
const utils_1 = require("./utils");
const DEFAULT_CONNECTION_RECOVERY_THROTTLE_DURATION = 1000;
const MAX_QUERY_THREADS_LIMIT = 25;
exports.THREAD_MANAGER_INITIAL_STATE = {
    active: false,
    isThreadOrderStale: false,
    threads: [],
    unreadThreadCount: 0,
    unseenThreadIds: [],
    lastConnectionDropAt: null,
    pagination: {
        isLoading: false,
        isLoadingNext: false,
        nextCursor: null,
    },
    ready: false,
};
class ThreadManager {
    constructor({ client }) {
        this.unsubscribeFunctions = new Set();
        this.resetState = () => {
            this.state.next(exports.THREAD_MANAGER_INITIAL_STATE);
        };
        this.activate = () => {
            this.state.partialNext({ active: true });
        };
        this.deactivate = () => {
            this.state.partialNext({ active: false });
        };
        this.registerSubscriptions = () => {
            if (this.unsubscribeFunctions.size)
                return;
            this.unsubscribeFunctions.add(this.subscribeUnreadThreadsCountChange());
            this.unsubscribeFunctions.add(this.subscribeManageThreadSubscriptions());
            this.unsubscribeFunctions.add(this.subscribeReloadOnActivation());
            this.unsubscribeFunctions.add(this.subscribeNewReplies());
            this.unsubscribeFunctions.add(this.subscribeRecoverAfterConnectionDrop());
            this.unsubscribeFunctions.add(this.subscribeChannelDeleted());
        };
        this.subscribeUnreadThreadsCountChange = () => {
            // initiate
            const { unread_threads: unreadThreadCount = 0 } = this.client.user ?? {};
            this.state.partialNext({ unreadThreadCount });
            const unsubscribeFunctions = [
                'health.check',
                'notification.mark_read',
                'notification.thread_message_new',
                'notification.channel_deleted',
            ].map((eventType) => this.client.on(eventType, (event) => {
                const { unread_threads: unreadThreadCount } = event.me ?? event;
                if (typeof unreadThreadCount === 'number') {
                    this.state.partialNext({ unreadThreadCount });
                }
            }).unsubscribe);
            return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
        };
        this.subscribeChannelDeleted = () => this.client.on('notification.channel_deleted', (event) => {
            const { cid } = event;
            const { threads } = this.state.getLatestValue();
            const newThreads = threads.filter((thread) => thread.channel.cid !== cid);
            this.state.partialNext({ threads: newThreads });
        }).unsubscribe;
        this.subscribeManageThreadSubscriptions = () => this.state.subscribeWithSelector((nextValue) => ({ threads: nextValue.threads }), ({ threads: nextThreads }, prev) => {
            const { threads: prevThreads = [] } = prev ?? {};
            // Thread instance was removed if there's no thread with the given id at all,
            // or it was replaced with a new instance
            const removedThreads = prevThreads.filter((thread) => thread !== this.threadsById[thread.id]);
            nextThreads.forEach((thread) => thread.registerSubscriptions());
            removedThreads.forEach((thread) => thread.unregisterSubscriptions());
        });
        this.subscribeReloadOnActivation = () => this.state.subscribeWithSelector((nextValue) => ({ active: nextValue.active }), ({ active }) => {
            if (active)
                this.reload();
        });
        this.subscribeNewReplies = () => this.client.on('notification.thread_message_new', (event) => {
            const parentId = event.message?.parent_id;
            if (!parentId)
                return;
            const { unseenThreadIds, ready } = this.state.getLatestValue();
            if (!ready)
                return;
            if (this.threadsById[parentId]) {
                this.state.partialNext({ isThreadOrderStale: true });
            }
            else if (!unseenThreadIds.includes(parentId)) {
                this.state.partialNext({ unseenThreadIds: unseenThreadIds.concat(parentId) });
            }
        }).unsubscribe;
        this.subscribeRecoverAfterConnectionDrop = () => {
            const unsubscribeConnectionDropped = this.client.on('connection.changed', (event) => {
                if (event.online === false) {
                    this.state.next((current) => current.lastConnectionDropAt
                        ? current
                        : {
                            ...current,
                            lastConnectionDropAt: new Date(),
                        });
                }
            }).unsubscribe;
            const throttledHandleConnectionRecovered = (0, utils_1.throttle)(() => {
                const { lastConnectionDropAt } = this.state.getLatestValue();
                if (!lastConnectionDropAt)
                    return;
                this.reload({ force: true });
            }, DEFAULT_CONNECTION_RECOVERY_THROTTLE_DURATION, { trailing: true });
            const unsubscribeConnectionRecovered = this.client.on('connection.recovered', throttledHandleConnectionRecovered)
                .unsubscribe;
            return () => {
                unsubscribeConnectionDropped();
                unsubscribeConnectionRecovered();
            };
        };
        this.unregisterSubscriptions = () => {
            this.state.getLatestValue().threads.forEach((thread) => thread.unregisterSubscriptions());
            this.unsubscribeFunctions.forEach((cleanupFunction) => cleanupFunction());
            this.unsubscribeFunctions.clear();
        };
        this.reload = async ({ force = false } = {}) => {
            const { threads, unseenThreadIds, isThreadOrderStale, pagination, ready } = this.state.getLatestValue();
            if (pagination.isLoading)
                return;
            if (!force && ready && !unseenThreadIds.length && !isThreadOrderStale)
                return;
            const limit = threads.length + unseenThreadIds.length;
            try {
                this.state.next((current) => ({
                    ...current,
                    pagination: {
                        ...current.pagination,
                        isLoading: true,
                    },
                }));
                const response = await this.queryThreads({
                    limit: Math.min(limit, MAX_QUERY_THREADS_LIMIT) || MAX_QUERY_THREADS_LIMIT,
                });
                const currentThreads = this.threadsById;
                const nextThreads = [];
                for (const incomingThread of response.threads) {
                    const existingThread = currentThreads[incomingThread.id];
                    if (existingThread) {
                        // Reuse thread instances if possible
                        nextThreads.push(existingThread);
                        if (existingThread.hasStaleState) {
                            existingThread.hydrateState(incomingThread);
                        }
                    }
                    else {
                        nextThreads.push(incomingThread);
                    }
                }
                this.state.next((current) => ({
                    ...current,
                    threads: nextThreads,
                    unseenThreadIds: [],
                    isThreadOrderStale: false,
                    pagination: {
                        ...current.pagination,
                        isLoading: false,
                        nextCursor: response.next ?? null,
                    },
                    ready: true,
                }));
            }
            catch (error) {
                this.client.logger('error', error.message);
                this.state.next((current) => ({
                    ...current,
                    pagination: {
                        ...current.pagination,
                        isLoading: false,
                    },
                }));
            }
        };
        this.queryThreads = (options = {}) => {
            return this.client.queryThreads({
                limit: 25,
                participant_limit: 10,
                reply_limit: 10,
                watch: true,
                ...options,
            });
        };
        this.loadNextPage = async (options = {}) => {
            const { pagination } = this.state.getLatestValue();
            if (pagination.isLoadingNext || !pagination.nextCursor)
                return;
            try {
                this.state.partialNext({ pagination: { ...pagination, isLoadingNext: true } });
                const response = await this.queryThreads({
                    ...options,
                    next: pagination.nextCursor,
                });
                this.state.next((current) => ({
                    ...current,
                    threads: response.threads.length ? current.threads.concat(response.threads) : current.threads,
                    pagination: {
                        ...current.pagination,
                        nextCursor: response.next ?? null,
                        isLoadingNext: false,
                    },
                }));
            }
            catch (error) {
                this.client.logger('error', error.message);
                this.state.next((current) => ({
                    ...current,
                    pagination: {
                        ...current.pagination,
                        isLoadingNext: false,
                    },
                }));
            }
        };
        this.client = client;
        this.state = new store_1.StateStore(exports.THREAD_MANAGER_INITIAL_STATE);
        this.threadsByIdGetterCache = { threads: [], threadsById: {} };
    }
    get threadsById() {
        const { threads } = this.state.getLatestValue();
        if (threads === this.threadsByIdGetterCache.threads) {
            return this.threadsByIdGetterCache.threadsById;
        }
        const threadsById = threads.reduce((newThreadsById, thread) => {
            newThreadsById[thread.id] = thread;
            return newThreadsById;
        }, {});
        this.threadsByIdGetterCache.threads = threads;
        this.threadsByIdGetterCache.threadsById = threadsById;
        return threadsById;
    }
}
exports.ThreadManager = ThreadManager;
