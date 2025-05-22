"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const uuid_1 = require("uuid");
const generateMessage_1 = require("./test-utils/generateMessage");
const generateChannel_1 = require("./test-utils/generateChannel");
const generateMember_1 = require("./test-utils/generateMember");
const generateUser_1 = require("./test-utils/generateUser");
const getClient_1 = require("./test-utils/getClient");
const utils_1 = require("../../src/utils");
describe('addToMessageList', () => {
    const timestamp = new Date('2024-09-18T15:30:00.000Z').getTime();
    // messages with each created_at 10 seconds apart
    let messagesBefore;
    const getNewFormattedMessage = ({ timeOffset, id = (0, uuid_1.v4)() }) => (0, utils_1.formatMessage)((0, generateMessage_1.generateMsg)({
        id,
        created_at: new Date(timestamp + timeOffset),
    }));
    beforeEach(() => {
        messagesBefore = Array.from({ length: 5 }, (_, index) => (0, utils_1.formatMessage)((0, generateMessage_1.generateMsg)({ created_at: new Date(timestamp + index * 10 * 1000) })));
    });
    it('new message is inserted at the correct index', () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 25 * 1000 });
        const messagesAfter = (0, utils_1.addToMessageList)(messagesBefore, newMessage);
        (0, chai_1.expect)(messagesAfter).to.not.equal(messagesBefore);
        (0, chai_1.expect)(messagesAfter).to.have.length(6);
        (0, chai_1.expect)(messagesAfter).to.contain(newMessage);
        (0, chai_1.expect)(messagesAfter[3]).to.equal(newMessage);
    });
    it('replaces the message which created_at changed to a server response created_at', () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 33 * 1000, id: messagesBefore[2].id });
        (0, chai_1.expect)(newMessage.id).to.equal(messagesBefore[2].id);
        const messagesAfter = (0, utils_1.addToMessageList)(messagesBefore, newMessage, true);
        (0, chai_1.expect)(messagesAfter).to.not.equal(messagesBefore);
        (0, chai_1.expect)(messagesAfter).to.have.length(5);
        (0, chai_1.expect)(messagesAfter).to.contain(newMessage);
        (0, chai_1.expect)(messagesAfter[3]).to.equal(newMessage);
    });
    it('adds a new message to an empty message list', () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 0 });
        const emptyMessagesBefore = [];
        const messagesAfter = (0, utils_1.addToMessageList)(emptyMessagesBefore, newMessage);
        (0, chai_1.expect)(messagesAfter).to.have.length(1);
        (0, chai_1.expect)(messagesAfter).to.contain(newMessage);
    });
    it("doesn't add a new message to an empty message list if timestampChanged & addIfDoesNotExist are false", () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 0 });
        const emptyMessagesBefore = [];
        const messagesAfter = (0, utils_1.addToMessageList)(emptyMessagesBefore, newMessage, false, 'created_at', false);
        (0, chai_1.expect)(messagesAfter).to.have.length(0);
    });
    it("adds message to the end of the list if it's the newest one", () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 50 * 1000 });
        const messagesAfter = (0, utils_1.addToMessageList)(messagesBefore, newMessage);
        (0, chai_1.expect)(messagesAfter).to.have.length(6);
        (0, chai_1.expect)(messagesAfter).to.contain(newMessage);
        (0, chai_1.expect)(messagesAfter.at(-1)).to.equal(newMessage);
    });
    it("doesn't add a newest message to a message list if timestampChanged & addIfDoesNotExist are false", () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 50 * 1000 });
        const messagesAfter = (0, utils_1.addToMessageList)(messagesBefore, newMessage, false, 'created_at', false);
        (0, chai_1.expect)(messagesAfter).to.have.length(5);
        // FIXME: it'd be nice if the function returned old
        // unchanged array in case of no modification such as this one
        (0, chai_1.expect)(messagesAfter).to.deep.equal(messagesBefore);
    });
    it("updates an existing message that wasn't filtered due to changed timestamp (timestampChanged)", () => {
        const newMessage = getNewFormattedMessage({ timeOffset: 30 * 1000, id: messagesBefore[4].id });
        (0, chai_1.expect)(messagesBefore[4].id).to.equal(newMessage.id);
        (0, chai_1.expect)(messagesBefore[4].text).to.not.equal(newMessage.text);
        (0, chai_1.expect)(messagesBefore[4]).to.not.equal(newMessage);
        const messagesAfter = (0, utils_1.addToMessageList)(messagesBefore, newMessage, false, 'created_at', false);
        (0, chai_1.expect)(messagesAfter).to.have.length(5);
        (0, chai_1.expect)(messagesAfter[4]).to.equal(newMessage);
    });
});
describe('findIndexInSortedArray', () => {
    it('finds index in the middle of haystack (asc)', () => {
        const needle = 5;
        const haystack = [1, 2, 3, 4, 6, 7, 8, 9];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'ascending' });
        (0, chai_1.expect)(index).to.eq(4);
    });
    it('finds index at the top of haystack (asc)', () => {
        const needle = 0;
        const haystack = [1, 2, 3, 4, 6, 7, 8, 9];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'ascending' });
        (0, chai_1.expect)(index).to.eq(0);
    });
    it('finds index at the bottom of haystack (asc)', () => {
        const needle = 10;
        const haystack = [1, 2, 3, 4, 6, 7, 8, 9];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'ascending' });
        (0, chai_1.expect)(index).to.eq(8);
    });
    it('in a haystack with duplicates, prefers index closer to the bottom (asc)', () => {
        const needle = 5;
        const haystack = [1, 5, 5, 5, 5, 5, 8, 9];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'ascending' });
        (0, chai_1.expect)(index).to.eq(6);
    });
    it('in a haystack with duplicates, look up an item by key (asc)', () => {
        const haystack = [
            ['one', 1],
            ['five-1', 5],
            ['five-2', 5],
            ['five-3', 5],
            ['nine', 9],
        ];
        const selectKey = (tuple) => tuple[0];
        const selectValue = (tuple) => tuple[1];
        (0, chai_1.expect)((0, utils_1.findIndexInSortedArray)({
            needle: ['five-1', 5],
            sortedArray: haystack,
            sortDirection: 'ascending',
            selectKey,
            selectValueToCompare: selectValue,
        })).to.eq(1);
        (0, chai_1.expect)((0, utils_1.findIndexInSortedArray)({
            needle: ['five-2', 5],
            sortedArray: haystack,
            sortDirection: 'ascending',
            selectKey,
            selectValueToCompare: selectValue,
        })).to.eq(2);
        (0, chai_1.expect)((0, utils_1.findIndexInSortedArray)({
            needle: ['five-3', 5],
            sortedArray: haystack,
            sortDirection: 'ascending',
            selectKey,
            selectValueToCompare: selectValue,
        })).to.eq(3);
    });
    it('finds index in the middle of haystack (desc)', () => {
        const needle = 5;
        const haystack = [9, 8, 7, 6, 4, 3, 2, 1];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'descending' });
        (0, chai_1.expect)(index).to.eq(4);
    });
    it('finds index at the top of haystack (desc)', () => {
        const needle = 10;
        const haystack = [9, 8, 7, 6, 4, 3, 2, 1];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'descending' });
        (0, chai_1.expect)(index).to.eq(0);
    });
    it('finds index at the bottom of haystack (desc)', () => {
        const needle = 0;
        const haystack = [9, 8, 7, 6, 4, 3, 2, 1];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'descending' });
        (0, chai_1.expect)(index).to.eq(8);
    });
    it('in a haystack with duplicates, prefers index closer to the top (desc)', () => {
        const needle = 5;
        const haystack = [9, 8, 5, 5, 5, 5, 5, 1];
        const index = (0, utils_1.findIndexInSortedArray)({ needle, sortedArray: haystack, sortDirection: 'descending' });
        (0, chai_1.expect)(index).to.eq(2);
    });
    it('in a haystack with duplicates, look up an item by key (desc)', () => {
        const haystack = [
            ['nine', 9],
            ['five-1', 5],
            ['five-2', 5],
            ['five-3', 5],
            ['one', 1],
        ];
        const selectKey = (tuple) => tuple[0];
        const selectValue = (tuple) => tuple[1];
        (0, chai_1.expect)((0, utils_1.findIndexInSortedArray)({
            needle: ['five-1', 5],
            sortedArray: haystack,
            sortDirection: 'descending',
            selectKey,
            selectValueToCompare: selectValue,
        })).to.eq(1);
        (0, chai_1.expect)((0, utils_1.findIndexInSortedArray)({
            needle: ['five-2', 5],
            sortedArray: haystack,
            sortDirection: 'descending',
            selectKey,
            selectValueToCompare: selectValue,
        })).to.eq(2);
        (0, chai_1.expect)((0, utils_1.findIndexInSortedArray)({
            needle: ['five-3', 5],
            sortedArray: haystack,
            sortDirection: 'descending',
            selectKey,
            selectValueToCompare: selectValue,
        })).to.eq(3);
    });
});
describe('getAndWatchChannel', () => {
    let client;
    let sandbox;
    beforeEach(async () => {
        sandbox = sinon_1.default.createSandbox();
        client = await (0, getClient_1.getClientWithUser)();
        const mockedMembers = [(0, generateMember_1.generateMember)({ user: (0, generateUser_1.generateUser)() }), (0, generateMember_1.generateMember)({ user: (0, generateUser_1.generateUser)() })];
        const mockedChannelsQueryResponse = [
            ...Array.from({ length: 2 }, () => (0, generateChannel_1.generateChannel)()),
            (0, generateChannel_1.generateChannel)({ channel: { type: 'messaging' }, members: mockedMembers }),
        ];
        const mock = sandbox.mock(client);
        mock.expects('post').returns(Promise.resolve({ channels: mockedChannelsQueryResponse }));
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('should throw an error if neither channel nor type is provided', async () => {
        await client.queryChannels({});
        await (0, chai_1.expect)((0, utils_1.getAndWatchChannel)({ client, id: 'test-id', members: [] })).to.be.rejectedWith('Channel or channel type have to be provided to query a channel.');
    });
    it('should throw an error if neither channel ID nor members array is provided', async () => {
        await client.queryChannels({});
        await (0, chai_1.expect)((0, utils_1.getAndWatchChannel)({ client, type: 'test-type', id: undefined, members: [] })).to.be.rejectedWith('Channel ID or channel members array have to be provided to query a channel.');
    });
    it('should return an existing channel if provided', async () => {
        const channels = await client.queryChannels({});
        const channel = channels[0];
        const watchStub = sandbox.stub(channel, 'watch');
        const result = await (0, utils_1.getAndWatchChannel)({
            channel,
            client,
            members: [],
            options: {},
        });
        (0, chai_1.expect)(result).to.equal(channel);
        (0, chai_1.expect)(watchStub.calledOnce).to.be.true;
    });
    it('should return the channel if only type and id are provided', async () => {
        const channels = await client.queryChannels({});
        const channel = channels[0];
        const { id, type } = channel;
        const watchStub = sandbox.stub(channel, 'watch');
        const channelSpy = sandbox.spy(client, 'channel');
        const result = await (0, utils_1.getAndWatchChannel)({
            client,
            type,
            id,
            options: {},
        });
        (0, chai_1.expect)(channelSpy.calledOnce).to.be.true;
        // @ts-ignore
        (0, chai_1.expect)(channelSpy.calledWith(type, id)).to.be.true;
        (0, chai_1.expect)(watchStub.calledOnce).to.be.true;
        (0, chai_1.expect)(result).to.equal(channel);
    });
    it('should return the channel if only type and members are provided', async () => {
        const channels = await client.queryChannels({});
        const channel = channels[2];
        const { type } = channel;
        const members = Object.keys(channel.state.members);
        const watchStub = sandbox.stub(channel, 'watch');
        const channelSpy = sandbox.spy(client, 'channel');
        const result = await (0, utils_1.getAndWatchChannel)({
            client,
            type,
            members,
            options: {},
        });
        (0, chai_1.expect)(channelSpy.calledOnce).to.be.true;
        // @ts-ignore
        (0, chai_1.expect)(channelSpy.calledWith(type, undefined, { members })).to.be.true;
        (0, chai_1.expect)(watchStub.calledOnce).to.be.true;
        (0, chai_1.expect)(result).to.equal(channel);
    });
    it('should not call watch again if a query is already in progress', async () => {
        const channels = await client.queryChannels({});
        const channel = channels[0];
        const { id, type, cid } = channel;
        // @ts-ignore
        const watchStub = sandbox.stub(channel, 'watch').resolves({});
        const result = await Promise.all([
            (0, utils_1.getAndWatchChannel)({
                client,
                type,
                id,
                members: [],
                options: {},
            }),
            (0, utils_1.getAndWatchChannel)({
                client,
                type,
                id,
                members: [],
                options: {},
            }),
        ]);
        (0, chai_1.expect)(watchStub.calledOnce).to.be.true;
        (0, chai_1.expect)(result[0]).to.equal(channel);
        (0, chai_1.expect)(result[1]).to.equal(channel);
    });
});
describe('generateChannelTempCid', () => {
    it('should return a valid temp cid for valid input', () => {
        const result = (0, utils_1.generateChannelTempCid)('messaging', ['alice', 'bob']);
        (0, chai_1.expect)(result).to.equal('messaging:!members-alice,bob');
    });
    it('should return undefined if members is null', () => {
        const result = (0, utils_1.generateChannelTempCid)('messaging', null);
        (0, chai_1.expect)(result).to.be.undefined;
    });
    it('should return undefined if members is an empty array', () => {
        const result = (0, utils_1.generateChannelTempCid)('messaging', []);
        (0, chai_1.expect)(result).to.be.undefined;
    });
    it('should correctly format cid for multiple members', () => {
        const result = (0, utils_1.generateChannelTempCid)('team', ['zack', 'alice', 'charlie']);
        (0, chai_1.expect)(result).to.equal('team:!members-alice,charlie,zack');
    });
});
describe('Channel pinning and archiving utils', () => {
    let client;
    let sandbox;
    beforeEach(async () => {
        sandbox = sinon_1.default.createSandbox();
        client = await (0, getClient_1.getClientWithUser)();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('Channel pinning', () => {
        it('should return false if channel is null', () => {
            (0, chai_1.expect)((0, utils_1.isChannelPinned)(null)).to.be.false;
        });
        it('should return false if pinned_at is undefined', () => {
            const channelResponse = (0, generateChannel_1.generateChannel)({ membership: {} });
            client.hydrateActiveChannels([channelResponse]);
            const channel = client.channel(channelResponse.channel.type, channelResponse.channel.id);
            (0, chai_1.expect)((0, utils_1.isChannelPinned)(channel)).to.be.false;
        });
        it('should return true if pinned_at is set', () => {
            const channelResponse = (0, generateChannel_1.generateChannel)({ membership: { pinned_at: '2024-02-04T12:00:00Z' } });
            client.hydrateActiveChannels([channelResponse]);
            const channel = client.channel(channelResponse.channel.type, channelResponse.channel.id);
            (0, chai_1.expect)((0, utils_1.isChannelPinned)(channel)).to.be.true;
        });
        describe('extractSortValue', () => {
            it('should return null if sort is undefined', () => {
                (0, chai_1.expect)((0, utils_1.extractSortValue)({ atIndex: 0, targetKey: 'pinned_at', sort: undefined })).to.be.null;
            });
            it('should extract correct sort value from an array', () => {
                const sort = [{ pinned_at: -1 }, { created_at: 1 }];
                (0, chai_1.expect)((0, utils_1.extractSortValue)({ atIndex: 0, targetKey: 'pinned_at', sort })).to.equal(-1);
            });
            it('should extract correct sort value from an object', () => {
                const sort = { pinned_at: 1 };
                (0, chai_1.expect)((0, utils_1.extractSortValue)({ atIndex: 0, targetKey: 'pinned_at', sort })).to.equal(1);
            });
            it('should return null if key does not match targetKey', () => {
                const sort = { created_at: 1 };
                (0, chai_1.expect)((0, utils_1.extractSortValue)({ atIndex: 0, targetKey: 'pinned_at', sort })).to.be.null;
            });
        });
        describe('shouldConsiderPinnedChannels', () => {
            it('should return false if sort is undefined', () => {
                (0, chai_1.expect)((0, utils_1.shouldConsiderPinnedChannels)(undefined)).to.be.false;
            });
            it('should return false if pinned_at is not a number', () => {
                const sort = [{ pinned_at: 'invalid' }];
                (0, chai_1.expect)((0, utils_1.shouldConsiderPinnedChannels)(sort)).to.be.false;
            });
            it('should return false if pinned_at is not first in sort', () => {
                const sort = [{ created_at: 1 }, { pinned_at: 1 }];
                (0, chai_1.expect)((0, utils_1.shouldConsiderPinnedChannels)(sort)).to.be.false;
            });
            it('should return true if pinned_at is 1 or -1 at index 0', () => {
                const sort1 = [{ pinned_at: 1 }];
                const sort2 = [{ pinned_at: -1 }];
                (0, chai_1.expect)((0, utils_1.shouldConsiderPinnedChannels)(sort1)).to.be.true;
                (0, chai_1.expect)((0, utils_1.shouldConsiderPinnedChannels)(sort2)).to.be.true;
            });
        });
        describe('findPinnedAtSortOrder', () => {
            it('should return null if sort is undefined', () => {
                (0, chai_1.expect)((0, utils_1.findPinnedAtSortOrder)({ sort: null })).to.be.null;
            });
            it('should return null if pinned_at is not present', () => {
                const sort = [{ created_at: 1 }];
                (0, chai_1.expect)((0, utils_1.findPinnedAtSortOrder)({ sort })).to.be.null;
            });
            it('should return pinned_at if found in an object', () => {
                const sort = { pinned_at: -1 };
                (0, chai_1.expect)((0, utils_1.findPinnedAtSortOrder)({ sort })).to.equal(-1);
            });
            it('should return pinned_at if found in an array', () => {
                const sort = [{ pinned_at: 1 }];
                (0, chai_1.expect)((0, utils_1.findPinnedAtSortOrder)({ sort })).to.equal(1);
            });
        });
        describe('findLastPinnedChannelIndex', () => {
            it('should return null if no channels are provided', () => {
                (0, chai_1.expect)((0, utils_1.findLastPinnedChannelIndex)({ channels: [] })).to.be.null;
            });
            it('should return null if no channels are pinned', () => {
                const channelsResponse = [(0, generateChannel_1.generateChannel)({ membership: {} }), (0, generateChannel_1.generateChannel)({ membership: {} })];
                client.hydrateActiveChannels(channelsResponse);
                const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
                (0, chai_1.expect)((0, utils_1.findLastPinnedChannelIndex)({ channels })).to.be.null;
            });
            it('should return last index of a pinned channel', () => {
                const channelsResponse = [
                    (0, generateChannel_1.generateChannel)({ membership: { pinned_at: '2024-02-04T12:00:00Z' } }),
                    (0, generateChannel_1.generateChannel)({ membership: { pinned_at: '2024-02-04T12:01:00Z' } }),
                    (0, generateChannel_1.generateChannel)({ membership: {} }),
                ];
                client.hydrateActiveChannels(channelsResponse);
                const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
                (0, chai_1.expect)((0, utils_1.findLastPinnedChannelIndex)({ channels })).to.equal(1);
            });
        });
    });
    describe('Channel archiving', () => {
        it('should return false if channel is null', () => {
            (0, chai_1.expect)((0, utils_1.isChannelArchived)(null)).to.be.false;
        });
        it('should return false if archived_at is undefined', () => {
            const channelResponse = (0, generateChannel_1.generateChannel)({ membership: {} });
            client.hydrateActiveChannels([channelResponse]);
            const channel = client.channel(channelResponse.channel.type, channelResponse.channel.id);
            (0, chai_1.expect)((0, utils_1.isChannelArchived)(channel)).to.be.false;
        });
        it('should return true if archived_at is set', () => {
            const channelResponse = (0, generateChannel_1.generateChannel)({ membership: { archived_at: '2024-02-04T12:00:00Z' } });
            client.hydrateActiveChannels([channelResponse]);
            const channel = client.channel(channelResponse.channel.type, channelResponse.channel.id);
            (0, chai_1.expect)((0, utils_1.isChannelArchived)(channel)).to.be.true;
        });
        it('should return false if filters is null', () => {
            (0, chai_1.expect)((0, utils_1.shouldConsiderArchivedChannels)(null)).to.be.false;
        });
        it('should return false if filters.archived is missing', () => {
            const mockFilters = {};
            (0, chai_1.expect)((0, utils_1.shouldConsiderArchivedChannels)(mockFilters)).to.be.false;
        });
        it('should return false if filters.archived is not a boolean', () => {
            const mockFilters = { archived: 'yes' };
            (0, chai_1.expect)((0, utils_1.shouldConsiderArchivedChannels)(mockFilters)).to.be.false;
        });
        it('should return true if filters.archived is true', () => {
            const mockFilters = { archived: true };
            (0, chai_1.expect)((0, utils_1.shouldConsiderArchivedChannels)(mockFilters)).to.be.true;
        });
        it('should return true if filters.archived is false', () => {
            const mockFilters = { archived: false };
            (0, chai_1.expect)((0, utils_1.shouldConsiderArchivedChannels)(mockFilters)).to.be.true;
        });
    });
});
describe('promoteChannel', () => {
    let client;
    beforeEach(async () => {
        client = await (0, getClient_1.getClientWithUser)();
    });
    it('should return the original list if the channel is already at the top', () => {
        const channelsResponse = [(0, generateChannel_1.generateChannel)(), (0, generateChannel_1.generateChannel)()];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove: channels[0],
            sort: {},
        });
        (0, chai_1.expect)(result).to.deep.equal(channels);
        (0, chai_1.expect)(result).to.be.equal(channels);
    });
    it('should return the original list if the channel is pinned and pinned channels should be considered', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ membership: { pinned_at: '2024-02-04T12:00:00Z' } }),
            (0, generateChannel_1.generateChannel)({ membership: { pinned_at: '2024-02-04T12:01:00Z' } }),
        ];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = channels[1];
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: [{ pinned_at: 1 }],
        });
        (0, chai_1.expect)(result).to.deep.equal(channels);
        (0, chai_1.expect)(result).to.be.equal(channels);
    });
    it('should move a non-pinned channel upwards if it exists in the list', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel3' } }),
        ];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = channels[2];
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: {},
        });
        (0, chai_1.expect)(result.map((c) => c.id)).to.deep.equal(['channel3', 'channel1', 'channel2']);
        (0, chai_1.expect)(result).to.not.equal(channels);
    });
    it('should correctly move a non-pinned channel if its index is provided', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel3' } }),
        ];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = channels[2];
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: {},
            channelToMoveIndexWithinChannels: 2,
        });
        (0, chai_1.expect)(result.map((c) => c.id)).to.deep.equal(['channel3', 'channel1', 'channel2']);
        (0, chai_1.expect)(result).to.not.equal(channels);
    });
    it('should move a non-pinned channel upwards if it does not exist in the list', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel3' } }),
        ];
        const newChannel = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
        client.hydrateActiveChannels([...channelsResponse, newChannel]);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = client.channel(newChannel.channel.type, newChannel.channel.id);
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: {},
        });
        (0, chai_1.expect)(result.map((c) => c.id)).to.deep.equal(['channel4', 'channel1', 'channel2', 'channel3']);
        (0, chai_1.expect)(result).to.not.equal(channels);
    });
    it('should correctly move a non-pinned channel upwards if it does not exist and the index is provided', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel3' } }),
        ];
        const newChannel = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
        client.hydrateActiveChannels([...channelsResponse, newChannel]);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = client.channel(newChannel.channel.type, newChannel.channel.id);
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: {},
            channelToMoveIndexWithinChannels: -1,
        });
        (0, chai_1.expect)(result.map((c) => c.id)).to.deep.equal(['channel4', 'channel1', 'channel2', 'channel3']);
        (0, chai_1.expect)(result).to.not.equal(channels);
    });
    it('should move the channel just below the last pinned channel if pinned channels are considered', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'pinned1' }, membership: { pinned_at: '2024-02-04T12:00:00Z' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'pinned2' }, membership: { pinned_at: '2024-02-04T12:01:00Z' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
        ];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = channels[3];
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: [{ pinned_at: -1 }],
        });
        (0, chai_1.expect)(result.map((c) => c.id)).to.deep.equal(['pinned1', 'pinned2', 'channel2', 'channel1']);
        (0, chai_1.expect)(result).to.not.equal(channels);
    });
    it('should move the channel to the top of the list if pinned channels exist but are not considered', () => {
        const channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'pinned1' }, membership: { pinned_at: '2024-02-04T12:01:00Z' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'pinned2' }, membership: { pinned_at: '2024-02-04T12:00:00Z' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
        ];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        const channelToMove = channels[2];
        const result = (0, utils_1.promoteChannel)({
            channels,
            channelToMove,
            sort: {},
        });
        (0, chai_1.expect)(result.map((c) => c.id)).to.deep.equal(['channel1', 'pinned1', 'pinned2', 'channel2']);
        (0, chai_1.expect)(result).to.not.equal(channels);
    });
});
describe('uniqBy', () => {
    it('should return an empty array if input is not an array', () => {
        (0, chai_1.expect)((0, utils_1.uniqBy)(null, 'id')).to.deep.equal([]);
        (0, chai_1.expect)((0, utils_1.uniqBy)(undefined, 'id')).to.deep.equal([]);
        (0, chai_1.expect)((0, utils_1.uniqBy)(42, 'id')).to.deep.equal([]);
        (0, chai_1.expect)((0, utils_1.uniqBy)({}, 'id')).to.deep.equal([]);
    });
    it('should remove duplicates based on a property name', () => {
        const array = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 1, name: 'Alice' },
        ];
        const result = (0, utils_1.uniqBy)(array, 'id');
        (0, chai_1.expect)(result).to.deep.equal([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
        ]);
    });
    it('should remove duplicates based on a computed function', () => {
        const array = [
            { id: 1, value: 10 },
            { id: 2, value: 20 },
            { id: 3, value: 10 },
        ];
        const result = (0, utils_1.uniqBy)(array, (item) => item.value);
        (0, chai_1.expect)(result).to.deep.equal([
            { id: 1, value: 10 },
            { id: 2, value: 20 },
        ]);
    });
    it('should return the same array if all elements are unique', () => {
        const array = [
            { id: 1, value: 'A' },
            { id: 2, value: 'B' },
            { id: 3, value: 'C' },
        ];
        (0, chai_1.expect)((0, utils_1.uniqBy)(array, 'id')).to.deep.equal(array);
    });
    it('should work with nested properties', () => {
        const array = [
            { user: { id: 1, name: 'Alice' } },
            { user: { id: 2, name: 'Bob' } },
            { user: { id: 1, name: 'Alice' } },
        ];
        const result = (0, utils_1.uniqBy)(array, 'user.id');
        (0, chai_1.expect)(result).to.deep.equal([{ user: { id: 1, name: 'Alice' } }, { user: { id: 2, name: 'Bob' } }]);
    });
    it('should work with primitive identities', () => {
        (0, chai_1.expect)((0, utils_1.uniqBy)([1, 2, 2, 3, 1], (x) => x)).to.deep.equal([1, 2, 3]);
        (0, chai_1.expect)((0, utils_1.uniqBy)(['a', 'b', 'a', 'c'], (x) => x)).to.deep.equal(['a', 'b', 'c']);
    });
    it('should handle an empty array', () => {
        (0, chai_1.expect)((0, utils_1.uniqBy)([], 'id')).to.deep.equal([]);
    });
    it('should handle falsy values correctly', () => {
        const array = [{ id: 0 }, { id: false }, { id: null }, { id: undefined }, { id: 0 }];
        const result = (0, utils_1.uniqBy)(array, 'id');
        (0, chai_1.expect)(result).to.deep.equal([{ id: 0 }, { id: false }, { id: null }, { id: undefined }]);
    });
    it('should work when all elements are identical', () => {
        const array = [
            { id: 1, name: 'Alice' },
            { id: 1, name: 'Alice' },
            { id: 1, name: 'Alice' },
        ];
        (0, chai_1.expect)((0, utils_1.uniqBy)(array, 'id')).to.deep.equal([{ id: 1, name: 'Alice' }]);
    });
    it('should handle mixed types correctly', () => {
        const array = [{ id: 1 }, { id: '1' }, { id: 1.0 }, { id: true }, { id: false }];
        (0, chai_1.expect)((0, utils_1.uniqBy)(array, 'id')).to.deep.equal([{ id: 1 }, { id: '1' }, { id: true }, { id: false }]);
    });
    it('should handle undefined values in objects', () => {
        const array = [{ id: undefined }, { id: undefined }, { id: 1 }, { id: 2 }];
        (0, chai_1.expect)((0, utils_1.uniqBy)(array, 'id')).to.deep.equal([{ id: undefined }, { id: 1 }, { id: 2 }]);
    });
    it('should not modify the original array', () => {
        const array = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 1, name: 'Alice' },
        ];
        const originalArray = [...array];
        (0, utils_1.uniqBy)(array, 'id');
        (0, chai_1.expect)(array).to.deep.equal(originalArray);
    });
    it('should call iteratee function for each element', () => {
        const array = [{ id: 1 }, { id: 2 }, { id: 1 }];
        const iteratee = sinon_1.default.spy((item) => item.id);
        (0, utils_1.uniqBy)(array, iteratee);
        (0, chai_1.expect)(iteratee.calledThrice).to.be.true;
        (0, chai_1.expect)(iteratee.firstCall.returnValue).to.equal(1);
        (0, chai_1.expect)(iteratee.secondCall.returnValue).to.equal(2);
        (0, chai_1.expect)(iteratee.thirdCall.returnValue).to.equal(1);
    });
    it('should work with objects missing the given key', () => {
        const array = [
            { id: 1 },
            { name: 'Alice' }, // missing 'id'
            { id: 2 },
            { id: 1 },
        ];
        const result = (0, utils_1.uniqBy)(array, 'id');
        (0, chai_1.expect)(result).to.deep.equal([{ id: 1 }, { name: 'Alice' }, { id: 2 }]);
    });
    it('should work with an empty iteratee function', () => {
        const array = [{ id: 1 }, { id: 2 }];
        const result = (0, utils_1.uniqBy)(array, () => { });
        (0, chai_1.expect)(result.length).to.equal(1); // Everything maps to `undefined`, so only first is kept
    });
    it('should handle more than 1 duplicate efficiently', () => {
        const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i % 100 }));
        const result = (0, utils_1.uniqBy)(largeArray, 'id');
        (0, chai_1.expect)(result.length).to.equal(100);
    });
    it('should return an empty array when array contains only undefined values', () => {
        const array = [undefined, undefined, undefined];
        (0, chai_1.expect)((0, utils_1.uniqBy)(array, (x) => x)).to.deep.equal([undefined]);
    });
});
