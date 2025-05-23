import type { Channel } from './channel';
import type { StreamChat } from './client';
import { StateStore } from './store';
import type { AscDesc, DefaultGenerics, ExtendableGenerics, FormatMessageResponse, MessagePaginationOptions, MessageResponse, ThreadResponse, ThreadResponseCustomData, UserResponse } from './types';
type QueryRepliesOptions<SCG extends ExtendableGenerics> = {
    sort?: {
        created_at: AscDesc;
    }[];
} & MessagePaginationOptions & {
    user?: UserResponse<SCG>;
    user_id?: string;
};
export type ThreadState<SCG extends ExtendableGenerics = DefaultGenerics> = {
    /**
     * Determines if the thread is currently opened and on-screen. When the thread is active,
     * all new messages are immediately marked as read.
     */
    active: boolean;
    channel: Channel<SCG>;
    createdAt: Date;
    custom: ThreadResponseCustomData;
    deletedAt: Date | null;
    isLoading: boolean;
    isStateStale: boolean;
    pagination: ThreadRepliesPagination;
    /**
     * Thread is identified by and has a one-to-one relation with its parent message.
     * We use parent message id as a thread id.
     */
    parentMessage: FormatMessageResponse<SCG>;
    participants: ThreadResponse<SCG>['thread_participants'];
    read: ThreadReadState;
    replies: Array<FormatMessageResponse<SCG>>;
    replyCount: number;
    title: string;
    updatedAt: Date | null;
};
export type ThreadRepliesPagination = {
    isLoadingNext: boolean;
    isLoadingPrev: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
};
export type ThreadUserReadState<SCG extends ExtendableGenerics = DefaultGenerics> = {
    lastReadAt: Date;
    unreadMessageCount: number;
    user: UserResponse<SCG>;
    lastReadMessageId?: string;
};
export type ThreadReadState<SCG extends ExtendableGenerics = DefaultGenerics> = Record<string, ThreadUserReadState<SCG> | undefined>;
export declare const THREAD_RESPONSE_RESERVED_KEYS: Record<keyof ThreadResponse, true>;
export declare class Thread<SCG extends ExtendableGenerics = DefaultGenerics> {
    readonly state: StateStore<ThreadState<SCG>>;
    readonly id: string;
    private client;
    private unsubscribeFunctions;
    private failedRepliesMap;
    constructor({ client, threadData }: {
        client: StreamChat<SCG>;
        threadData: ThreadResponse<SCG>;
    });
    get channel(): Channel<SCG>;
    get hasStaleState(): boolean;
    get ownUnreadCount(): number;
    activate: () => void;
    deactivate: () => void;
    reload: () => Promise<void>;
    hydrateState: (thread: Thread<SCG>) => void;
    registerSubscriptions: () => void;
    private subscribeThreadUpdated;
    private subscribeMarkActiveThreadRead;
    private subscribeReloadActiveStaleThread;
    private subscribeMarkThreadStale;
    private subscribeNewReplies;
    private subscribeRepliesRead;
    private subscribeMessageDeleted;
    private subscribeMessageUpdated;
    unregisterSubscriptions: () => void;
    deleteReplyLocally: ({ message }: {
        message: MessageResponse<SCG>;
    }) => void;
    upsertReplyLocally: ({ message, timestampChanged, }: {
        message: MessageResponse<SCG>;
        timestampChanged?: boolean;
    }) => void;
    updateParentMessageLocally: ({ message }: {
        message: MessageResponse<SCG>;
    }) => void;
    updateParentMessageOrReplyLocally: (message: MessageResponse<SCG>) => void;
    markAsRead: ({ force }?: {
        force?: boolean;
    }) => Promise<import("./types").EventAPIResponse<SCG> | null>;
    private throttledMarkAsRead;
    queryReplies: ({ limit, sort, ...otherOptions }?: QueryRepliesOptions<SCG>) => Promise<import("./types").GetRepliesAPIResponse<SCG>>;
    loadNextPage: ({ limit }?: {
        limit?: number;
    }) => Promise<void>;
    loadPrevPage: ({ limit }?: {
        limit?: number;
    }) => Promise<void>;
    private loadPage;
}
export {};
//# sourceMappingURL=thread.d.ts.map