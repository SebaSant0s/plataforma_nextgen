import { StateStore } from './store';
import type { StreamChat } from './client';
import type { Thread } from './thread';
import type { DefaultGenerics, ExtendableGenerics, QueryThreadsOptions } from './types';
export declare const THREAD_MANAGER_INITIAL_STATE: {
    active: boolean;
    isThreadOrderStale: boolean;
    threads: never[];
    unreadThreadCount: number;
    unseenThreadIds: never[];
    lastConnectionDropAt: null;
    pagination: {
        isLoading: boolean;
        isLoadingNext: boolean;
        nextCursor: null;
    };
    ready: boolean;
};
export type ThreadManagerState<SCG extends ExtendableGenerics = DefaultGenerics> = {
    active: boolean;
    isThreadOrderStale: boolean;
    lastConnectionDropAt: Date | null;
    pagination: ThreadManagerPagination;
    ready: boolean;
    threads: Thread<SCG>[];
    unreadThreadCount: number;
    /**
     * List of threads that haven't been loaded in the list, but have received new messages
     * since the latest reload. Useful to display a banner prompting to reload the thread list.
     */
    unseenThreadIds: string[];
};
export type ThreadManagerPagination = {
    isLoading: boolean;
    isLoadingNext: boolean;
    nextCursor: string | null;
};
export declare class ThreadManager<SCG extends ExtendableGenerics = DefaultGenerics> {
    readonly state: StateStore<ThreadManagerState<SCG>>;
    private client;
    private unsubscribeFunctions;
    private threadsByIdGetterCache;
    constructor({ client }: {
        client: StreamChat<SCG>;
    });
    get threadsById(): Record<string, Thread<SCG> | undefined>;
    resetState: () => void;
    activate: () => void;
    deactivate: () => void;
    registerSubscriptions: () => void;
    private subscribeUnreadThreadsCountChange;
    private subscribeChannelDeleted;
    private subscribeManageThreadSubscriptions;
    private subscribeReloadOnActivation;
    private subscribeNewReplies;
    private subscribeRecoverAfterConnectionDrop;
    unregisterSubscriptions: () => void;
    reload: ({ force }?: {
        force?: boolean | undefined;
    }) => Promise<void>;
    queryThreads: (options?: QueryThreadsOptions) => Promise<{
        threads: Thread<SCG>[];
        next: string | undefined;
    }>;
    loadNextPage: (options?: Omit<QueryThreadsOptions, "next">) => Promise<void>;
}
//# sourceMappingURL=thread_manager.d.ts.map