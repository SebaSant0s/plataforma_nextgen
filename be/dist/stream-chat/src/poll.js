"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poll = exports.isVoteAnswer = void 0;
exports.extractPollData = extractPollData;
exports.extractPollEnrichedData = extractPollEnrichedData;
const store_1 = require("./store");
const isPollUpdatedEvent = (e) => e.type === 'poll.updated';
const isPollClosedEventEvent = (e) => e.type === 'poll.closed';
const isPollVoteCastedEvent = (e) => e.type === 'poll.vote_casted';
const isPollVoteChangedEvent = (e) => e.type === 'poll.vote_changed';
const isPollVoteRemovedEvent = (e) => e.type === 'poll.vote_removed';
const isVoteAnswer = (vote) => !!vote?.answer_text;
exports.isVoteAnswer = isVoteAnswer;
class Poll {
    constructor({ client, poll }) {
        this.unsubscribeFunctions = new Set();
        this.getInitialStateFromPollResponse = (poll) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { own_votes, id, ...pollResponseForState } = poll;
            const { ownAnswer, ownVotes } = own_votes?.reduce((acc, voteOrAnswer) => {
                if ((0, exports.isVoteAnswer)(voteOrAnswer)) {
                    acc.ownAnswer = voteOrAnswer;
                }
                else {
                    acc.ownVotes.push(voteOrAnswer);
                }
                return acc;
            }, { ownVotes: [] }) ?? { ownVotes: [] };
            return {
                ...pollResponseForState,
                lastActivityAt: new Date(),
                maxVotedOptionIds: getMaxVotedOptionIds(pollResponseForState.vote_counts_by_option),
                ownAnswer,
                ownVotesByOptionId: getOwnVotesByOptionId(ownVotes),
            };
        };
        this.reinitializeState = (poll) => {
            this.state.partialNext(this.getInitialStateFromPollResponse(poll));
        };
        this.handlePollUpdated = (event) => {
            if (event.poll?.id && event.poll.id !== this.id)
                return;
            if (!isPollUpdatedEvent(event))
                return;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...pollData } = extractPollData(event.poll);
            // @ts-ignore
            this.state.partialNext({ ...pollData, lastActivityAt: new Date(event.created_at) });
        };
        this.handlePollClosed = (event) => {
            if (event.poll?.id && event.poll.id !== this.id)
                return;
            if (!isPollClosedEventEvent(event))
                return;
            // @ts-ignore
            this.state.partialNext({ is_closed: true, lastActivityAt: new Date(event.created_at) });
        };
        this.handleVoteCasted = (event) => {
            if (event.poll?.id && event.poll.id !== this.id)
                return;
            if (!isPollVoteCastedEvent(event))
                return;
            const currentState = this.data;
            const isOwnVote = event.poll_vote.user_id === this.client.userID;
            let latestAnswers = [...currentState.latest_answers];
            let ownAnswer = currentState.ownAnswer;
            const ownVotesByOptionId = currentState.ownVotesByOptionId;
            let maxVotedOptionIds = currentState.maxVotedOptionIds;
            if (isOwnVote) {
                if ((0, exports.isVoteAnswer)(event.poll_vote)) {
                    ownAnswer = event.poll_vote;
                }
                else if (event.poll_vote.option_id) {
                    ownVotesByOptionId[event.poll_vote.option_id] = event.poll_vote;
                }
            }
            if ((0, exports.isVoteAnswer)(event.poll_vote)) {
                latestAnswers = [event.poll_vote, ...latestAnswers];
            }
            else {
                maxVotedOptionIds = getMaxVotedOptionIds(event.poll.vote_counts_by_option);
            }
            const pollEnrichData = extractPollEnrichedData(event.poll);
            // @ts-ignore
            this.state.partialNext({
                ...pollEnrichData,
                latest_answers: latestAnswers,
                lastActivityAt: new Date(event.created_at),
                ownAnswer,
                ownVotesByOptionId,
                maxVotedOptionIds,
            });
        };
        this.handleVoteChanged = (event) => {
            // this event is triggered only when event.poll.enforce_unique_vote === true
            if (event.poll?.id && event.poll.id !== this.id)
                return;
            if (!isPollVoteChangedEvent(event))
                return;
            const currentState = this.data;
            const isOwnVote = event.poll_vote.user_id === this.client.userID;
            let latestAnswers = [...currentState.latest_answers];
            let ownAnswer = currentState.ownAnswer;
            let ownVotesByOptionId = currentState.ownVotesByOptionId;
            let maxVotedOptionIds = currentState.maxVotedOptionIds;
            if (isOwnVote) {
                if ((0, exports.isVoteAnswer)(event.poll_vote)) {
                    latestAnswers = [event.poll_vote, ...latestAnswers.filter((answer) => answer.id !== event.poll_vote.id)];
                    ownAnswer = event.poll_vote;
                }
                else if (event.poll_vote.option_id) {
                    if (event.poll.enforce_unique_votes) {
                        ownVotesByOptionId = { [event.poll_vote.option_id]: event.poll_vote };
                    }
                    else {
                        ownVotesByOptionId = Object.entries(ownVotesByOptionId).reduce((acc, [optionId, vote]) => {
                            if (optionId !== event.poll_vote.option_id && vote.id === event.poll_vote.id) {
                                return acc;
                            }
                            acc[optionId] = vote;
                            return acc;
                        }, {});
                        ownVotesByOptionId[event.poll_vote.option_id] = event.poll_vote;
                    }
                    if (ownAnswer?.id === event.poll_vote.id) {
                        ownAnswer = undefined;
                    }
                    maxVotedOptionIds = getMaxVotedOptionIds(event.poll.vote_counts_by_option);
                }
            }
            else if ((0, exports.isVoteAnswer)(event.poll_vote)) {
                latestAnswers = [event.poll_vote, ...latestAnswers];
            }
            else {
                maxVotedOptionIds = getMaxVotedOptionIds(event.poll.vote_counts_by_option);
            }
            const pollEnrichData = extractPollEnrichedData(event.poll);
            // @ts-ignore
            this.state.partialNext({
                ...pollEnrichData,
                latest_answers: latestAnswers,
                lastActivityAt: new Date(event.created_at),
                ownAnswer,
                ownVotesByOptionId,
                maxVotedOptionIds,
            });
        };
        this.handleVoteRemoved = (event) => {
            if (event.poll?.id && event.poll.id !== this.id)
                return;
            if (!isPollVoteRemovedEvent(event))
                return;
            const currentState = this.data;
            const isOwnVote = event.poll_vote.user_id === this.client.userID;
            let latestAnswers = [...currentState.latest_answers];
            let ownAnswer = currentState.ownAnswer;
            const ownVotesByOptionId = { ...currentState.ownVotesByOptionId };
            let maxVotedOptionIds = currentState.maxVotedOptionIds;
            if ((0, exports.isVoteAnswer)(event.poll_vote)) {
                latestAnswers = latestAnswers.filter((answer) => answer.id !== event.poll_vote.id);
                if (isOwnVote) {
                    ownAnswer = undefined;
                }
            }
            else {
                maxVotedOptionIds = getMaxVotedOptionIds(event.poll.vote_counts_by_option);
                if (isOwnVote && event.poll_vote.option_id) {
                    delete ownVotesByOptionId[event.poll_vote.option_id];
                }
            }
            const pollEnrichData = extractPollEnrichedData(event.poll);
            // @ts-ignore
            this.state.partialNext({
                ...pollEnrichData,
                latest_answers: latestAnswers,
                lastActivityAt: new Date(event.created_at),
                ownAnswer,
                ownVotesByOptionId,
                maxVotedOptionIds,
            });
        };
        this.query = async (id) => {
            const { poll } = await this.client.getPoll(id);
            // @ts-ignore
            this.state.partialNext({ ...poll, lastActivityAt: new Date() });
            return poll;
        };
        this.update = async (data) => {
            return await this.client.updatePoll({ ...data, id: this.id });
        };
        this.partialUpdate = async (partialPollObject) => {
            return await this.client.partialUpdatePoll(this.id, partialPollObject);
        };
        this.close = async () => {
            return await this.client.closePoll(this.id);
        };
        this.delete = async () => {
            return await this.client.deletePoll(this.id);
        };
        this.createOption = async (option) => {
            return await this.client.createPollOption(this.id, option);
        };
        this.updateOption = async (option) => {
            return await this.client.updatePollOption(this.id, option);
        };
        this.deleteOption = async (optionId) => {
            return await this.client.deletePollOption(this.id, optionId);
        };
        this.castVote = async (optionId, messageId) => {
            const { max_votes_allowed, ownVotesByOptionId } = this.data;
            const reachedVoteLimit = max_votes_allowed && max_votes_allowed === Object.keys(ownVotesByOptionId).length;
            if (reachedVoteLimit) {
                let oldestVote = Object.values(ownVotesByOptionId)[0];
                Object.values(ownVotesByOptionId)
                    .slice(1)
                    .forEach((vote) => {
                    if (!oldestVote?.created_at || new Date(vote.created_at) < new Date(oldestVote.created_at)) {
                        oldestVote = vote;
                    }
                });
                if (oldestVote?.id) {
                    await this.removeVote(oldestVote.id, messageId);
                }
            }
            return await this.client.castPollVote(messageId, this.id, { option_id: optionId });
        };
        this.removeVote = async (voteId, messageId) => {
            return await this.client.removePollVote(messageId, this.id, voteId);
        };
        this.addAnswer = async (answerText, messageId) => {
            return await this.client.addPollAnswer(messageId, this.id, answerText);
        };
        this.removeAnswer = async (answerId, messageId) => {
            return await this.client.removePollVote(messageId, this.id, answerId);
        };
        this.queryAnswers = async (params) => {
            return await this.client.queryPollAnswers(this.id, params.filter, params.sort, params.options);
        };
        this.queryOptionVotes = async (params) => {
            return await this.client.queryPollVotes(this.id, params.filter, params.sort, params.options);
        };
        this.client = client;
        this.id = poll.id;
        this.state = new store_1.StateStore(this.getInitialStateFromPollResponse(poll));
    }
    get data() {
        return this.state.getLatestValue();
    }
}
exports.Poll = Poll;
function getMaxVotedOptionIds(voteCountsByOption) {
    let maxVotes = 0;
    let winningOptions = [];
    for (const [id, count] of Object.entries(voteCountsByOption ?? {})) {
        if (count > maxVotes) {
            winningOptions = [id];
            maxVotes = count;
        }
        else if (count === maxVotes) {
            winningOptions.push(id);
        }
    }
    return winningOptions;
}
function getOwnVotesByOptionId(ownVotes) {
    return !ownVotes
        ? {}
        : ownVotes.reduce((acc, vote) => {
            if ((0, exports.isVoteAnswer)(vote) || !vote.option_id)
                return acc;
            acc[vote.option_id] = vote;
            return acc;
        }, {});
}
function extractPollData(pollResponse) {
    return {
        allow_answers: pollResponse.allow_answers,
        allow_user_suggested_options: pollResponse.allow_user_suggested_options,
        description: pollResponse.description,
        enforce_unique_vote: pollResponse.enforce_unique_vote,
        id: pollResponse.id,
        is_closed: pollResponse.is_closed,
        max_votes_allowed: pollResponse.max_votes_allowed,
        name: pollResponse.name,
        options: pollResponse.options,
        voting_visibility: pollResponse.voting_visibility,
    };
}
function extractPollEnrichedData(pollResponse) {
    return {
        answers_count: pollResponse.answers_count,
        latest_votes_by_option: pollResponse.latest_votes_by_option,
        vote_count: pollResponse.vote_count,
        vote_counts_by_option: pollResponse.vote_counts_by_option,
    };
}
