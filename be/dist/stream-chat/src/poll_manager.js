"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollManager = void 0;
const poll_1 = require("./poll");
const utils_1 = require("./utils");
class PollManager {
    constructor({ client }) {
        // The pollCache contains only polls that have been created and sent as messages
        // (i.e only polls that are coupled with a message, can be voted on and require a
        // reactive state). It shall work as a basic look-up table for our SDK to be able
        // to quickly consume poll state that will be reactive even without the polls being
        // rendered within the UI.
        this.pollCache = new Map();
        this.unsubscribeFunctions = new Set();
        this.fromState = (id) => {
            return this.pollCache.get(id);
        };
        this.registerSubscriptions = () => {
            if (this.unsubscribeFunctions.size) {
                // Already listening for events and changes
                return;
            }
            this.unsubscribeFunctions.add(this.subscribeMessageNew());
            this.unsubscribeFunctions.add(this.subscribePollUpdated());
            this.unsubscribeFunctions.add(this.subscribePollClosed());
            this.unsubscribeFunctions.add(this.subscribeVoteCasted());
            this.unsubscribeFunctions.add(this.subscribeVoteChanged());
            this.unsubscribeFunctions.add(this.subscribeVoteRemoved());
        };
        this.unregisterSubscriptions = () => {
            this.unsubscribeFunctions.forEach((cleanupFunction) => cleanupFunction());
            this.unsubscribeFunctions.clear();
        };
        this.createPoll = async (poll) => {
            const { poll: createdPoll } = await this.client.createPoll(poll);
            return new poll_1.Poll({ client: this.client, poll: createdPoll });
        };
        this.getPoll = async (id) => {
            const cachedPoll = this.fromState(id);
            // optimistically return the cached poll if it exists and update in the background
            if (cachedPoll) {
                this.client.getPoll(id).then(({ poll }) => this.setOrOverwriteInCache(poll, true));
                return cachedPoll;
            }
            // fetch it, write to the cache and return otherwise
            const { poll } = await this.client.getPoll(id);
            this.setOrOverwriteInCache(poll);
            return this.fromState(id);
        };
        this.queryPolls = async (filter, sort = [], options = {}) => {
            const { polls, next } = await this.client.queryPolls(filter, sort, options);
            const pollInstances = polls.map((poll) => {
                this.setOrOverwriteInCache(poll, true);
                return this.fromState(poll.id);
            });
            return {
                polls: pollInstances,
                next,
            };
        };
        this.hydratePollCache = (messages, overwriteState) => {
            for (const message of messages) {
                if (!message.poll) {
                    continue;
                }
                const pollResponse = message.poll;
                this.setOrOverwriteInCache(pollResponse, overwriteState);
            }
        };
        this.setOrOverwriteInCache = (pollResponse, overwriteState) => {
            if (!this.client._cacheEnabled()) {
                return;
            }
            const pollFromCache = this.fromState(pollResponse.id);
            if (!pollFromCache) {
                const poll = new poll_1.Poll({ client: this.client, poll: pollResponse });
                this.pollCache.set(poll.id, poll);
            }
            else if (overwriteState) {
                pollFromCache.reinitializeState(pollResponse);
            }
        };
        this.subscribePollUpdated = () => {
            return this.client.on('poll.updated', (event) => {
                if (event.poll?.id) {
                    this.fromState(event.poll.id)?.handlePollUpdated(event);
                }
            }).unsubscribe;
        };
        this.subscribePollClosed = () => {
            return this.client.on('poll.closed', (event) => {
                if (event.poll?.id) {
                    this.fromState(event.poll.id)?.handlePollClosed(event);
                }
            }).unsubscribe;
        };
        this.subscribeVoteCasted = () => {
            return this.client.on('poll.vote_casted', (event) => {
                if (event.poll?.id) {
                    this.fromState(event.poll.id)?.handleVoteCasted(event);
                }
            }).unsubscribe;
        };
        this.subscribeVoteChanged = () => {
            return this.client.on('poll.vote_changed', (event) => {
                if (event.poll?.id) {
                    this.fromState(event.poll.id)?.handleVoteChanged(event);
                }
            }).unsubscribe;
        };
        this.subscribeVoteRemoved = () => {
            return this.client.on('poll.vote_removed', (event) => {
                if (event.poll?.id) {
                    this.fromState(event.poll.id)?.handleVoteRemoved(event);
                }
            }).unsubscribe;
        };
        this.subscribeMessageNew = () => {
            return this.client.on('message.new', (event) => {
                const { message } = event;
                if (message) {
                    const formattedMessage = (0, utils_1.formatMessage)(message);
                    this.hydratePollCache([formattedMessage]);
                }
            }).unsubscribe;
        };
        this.client = client;
    }
    get data() {
        return this.pollCache;
    }
}
exports.PollManager = PollManager;
