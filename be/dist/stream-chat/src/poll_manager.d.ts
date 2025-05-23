import type { StreamChat } from './client';
import type { CreatePollData, DefaultGenerics, ExtendableGenerics, MessageResponse, PollSort, QueryPollsFilters, QueryPollsOptions } from './types';
import { Poll } from './poll';
import { FormatMessageResponse } from './types';
export declare class PollManager<SCG extends ExtendableGenerics = DefaultGenerics> {
    private client;
    private pollCache;
    private unsubscribeFunctions;
    constructor({ client }: {
        client: StreamChat<SCG>;
    });
    get data(): Map<string, Poll<SCG>>;
    fromState: (id: string) => Poll<SCG> | undefined;
    registerSubscriptions: () => void;
    unregisterSubscriptions: () => void;
    createPoll: (poll: CreatePollData<SCG>) => Promise<Poll<SCG>>;
    getPoll: (id: string) => Promise<Poll<SCG> | undefined>;
    queryPolls: (filter: QueryPollsFilters, sort?: PollSort, options?: QueryPollsOptions) => Promise<{
        polls: (Poll<SCG> | undefined)[];
        next: string | undefined;
    }>;
    hydratePollCache: (messages: FormatMessageResponse<SCG>[] | MessageResponse<SCG>[], overwriteState?: boolean) => void;
    private setOrOverwriteInCache;
    private subscribePollUpdated;
    private subscribePollClosed;
    private subscribeVoteCasted;
    private subscribeVoteChanged;
    private subscribeVoteRemoved;
    private subscribeMessageNew;
}
//# sourceMappingURL=poll_manager.d.ts.map