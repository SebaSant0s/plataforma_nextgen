import { StateStore } from './store';
import type { StreamChat } from './client';
import type { DefaultGenerics, Event, ExtendableGenerics, PartialPollUpdate, PollAnswer, PollData, PollEnrichData, PollOptionData, PollResponse, PollVote, QueryVotesFilters, QueryVotesOptions, VoteSort } from './types';
export declare const isVoteAnswer: <SCG extends ExtendableGenerics = DefaultGenerics>(vote: PollVote<SCG> | PollAnswer<SCG>) => vote is PollAnswer<SCG>;
export type PollAnswersQueryParams = {
    filter?: QueryVotesFilters;
    options?: QueryVotesOptions;
    sort?: VoteSort;
};
export type PollOptionVotesQueryParams = {
    filter: {
        option_id: string;
    } & QueryVotesFilters;
    options?: QueryVotesOptions;
    sort?: VoteSort;
};
type OptionId = string;
export type PollState<SCG extends ExtendableGenerics = DefaultGenerics> = SCG['pollType'] & Omit<PollResponse<SCG>, 'own_votes' | 'id'> & {
    lastActivityAt: Date;
    maxVotedOptionIds: OptionId[];
    ownVotesByOptionId: Record<OptionId, PollVote<SCG>>;
    ownAnswer?: PollAnswer;
};
type PollInitOptions<SCG extends ExtendableGenerics = DefaultGenerics> = {
    client: StreamChat<SCG>;
    poll: PollResponse<SCG>;
};
export declare class Poll<SCG extends ExtendableGenerics = DefaultGenerics> {
    readonly state: StateStore<PollState<SCG>>;
    id: string;
    private client;
    private unsubscribeFunctions;
    constructor({ client, poll }: PollInitOptions<SCG>);
    private getInitialStateFromPollResponse;
    reinitializeState: (poll: PollInitOptions<SCG>["poll"]) => void;
    get data(): PollState<SCG>;
    handlePollUpdated: (event: Event<SCG>) => void;
    handlePollClosed: (event: Event<SCG>) => void;
    handleVoteCasted: (event: Event<SCG>) => void;
    handleVoteChanged: (event: Event<SCG>) => void;
    handleVoteRemoved: (event: Event<SCG>) => void;
    query: (id: string) => Promise<PollResponse<SCG>>;
    update: (data: Exclude<PollData<SCG>, "id">) => Promise<import("./types").APIResponse & import("./types").UpdatePollAPIResponse<SCG>>;
    partialUpdate: (partialPollObject: PartialPollUpdate<SCG>) => Promise<import("./types").APIResponse & import("./types").UpdatePollAPIResponse<SCG>>;
    close: () => Promise<import("./types").APIResponse & import("./types").UpdatePollAPIResponse<SCG>>;
    delete: () => Promise<import("./types").APIResponse>;
    createOption: (option: PollOptionData) => Promise<import("./types").APIResponse & import("./types").CreatePollOptionAPIResponse<SCG>>;
    updateOption: (option: PollOptionData) => Promise<import("./types").APIResponse & import("./types").UpdatePollOptionAPIResponse<SCG>>;
    deleteOption: (optionId: string) => Promise<import("./types").APIResponse>;
    castVote: (optionId: string, messageId: string) => Promise<import("./types").APIResponse & import("./types").CastVoteAPIResponse<SCG>>;
    removeVote: (voteId: string, messageId: string) => Promise<import("./types").APIResponse & {
        vote: PollVote;
    }>;
    addAnswer: (answerText: string, messageId: string) => Promise<import("./types").APIResponse & import("./types").CastVoteAPIResponse<SCG>>;
    removeAnswer: (answerId: string, messageId: string) => Promise<import("./types").APIResponse & {
        vote: PollVote;
    }>;
    queryAnswers: (params: PollAnswersQueryParams) => Promise<import("./types").APIResponse & import("./types").PollAnswersAPIResponse<SCG>>;
    queryOptionVotes: (params: PollOptionVotesQueryParams) => Promise<import("./types").APIResponse & import("./types").PollVotesAPIResponse<SCG>>;
}
export declare function extractPollData<SCG extends ExtendableGenerics = DefaultGenerics>(pollResponse: PollResponse<SCG>): PollData<SCG>;
export declare function extractPollEnrichedData<SCG extends ExtendableGenerics = DefaultGenerics>(pollResponse: PollResponse<SCG>): Omit<PollEnrichData<SCG>, 'own_votes' | 'latest_answers'>;
export {};
//# sourceMappingURL=poll.d.ts.map