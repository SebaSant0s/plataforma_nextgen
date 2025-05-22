"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const src_1 = require("../../src");
const generateChannel_1 = require("./test-utils/generateChannel");
const getClient_1 = require("./test-utils/getClient");
const Utils = __importStar(require("../../src/utils"));
describe('ChannelManager', () => {
    let client;
    let channelManager;
    let channelsResponse;
    beforeEach(async () => {
        client = await (0, getClient_1.getClientWithUser)();
        channelManager = client.createChannelManager({});
        channelManager.registerSubscriptions();
        channelsResponse = [
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel1' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel2' } }),
            (0, generateChannel_1.generateChannel)({ channel: { id: 'channel3' } }),
        ];
        client.hydrateActiveChannels(channelsResponse);
        const channels = channelsResponse.map((c) => client.channel(c.channel.type, c.channel.id));
        channelManager.state.partialNext({ channels, initialized: true });
    });
    afterEach(() => {
        sinon_1.default.restore();
        sinon_1.default.reset();
    });
    describe('initialization', () => {
        let channelManager;
        beforeEach(() => {
            channelManager = client.createChannelManager({});
        });
        it('initializes properly', () => {
            const state = channelManager.state.getLatestValue();
            (0, chai_1.expect)(state.channels).to.be.empty;
            (0, chai_1.expect)(state.pagination).to.deep.equal({
                isLoading: false,
                isLoadingNext: false,
                hasNext: false,
                filters: {},
                sort: {},
                options: src_1.DEFAULT_CHANNEL_MANAGER_PAGINATION_OPTIONS,
            });
            (0, chai_1.expect)(state.initialized).to.be.false;
        });
        it('should properly set eventHandlerOverrides and options if they are passed', () => {
            const eventHandlerOverrides = { newMessageHandler: () => { } };
            const options = {
                allowNotLoadedChannelPromotionForEvent: {
                    'channel.visible': false,
                    'message.new': false,
                    'notification.added_to_channel': false,
                    'notification.message_new': false,
                },
            };
            const newChannelManager = client.createChannelManager({ eventHandlerOverrides, options });
            (0, chai_1.expect)(Object.fromEntries(newChannelManager.eventHandlerOverrides)).to.deep.equal(eventHandlerOverrides);
            (0, chai_1.expect)(newChannelManager.options).to.deep.equal({ ...src_1.DEFAULT_CHANNEL_MANAGER_OPTIONS, ...options });
        });
        it('should properly set the default event handlers', () => {
            const { eventHandlers, channelDeletedHandler, channelHiddenHandler, channelVisibleHandler, memberUpdatedHandler, newMessageHandler, notificationAddedToChannelHandler, notificationNewMessageHandler, notificationRemovedFromChannelHandler, } = channelManager;
            (0, chai_1.expect)(Object.fromEntries(eventHandlers)).to.deep.equal({
                channelDeletedHandler,
                channelHiddenHandler,
                channelVisibleHandler,
                memberUpdatedHandler,
                newMessageHandler,
                notificationAddedToChannelHandler,
                notificationNewMessageHandler,
                notificationRemovedFromChannelHandler,
            });
        });
    });
    describe('setters', () => {
        it('should properly set eventHandlerOverrides and filter out falsy values', () => {
            const eventHandlerOverrides = { newMessageHandler: () => { }, channelDeletedHandler: () => { } };
            channelManager.setEventHandlerOverrides(eventHandlerOverrides);
            (0, chai_1.expect)(Object.fromEntries(channelManager.eventHandlerOverrides)).to.deep.equal(eventHandlerOverrides);
            channelManager.setEventHandlerOverrides({
                ...eventHandlerOverrides,
                notificationRemovedFromChannelHandler: undefined,
                channelHiddenHandler: undefined,
            });
            (0, chai_1.expect)(Object.fromEntries(channelManager.eventHandlerOverrides)).to.deep.equal(eventHandlerOverrides);
        });
        it('should properly set options', () => {
            const options = {
                lockChannelOrder: true,
                allowNotLoadedChannelPromotionForEvent: {
                    'channel.visible': false,
                    'message.new': false,
                    'notification.added_to_channel': true,
                    'notification.message_new': true,
                },
                abortInFlightQuery: false,
            };
            channelManager.setOptions(options);
            (0, chai_1.expect)(channelManager.options).to.deep.equal(options);
        });
        it('should respect option defaults if not explicitly provided', () => {
            const partialOptions1 = { lockChannelOrder: true };
            const partialOptions2 = {};
            channelManager.setOptions(partialOptions1);
            let options = channelManager.options;
            Object.entries(src_1.DEFAULT_CHANNEL_MANAGER_OPTIONS).forEach(([k, val]) => {
                const key = k;
                const wantedValue = partialOptions1[key] ?? src_1.DEFAULT_CHANNEL_MANAGER_OPTIONS[key];
                (0, chai_1.expect)(options[key]).to.deep.equal(wantedValue);
            });
            channelManager.setOptions(partialOptions2);
            options = channelManager.options;
            Object.entries(src_1.DEFAULT_CHANNEL_MANAGER_OPTIONS).forEach(([k, val]) => {
                const key = k;
                const wantedValue = partialOptions2[key] ?? src_1.DEFAULT_CHANNEL_MANAGER_OPTIONS[key];
                (0, chai_1.expect)(options[key]).to.deep.equal(wantedValue);
            });
        });
        describe('setChannels', () => {
            it('should properly set channels if a direct value is provided', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.setChannels(prevChannels.splice(1));
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(newChannels.map((c) => c.id)).to.deep.equal(['channel2', 'channel3']);
            });
            it('should update the reference of state.channels if changed', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.setChannels([...prevChannels]);
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(newChannels.map((c) => c.id)).to.deep.equal(prevChannels.map((c) => c.id));
                (0, chai_1.expect)(newChannels).to.not.equal(prevChannels);
            });
            it('should use a factory function to calculate the new state if provided', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.setChannels((prevChannelsRef) => {
                    (0, chai_1.expect)(prevChannelsRef).to.equal(prevChannels);
                    return prevChannelsRef.reverse();
                });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(newChannels.map((c) => c.id)).to.deep.equal(['channel3', 'channel2', 'channel1']);
            });
            it('should maintain referential integrity if the same channels are passed', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.setChannels(prevChannels);
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(newChannels.map((c) => c.id)).to.deep.equal(prevChannels.map((c) => c.id));
                (0, chai_1.expect)(newChannels).to.equal(prevChannels);
            });
            it('should maintain referential integrity from the setter factory as well', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.setChannels((prevChannelsRef) => {
                    return prevChannelsRef;
                });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(newChannels.map((c) => c.id)).to.deep.equal(prevChannels.map((c) => c.id));
                (0, chai_1.expect)(newChannels).to.equal(prevChannels);
            });
        });
    });
    describe('event subscriptions', () => {
        it('should only invoke event handlers if registerSubscriptions has been called', () => {
            const newChannelManager = client.createChannelManager({});
            const originalNewMessageHandler = newChannelManager.eventHandlers.get('newMessageHandler');
            const originalNotificationAddedToChannelHandler = newChannelManager.eventHandlers.get('notificationAddedToChannelHandler');
            const newMessageHandlerSpy = sinon_1.default.spy(originalNewMessageHandler);
            const notificationAddedToChannelHandlerSpy = sinon_1.default.spy(originalNotificationAddedToChannelHandler);
            const clientOnSpy = sinon_1.default.spy(client, 'on');
            newChannelManager.eventHandlers.set('newMessageHandler', newMessageHandlerSpy);
            newChannelManager.eventHandlers.set('notificationAddedToChannelHandler', notificationAddedToChannelHandlerSpy);
            client.dispatchEvent({ type: 'message.new' });
            client.dispatchEvent({ type: 'notification.added_to_channel' });
            (0, chai_1.expect)(clientOnSpy.called).to.be.false;
            (0, chai_1.expect)(newMessageHandlerSpy.called).to.be.false;
            (0, chai_1.expect)(notificationAddedToChannelHandlerSpy.called).to.be.false;
            newChannelManager.registerSubscriptions();
            (0, chai_1.expect)(clientOnSpy.called).to.be.true;
            client.dispatchEvent({ type: 'message.new' });
            client.dispatchEvent({ type: 'notification.added_to_channel' });
            (0, chai_1.expect)(newMessageHandlerSpy.calledOnce).to.be.true;
            (0, chai_1.expect)(notificationAddedToChannelHandlerSpy.calledOnce).to.be.true;
        });
        it('should register listeners to all configured event handlers and do it exactly once', () => {
            const clientOnSpy = sinon_1.default.spy(client, 'on');
            const newChannelManager = client.createChannelManager({});
            newChannelManager.registerSubscriptions();
            newChannelManager.registerSubscriptions();
            (0, chai_1.expect)(clientOnSpy.callCount).to.equal(Object.keys(src_1.channelManagerEventToHandlerMapping).length);
            Object.keys(src_1.channelManagerEventToHandlerMapping).forEach((eventType) => {
                (0, chai_1.expect)(clientOnSpy.calledWith(eventType)).to.be.true;
            });
        });
        it('should unregister subscriptions if unregisterSubscriptions is called', () => {
            const newChannelManager = client.createChannelManager({});
            const originalNewMessageHandler = newChannelManager.eventHandlers.get('newMessageHandler');
            const originalNotificationAddedToChannelHandler = newChannelManager.eventHandlers.get('notificationAddedToChannelHandler');
            const newMessageHandlerSpy = sinon_1.default.spy(originalNewMessageHandler);
            const notificationAddedToChannelHandlerSpy = sinon_1.default.spy(originalNotificationAddedToChannelHandler);
            newChannelManager.eventHandlers.set('newMessageHandler', newMessageHandlerSpy);
            newChannelManager.eventHandlers.set('notificationAddedToChannelHandler', notificationAddedToChannelHandlerSpy);
            newChannelManager.registerSubscriptions();
            newChannelManager.unregisterSubscriptions();
            client.dispatchEvent({ type: 'message.new' });
            client.dispatchEvent({ type: 'notification.added_to_channel' });
            (0, chai_1.expect)(newMessageHandlerSpy.called).to.be.false;
            (0, chai_1.expect)(notificationAddedToChannelHandlerSpy.called).to.be.false;
        });
        it('should call overrides for event handlers if they exist', () => {
            const newChannelManager = client.createChannelManager({});
            const originalNewMessageHandler = newChannelManager.eventHandlers.get('newMessageHandler');
            const originalNotificationAddedToChannelHandler = newChannelManager.eventHandlers.get('notificationAddedToChannelHandler');
            const newMessageHandlerSpy = sinon_1.default.spy(originalNewMessageHandler);
            const notificationAddedToChannelHandlerSpy = sinon_1.default.spy(originalNotificationAddedToChannelHandler);
            const newMessageHandlerOverrideSpy = sinon_1.default.spy(() => { });
            newChannelManager.eventHandlers.set('newMessageHandler', newMessageHandlerSpy);
            newChannelManager.eventHandlers.set('notificationAddedToChannelHandler', notificationAddedToChannelHandlerSpy);
            newChannelManager.registerSubscriptions();
            newChannelManager.setEventHandlerOverrides({ newMessageHandler: newMessageHandlerOverrideSpy });
            client.dispatchEvent({ type: 'message.new' });
            client.dispatchEvent({ type: 'notification.added_to_channel' });
            (0, chai_1.expect)(newMessageHandlerSpy.called).to.be.false;
            (0, chai_1.expect)(newMessageHandlerOverrideSpy.called).to.be.true;
            (0, chai_1.expect)(notificationAddedToChannelHandlerSpy.called).to.be.true;
        });
    });
    it('should call channel.updated event handler override', () => {
        const spy = sinon_1.default.spy(() => { });
        channelManager.setEventHandlerOverrides({ channelUpdatedHandler: spy });
        spy.resetHistory();
        client.dispatchEvent({ type: 'channel.updated' });
        (0, chai_1.expect)(spy.callCount).to.be.equal(1);
    });
    it('should call channel.truncated event handler override', () => {
        const spy = sinon_1.default.spy(() => { });
        channelManager.setEventHandlerOverrides({ channelTruncatedHandler: spy });
        spy.resetHistory();
        client.dispatchEvent({ type: 'channel.truncated' });
        (0, chai_1.expect)(spy.callCount).to.be.equal(1);
    });
    ['channel.updated', 'channel.truncated'].forEach((eventType) => {
        it(`should do nothing on ${eventType} by default`, () => {
            const spy = sinon_1.default.spy(() => { });
            channelManager.state.subscribe(spy);
            spy.resetHistory();
            const channel = channelsResponse[channelsResponse.length - 1].channel;
            client.dispatchEvent({ type: eventType, channel_type: channel.type, channel_id: channel.id });
            (0, chai_1.expect)(spy.called).to.be.false;
        });
    });
    describe('querying and pagination', () => {
        let clientQueryChannelsStub;
        let mockChannelPages;
        let channelManager;
        beforeEach(() => {
            channelManager = client.createChannelManager({});
            const channelQueryResponses = [
                Array.from({ length: 10 }, () => (0, generateChannel_1.generateChannel)()),
                Array.from({ length: 10 }, () => (0, generateChannel_1.generateChannel)()),
                Array.from({ length: 5 }, () => (0, generateChannel_1.generateChannel)()),
            ];
            mockChannelPages = channelQueryResponses.map((channelQueryResponse) => {
                client.hydrateActiveChannels(channelQueryResponse);
                return channelQueryResponse.map((c) => client.channel(c.channel.type, c.channel.id));
            });
            clientQueryChannelsStub = sinon_1.default.stub(client, 'queryChannels').callsFake((_filters, _sort, options) => {
                const offset = options?.offset ?? 0;
                return Promise.resolve(mockChannelPages[Math.floor(offset / 10)]);
            });
        });
        afterEach(() => {
            sinon_1.default.restore();
            sinon_1.default.reset();
        });
        describe('queryChannels', () => {
            it('should not query if pagination.isLoading is true', async () => {
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: {
                        ...prevState.pagination,
                        isLoading: true,
                    },
                }));
                await channelManager.queryChannels({});
                (0, chai_1.expect)(clientQueryChannelsStub.called).to.be.false;
            });
            it('should not query more than once from the same manager for 2 different queries', async () => {
                await Promise.all([channelManager.queryChannels({}), channelManager.queryChannels({})]);
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
            });
            it('should query more than once if channelManager.options.abortInFlightQuery is true', async () => {
                channelManager.setOptions({ abortInFlightQuery: true });
                await Promise.all([channelManager.queryChannels({}), channelManager.queryChannels({})]);
                (0, chai_1.expect)(clientQueryChannelsStub.callCount).to.equal(2);
            });
            it('should set the state to loading while an active query is happening', async () => {
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ isLoading: nextValue.pagination.isLoading }), stateChangeSpy);
                // TODO: Check why the test doesn't work without this;
                //       something keeps invoking one extra state change
                //       and I can't figure out what.
                stateChangeSpy.resetHistory();
                await channelManager.queryChannels({});
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({ isLoading: true });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({ isLoading: false });
            });
            it('should set state.initialized to true after the first queryChannels is done', async () => {
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ initialized: nextValue.initialized }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                const { initialized } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(initialized).to.be.false;
                await channelManager.queryChannels({});
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(stateChangeSpy.calledOnce).to.be.true;
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({ initialized: true });
            });
            it('should properly set the new pagination parameters and update the offset after the query', async () => {
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ pagination: nextValue.pagination }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                const { channels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: false,
                        isLoading: true,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 0 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 10 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(channels.length).to.equal(10);
            });
            it('should properly update hasNext and offset if the first returned page is less than the limit', async () => {
                clientQueryChannelsStub.callsFake(() => mockChannelPages[2]);
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                const { channels, pagination: { hasNext, options: { offset }, }, } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(channels.length).to.equal(5);
                (0, chai_1.expect)(offset).to.equal(5);
                (0, chai_1.expect)(hasNext).to.be.false;
            });
        });
        describe('loadNext', () => {
            it('should not run loadNext if queryChannels has not been run at least once', async () => {
                channelManager.state.partialNext({ initialized: false });
                await channelManager.loadNext();
                (0, chai_1.expect)(clientQueryChannelsStub.called).to.be.false;
            });
            it('should not run loadNext if a query is already in progress or if we are at the last page', async () => {
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    initialized: true,
                    pagination: { ...prevState.pagination, isLoadingNext: true, hasNext: true },
                }));
                await channelManager.loadNext();
                (0, chai_1.expect)(clientQueryChannelsStub.called).to.be.false;
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    initialized: true,
                    pagination: { ...prevState.pagination, isLoadingNext: false, hasNext: false },
                }));
                await channelManager.loadNext();
                (0, chai_1.expect)(clientQueryChannelsStub.called).to.be.false;
            });
            it('should not queryChannels more than once regardless of number of consecutive loadNext invocations', async () => {
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    initialized: true,
                    pagination: { ...prevState.pagination, isLoadingNext: false, hasNext: true },
                }));
                await Promise.all([channelManager.loadNext(), channelManager.loadNext()]);
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
            });
            it('should set the state to loading next page while an active query is happening', async () => {
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    initialized: true,
                    pagination: { ...prevState.pagination, isLoadingNext: false, hasNext: true },
                }));
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ isLoadingNext: nextValue.pagination.isLoadingNext }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                await channelManager.loadNext();
                (0, chai_1.expect)(clientQueryChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({ isLoadingNext: true });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({ isLoadingNext: false });
            });
            it('should properly set the new pagination parameters and update the offset after loading next', async () => {
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ pagination: nextValue.pagination }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                await channelManager.loadNext();
                const { channels } = channelManager.state.getLatestValue();
                // one from queryChannels and one from loadNext
                (0, chai_1.expect)(clientQueryChannelsStub.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: true,
                        options: { limit: 10, offset: 10 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 20 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(channels.length).to.equal(20);
            });
            it('should properly paginate even if state.channels gets modified in the meantime', async () => {
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    channels: [...mockChannelPages[2].slice(0, 5), ...prevState.channels],
                }));
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ pagination: nextValue.pagination }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                await channelManager.loadNext();
                const { channels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(clientQueryChannelsStub.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: true,
                        options: { limit: 10, offset: 10 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 20 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(channels.length).to.equal(25);
            });
            it('should properly deduplicate when paginating if channels from the next page have been promoted', async () => {
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    channels: [...mockChannelPages[1].slice(0, 5), ...prevState.channels],
                }));
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ pagination: nextValue.pagination }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                await channelManager.loadNext();
                const { channels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(clientQueryChannelsStub.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(2);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: true,
                        options: { limit: 10, offset: 10 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 20 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(channels.length).to.equal(20);
            });
            it('should properly deduplicate when paginating if channels latter pages have been promoted and reached', async () => {
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    channels: [...mockChannelPages[2].slice(0, 3), ...prevState.channels],
                }));
                const stateChangeSpy = sinon_1.default.spy();
                channelManager.state.subscribeWithSelector((nextValue) => ({ pagination: nextValue.pagination }), stateChangeSpy);
                stateChangeSpy.resetHistory();
                await channelManager.loadNext();
                const { channels: channelsAfterFirstPagination } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(channelsAfterFirstPagination.length).to.equal(23);
                await channelManager.loadNext();
                const { channels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(clientQueryChannelsStub.callCount).to.equal(3);
                (0, chai_1.expect)(stateChangeSpy.callCount).to.equal(4);
                (0, chai_1.expect)(stateChangeSpy.args[0][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: true,
                        options: { limit: 10, offset: 10 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(stateChangeSpy.args[1][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: true,
                        isLoading: false,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 20 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(stateChangeSpy.args[3][0]).to.deep.equal({
                    pagination: {
                        filters: { filterA: true },
                        hasNext: false,
                        isLoading: false,
                        isLoadingNext: false,
                        options: { limit: 10, offset: 25 },
                        sort: { asc: 1 },
                    },
                });
                (0, chai_1.expect)(channels.length).to.equal(25);
            });
            it('should correctly update hasNext and offset if the last page has been reached', async () => {
                const { channels: initialChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(initialChannels.length).to.equal(0);
                await channelManager.queryChannels({ filterA: true }, { asc: 1 }, { limit: 10, offset: 0 });
                await channelManager.loadNext();
                const { channels: secondToLastPage, pagination: { hasNext: prevHasNext }, } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(secondToLastPage.length).to.equal(20);
                (0, chai_1.expect)(prevHasNext).to.be.true;
                await channelManager.loadNext();
                const { channels: lastPage, pagination: { hasNext, options: { offset }, }, } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(lastPage.length).to.equal(25);
                (0, chai_1.expect)(hasNext).to.be.false;
                (0, chai_1.expect)(offset).to.equal(25);
            });
        });
    });
    describe('websocket event handlers', () => {
        let setChannelsStub;
        let isChannelPinnedStub;
        let isChannelArchivedStub;
        let shouldConsiderArchivedChannelsStub;
        let shouldConsiderPinnedChannelsStub;
        let promoteChannelSpy;
        let getAndWatchChannelStub;
        let findLastPinnedChannelIndexStub;
        let extractSortValueStub;
        beforeEach(() => {
            setChannelsStub = sinon_1.default.stub(channelManager, 'setChannels');
            isChannelPinnedStub = sinon_1.default.stub(Utils, 'isChannelPinned');
            isChannelArchivedStub = sinon_1.default.stub(Utils, 'isChannelArchived');
            shouldConsiderArchivedChannelsStub = sinon_1.default.stub(Utils, 'shouldConsiderArchivedChannels');
            shouldConsiderPinnedChannelsStub = sinon_1.default.stub(Utils, 'shouldConsiderPinnedChannels');
            getAndWatchChannelStub = sinon_1.default.stub(Utils, 'getAndWatchChannel');
            findLastPinnedChannelIndexStub = sinon_1.default.stub(Utils, 'findLastPinnedChannelIndex');
            extractSortValueStub = sinon_1.default.stub(Utils, 'extractSortValue');
            promoteChannelSpy = sinon_1.default.spy(Utils, 'promoteChannel');
        });
        afterEach(() => {
            sinon_1.default.restore();
            sinon_1.default.reset();
        });
        describe('channelDeletedHandler, channelHiddenHandler and notificationRemovedFromChannelHandler', () => {
            let channelToRemove;
            beforeEach(() => {
                channelToRemove = channelsResponse[1].channel;
            });
            ['channel.deleted', 'channel.hidden', 'notification.removed_from_channel'].forEach((eventType) => {
                it('should return early if channels is undefined', () => {
                    channelManager.state.partialNext({ channels: undefined });
                    client.dispatchEvent({ type: eventType, cid: channelToRemove.cid });
                    client.dispatchEvent({ type: eventType, channel: channelToRemove });
                    (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                });
                it('should remove the channel when event.cid matches', () => {
                    client.dispatchEvent({ type: eventType, cid: channelToRemove.cid });
                    (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                    (0, chai_1.expect)(setChannelsStub.args[0][0].map((c) => c.id)).to.deep.equal(['channel1', 'channel3']);
                });
                it('should remove the channel when event.channel?.cid matches', () => {
                    client.dispatchEvent({ type: eventType, channel: channelToRemove });
                    (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                    (0, chai_1.expect)(setChannelsStub.args[0][0].map((c) => c.id)).to.deep.equal(['channel1', 'channel3']);
                });
                it('should not modify the list if no channels match', () => {
                    const { channels: prevChannels } = channelManager.state.getLatestValue();
                    client.dispatchEvent({ type: eventType, cid: 'channel123' });
                    const { channels: newChannels } = channelManager.state.getLatestValue();
                    (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                    (0, chai_1.expect)(prevChannels).to.equal(newChannels);
                    (0, chai_1.expect)(prevChannels).to.deep.equal(newChannels);
                });
            });
        });
        describe('newMessageHandler', () => {
            it('should not update the state early if channels are not defined', () => {
                channelManager.state.partialNext({ channels: undefined });
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel2' });
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should not update the state if channel is pinned and sorting considers pinned channels', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                isChannelPinnedStub.returns(true);
                shouldConsiderPinnedChannelsStub.returns(true);
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel2' });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                (0, chai_1.expect)(prevChannels).to.equal(newChannels);
                (0, chai_1.expect)(prevChannels).to.deep.equal(newChannels);
            });
            it('should not update the state if channel is archived and sorting considers archived channels, but the filter is false', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: false } },
                }));
                isChannelArchivedStub.returns(true);
                shouldConsiderArchivedChannelsStub.returns(true);
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel2' });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                (0, chai_1.expect)(prevChannels).to.equal(newChannels);
                (0, chai_1.expect)(prevChannels).to.deep.equal(newChannels);
            });
            it('should not update the state if channel is not archived and sorting considers archived channels, but the filter is true', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: true } },
                }));
                isChannelArchivedStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(true);
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel2' });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                (0, chai_1.expect)(prevChannels).to.equal(newChannels);
                (0, chai_1.expect)(prevChannels).to.deep.equal(newChannels);
            });
            it('should not update the state if channelManager.options.lockChannelOrder is true', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                channelManager.setOptions({ lockChannelOrder: true });
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel2' });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                (0, chai_1.expect)(prevChannels).to.equal(newChannels);
                (0, chai_1.expect)(prevChannels).to.deep.equal(newChannels);
                channelManager.setOptions({});
            });
            it('should not update the state if the channel is not part of the list and allowNotLoadedChannelPromotionForEvent["message.new"] if false', () => {
                const { channels: prevChannels } = channelManager.state.getLatestValue();
                isChannelPinnedStub.returns(false);
                isChannelArchivedStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(false);
                shouldConsiderPinnedChannelsStub.returns(false);
                channelManager.setOptions({
                    allowNotLoadedChannelPromotionForEvent: {
                        'channel.visible': true,
                        'message.new': false,
                        'notification.added_to_channel': true,
                        'notification.message_new': true,
                    },
                });
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel4' });
                const { channels: newChannels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                (0, chai_1.expect)(prevChannels).to.equal(newChannels);
                (0, chai_1.expect)(prevChannels).to.deep.equal(newChannels);
                channelManager.setOptions({});
            });
            it('should move the channel upwards if it is not part of the list and allowNotLoadedChannelPromotionForEvent["message.new"] is true', () => {
                isChannelPinnedStub.returns(false);
                isChannelArchivedStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(false);
                shouldConsiderPinnedChannelsStub.returns(false);
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel4' });
                const { pagination: { sort }, channels, } = channelManager.state.getLatestValue();
                const promoteChannelArgs = promoteChannelSpy.args[0][0];
                const newChannel = client.channel('messaging', 'channel4');
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelSpy.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelArgs).to.deep.equal({
                    channels,
                    channelToMove: newChannel,
                    channelToMoveIndexWithinChannels: -1,
                    sort,
                });
                (0, chai_1.expect)(setChannelsStub.args[0][0]).to.deep.equal(Utils.promoteChannel(promoteChannelArgs));
            });
            it('should move the channel upwards if all conditions allow it', () => {
                isChannelPinnedStub.returns(false);
                isChannelArchivedStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(false);
                shouldConsiderPinnedChannelsStub.returns(false);
                client.dispatchEvent({ type: 'message.new', channel_type: 'messaging', channel_id: 'channel2' });
                const { pagination: { sort }, channels, } = channelManager.state.getLatestValue();
                const promoteChannelArgs = promoteChannelSpy.args[0][0];
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelSpy.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelArgs).to.deep.equal({
                    channels,
                    channelToMove: channels[1],
                    channelToMoveIndexWithinChannels: 1,
                    sort,
                });
                (0, chai_1.expect)(setChannelsStub.args[0][0]).to.deep.equal(Utils.promoteChannel(promoteChannelArgs));
            });
        });
        describe('notificationNewMessageHandler', () => {
            let clock;
            beforeEach(() => {
                clock = sinon_1.default.useFakeTimers();
            });
            afterEach(() => {
                clock.restore();
            });
            it('should not update the state if the event has no id and type', async () => {
                client.dispatchEvent({ type: 'notification.message_new', channel: {} });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.false;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should execute getAndWatchChannel if id and type are provided', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                client.dispatchEvent({
                    type: 'notification.message_new',
                    channel: { type: 'messaging', id: 'channel4' },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.calledOnce).to.be.true;
                (0, chai_1.expect)(getAndWatchChannelStub.calledWith({ client, id: 'channel4', type: 'messaging' })).to.be.true;
            });
            it('should not update the state if channel is archived and filters do not allow it', async () => {
                isChannelArchivedStub.returns(true);
                shouldConsiderArchivedChannelsStub.returns(true);
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: false } },
                }));
                client.dispatchEvent({
                    type: 'notification.message_new',
                    channel: { type: 'messaging', id: 'channel4' },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.true;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should not update the state if channel is not archived and and filters allow it', async () => {
                isChannelArchivedStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(true);
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: true } },
                }));
                client.dispatchEvent({
                    type: 'notification.message_new',
                    channel: { type: 'messaging', id: 'channel4' },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.true;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should not update the state if allowNotLoadedChannelPromotionForEvent["notification.message_new"] is false', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                channelManager.setOptions({
                    allowNotLoadedChannelPromotionForEvent: {
                        'channel.visible': true,
                        'message.new': true,
                        'notification.added_to_channel': true,
                        'notification.message_new': false,
                    },
                });
                client.dispatchEvent({
                    type: 'notification.message_new',
                    channel: { type: 'messaging', id: 'channel4' },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.true;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                channelManager.setOptions({});
            });
            it('should move channel when all criteria are met', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                client.dispatchEvent({
                    type: 'notification.message_new',
                    channel: { type: 'messaging', id: 'channel4' },
                });
                await clock.runAllAsync();
                const { pagination: { sort }, channels, } = channelManager.state.getLatestValue();
                const promoteChannelArgs = promoteChannelSpy.args[0][0];
                (0, chai_1.expect)(getAndWatchChannelStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelSpy.calledOnce).to.be.true;
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelArgs).to.deep.equal({ channels, channelToMove: newChannel, sort });
                (0, chai_1.expect)(setChannelsStub.args[0][0]).to.deep.equal(Utils.promoteChannel(promoteChannelArgs));
            });
            it('should not add duplicate channels for multiple event invocations', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                const event = {
                    type: 'notification.message_new',
                    channel: { type: 'messaging', id: 'channel4' },
                };
                // call the event 3 times
                client.dispatchEvent(event);
                client.dispatchEvent(event);
                client.dispatchEvent(event);
                await clock.runAllAsync();
                const { pagination: { sort }, channels, } = channelManager.state.getLatestValue();
                const promoteChannelArgs = { channels, channelToMove: newChannel, sort };
                (0, chai_1.expect)(getAndWatchChannelStub.callCount).to.equal(3);
                (0, chai_1.expect)(promoteChannelSpy.callCount).to.equal(3);
                (0, chai_1.expect)(setChannelsStub.callCount).to.equal(3);
                promoteChannelSpy.args.forEach((arg) => {
                    (0, chai_1.expect)(arg[0]).to.deep.equal(promoteChannelArgs);
                });
                setChannelsStub.args.forEach((arg) => {
                    (0, chai_1.expect)(arg[0]).to.deep.equal(Utils.promoteChannel(promoteChannelArgs));
                });
            });
        });
        describe('channelVisibleHandler', () => {
            let clock;
            beforeEach(() => {
                clock = sinon_1.default.useFakeTimers();
            });
            afterEach(() => {
                clock.restore();
            });
            it('should not update the state if the event has no id and type', async () => {
                client.dispatchEvent({ type: 'channel.visible', channel: {} });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.false;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should not update the state if channels is undefined', async () => {
                channelManager.state.partialNext({ channels: undefined });
                client.dispatchEvent({ type: 'channel.visible', channel_id: 'channel4', channel_type: 'messaging' });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.true;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should not update the state if the channel is archived and filters do not allow it', async () => {
                isChannelArchivedStub.returns(true);
                shouldConsiderArchivedChannelsStub.returns(true);
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: false } },
                }));
                client.dispatchEvent({ type: 'channel.visible', channel_id: 'channel4', channel_type: 'messaging' });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.true;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should not update the state if the channel is archived and filters do not allow it', async () => {
                isChannelArchivedStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(true);
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: true } },
                }));
                client.dispatchEvent({ type: 'channel.visible', channel_id: 'channel4', channel_type: 'messaging' });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.called).to.be.true;
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
            });
            it('should add the channel to the list if all criteria are met', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                client.dispatchEvent({ type: 'channel.visible', channel_id: 'channel4', channel_type: 'messaging' });
                await clock.runAllAsync();
                const { pagination: { sort }, channels, } = channelManager.state.getLatestValue();
                const promoteChannelArgs = promoteChannelSpy.args[0][0];
                (0, chai_1.expect)(getAndWatchChannelStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelSpy.calledOnce).to.be.true;
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelArgs).to.deep.equal({ channels, channelToMove: newChannel, sort });
                (0, chai_1.expect)(setChannelsStub.args[0][0]).to.deep.equal(Utils.promoteChannel(promoteChannelArgs));
            });
        });
        describe('memberUpdatedHandler', () => {
            let clock;
            let dispatchMemberUpdatedEvent;
            beforeEach(() => {
                clock = sinon_1.default.useFakeTimers();
                dispatchMemberUpdatedEvent = (id) => client.dispatchEvent({
                    type: 'member.updated',
                    channel_id: id ?? 'channel2',
                    channel_type: 'messaging',
                    member: { user: { id: client?.userID ?? 'anonymous' } },
                });
            });
            afterEach(() => {
                clock.restore();
            });
            it('should not update state if event member does not have user or user id does not match', () => {
                client.dispatchEvent({
                    type: 'member.updated',
                    channel_id: 'channel2',
                    channel_type: 'messaging',
                    member: { user: { id: 'wrongUserID' } },
                });
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
                client.dispatchEvent({ type: 'member.updated', channel_id: 'channel2', channel_type: 'messaging', member: {} });
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
            });
            it('should not update state if channel_type or channel_id is not present', () => {
                client.dispatchEvent({ type: 'member.updated', member: { user: { id: 'user123' } } });
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
                client.dispatchEvent({
                    type: 'member.updated',
                    member: { user: { id: 'user123' } },
                    channel_type: 'messaging',
                });
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
                client.dispatchEvent({ type: 'member.updated', member: { user: { id: 'user123' } }, channel_id: 'channel2' });
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
            });
            it('should not update state early if channels are not available in state', () => {
                channelManager.state.partialNext({ channels: undefined });
                dispatchMemberUpdatedEvent();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
            });
            it('should not update state if options.lockChannelOrder is true', () => {
                channelManager.setOptions({ lockChannelOrder: true });
                dispatchMemberUpdatedEvent();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
            });
            it('should not update state if neither channel pinning nor archiving should not be considered', () => {
                shouldConsiderPinnedChannelsStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(false);
                dispatchMemberUpdatedEvent();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
            });
            it('should update the state if only pinned channels should be considered', () => {
                shouldConsiderPinnedChannelsStub.returns(true);
                shouldConsiderArchivedChannelsStub.returns(false);
                dispatchMemberUpdatedEvent();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
            });
            it('should update the state if only archived channels should be considered', () => {
                shouldConsiderPinnedChannelsStub.returns(false);
                shouldConsiderArchivedChannelsStub.returns(true);
                dispatchMemberUpdatedEvent();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
            });
            it('should handle archiving correctly', () => {
                channelManager.state.next((prevState) => ({
                    ...prevState,
                    pagination: { ...prevState.pagination, filters: { archived: true } },
                }));
                isChannelArchivedStub.returns(true);
                shouldConsiderArchivedChannelsStub.returns(true);
                shouldConsiderPinnedChannelsStub.returns(true);
                dispatchMemberUpdatedEvent();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(setChannelsStub.args[0][0].map((c) => c.id)).to.deep.equal([
                    'channel2',
                    'channel1',
                    'channel3',
                ]);
            });
            it('should pin channel at the correct position when pinnedAtSort is 1', () => {
                isChannelPinnedStub.returns(false);
                shouldConsiderPinnedChannelsStub.returns(true);
                findLastPinnedChannelIndexStub.returns(0);
                extractSortValueStub.returns(1);
                dispatchMemberUpdatedEvent('channel3');
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(setChannelsStub.args[0][0].map((c) => c.id)).to.deep.equal([
                    'channel1',
                    'channel3',
                    'channel2',
                ]);
            });
            it('should pin channel at the correct position when pinnedAtSort is -1 and the target is not pinned', () => {
                isChannelPinnedStub.callsFake((c) => c.id === 'channel1');
                shouldConsiderPinnedChannelsStub.returns(true);
                findLastPinnedChannelIndexStub.returns(0);
                extractSortValueStub.returns(-1);
                dispatchMemberUpdatedEvent('channel3');
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(setChannelsStub.args[0][0].map((c) => c.id)).to.deep.equal([
                    'channel1',
                    'channel3',
                    'channel2',
                ]);
            });
            it('should pin channel at the correct position when pinnedAtSort is -1 and the target is pinned', () => {
                isChannelPinnedStub.callsFake((c) => ['channel1', 'channel3'].includes(c.id));
                shouldConsiderPinnedChannelsStub.returns(true);
                findLastPinnedChannelIndexStub.returns(0);
                extractSortValueStub.returns(-1);
                dispatchMemberUpdatedEvent('channel3');
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(setChannelsStub.args[0][0].map((c) => c.id)).to.deep.equal([
                    'channel3',
                    'channel1',
                    'channel2',
                ]);
            });
            it('should not update state if position of target channel does not change', () => {
                isChannelPinnedStub.returns(false);
                shouldConsiderPinnedChannelsStub.returns(true);
                findLastPinnedChannelIndexStub.returns(0);
                extractSortValueStub.returns(1);
                dispatchMemberUpdatedEvent();
                const { channels } = channelManager.state.getLatestValue();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
                (0, chai_1.expect)(channels[1].id).to.equal('channel2');
            });
        });
        describe('notificationAddedToChannelHandler', () => {
            let clock;
            beforeEach(() => {
                clock = sinon_1.default.useFakeTimers();
            });
            afterEach(() => {
                clock.restore();
            });
            it('should not update state if event.channel defaults are missing', async () => {
                client.dispatchEvent({ type: 'notification.added_to_channel' });
                await clock.runAllAsync();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
                client.dispatchEvent({
                    type: 'notification.added_to_channel',
                    channel: { id: '123' },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.false;
            });
            it('should not update state if allowNotLoadedChannelPromotionForEvent["notification.added_to_channel"] is false', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                channelManager.setOptions({
                    allowNotLoadedChannelPromotionForEvent: {
                        'channel.visible': true,
                        'message.new': true,
                        'notification.added_to_channel': false,
                        'notification.message_new': true,
                    },
                });
                client.dispatchEvent({
                    type: 'notification.added_to_channel',
                    channel: {
                        id: 'channel4',
                        type: 'messaging',
                        members: [{ user_id: 'user1' }],
                    },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(setChannelsStub.called).to.be.false;
                channelManager.setOptions({});
            });
            it('should call getAndWatchChannel with correct parameters', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                client.dispatchEvent({
                    type: 'notification.added_to_channel',
                    channel: {
                        id: 'channel4',
                        type: 'messaging',
                        members: [{ user_id: 'user1' }],
                    },
                });
                await clock.runAllAsync();
                (0, chai_1.expect)(getAndWatchChannelStub.calledOnce).to.be.true;
                (0, chai_1.expect)(getAndWatchChannelStub.args[0][0]).to.deep.equal({
                    client,
                    id: 'channel4',
                    type: 'messaging',
                    members: ['user1'],
                });
            });
            it('should move the channel upwards when criteria is met', async () => {
                const newChannelResponse = (0, generateChannel_1.generateChannel)({ channel: { id: 'channel4' } });
                const newChannel = client.channel(newChannelResponse.channel.type, newChannelResponse.channel.id);
                getAndWatchChannelStub.resolves(newChannel);
                client.dispatchEvent({
                    type: 'notification.added_to_channel',
                    channel: {
                        id: 'channel4',
                        type: 'messaging',
                        members: [{ user_id: 'user1' }],
                    },
                });
                await clock.runAllAsync();
                const { pagination: { sort }, channels, } = channelManager.state.getLatestValue();
                const promoteChannelArgs = promoteChannelSpy.args[0][0];
                (0, chai_1.expect)(setChannelsStub.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelSpy.calledOnce).to.be.true;
                (0, chai_1.expect)(promoteChannelArgs).to.deep.equal({
                    channels,
                    channelToMove: newChannel,
                    sort,
                });
                (0, chai_1.expect)(setChannelsStub.args[0][0]).to.deep.equal(Utils.promoteChannel(promoteChannelArgs));
            });
        });
    });
});
