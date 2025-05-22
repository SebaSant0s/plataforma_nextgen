"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const uuid_1 = require("uuid");
const generateChannel_1 = require("./test-utils/generateChannel");
const generateMessage_1 = require("./test-utils/generateMessage");
const generateThreadResponse_1 = require("./test-utils/generateThreadResponse");
const getClient_1 = require("./test-utils/getClient");
const sinon_1 = __importDefault(require("sinon"));
const src_1 = require("../../src");
const thread_1 = require("../../src/thread");
const TEST_USER_ID = 'observer';
describe('Threads 2.0', () => {
    let client;
    let channelResponse;
    let channel;
    let parentMessageResponse;
    let threadManager;
    function createTestThread({ channelOverrides = {}, parentMessageOverrides = {}, ...overrides } = {}) {
        return new src_1.Thread({
            client,
            threadData: (0, generateThreadResponse_1.generateThreadResponse)({ ...channelResponse, ...channelOverrides }, { ...parentMessageResponse, ...parentMessageOverrides }, overrides),
        });
    }
    beforeEach(() => {
        client = new src_1.StreamChat('apiKey');
        client._setUser({ id: TEST_USER_ID });
        channelResponse = (0, generateChannel_1.generateChannel)({
            channel: { id: (0, uuid_1.v4)(), name: 'Test channel', members: [] },
        }).channel;
        channel = client.channel(channelResponse.type, channelResponse.id);
        parentMessageResponse = (0, generateMessage_1.generateMsg)();
        threadManager = new src_1.ThreadManager({ client });
    });
    describe('Thread', () => {
        it('initializes properly', () => {
            const threadResponse = (0, generateThreadResponse_1.generateThreadResponse)(channelResponse, parentMessageResponse);
            // mimic pre-cached channel with existing members
            channel._hydrateMembers({ members: [{ user: { id: TEST_USER_ID } }] });
            const thread = new src_1.Thread({ client, threadData: threadResponse });
            const state = thread.state.getLatestValue();
            (0, chai_1.expect)(threadResponse.channel.members).to.have.lengthOf(0);
            (0, chai_1.expect)(threadResponse.read).to.have.lengthOf(0);
            (0, chai_1.expect)(state.read).to.have.keys([TEST_USER_ID]);
            (0, chai_1.expect)(thread.channel.state.members).to.have.keys([TEST_USER_ID]);
            (0, chai_1.expect)(thread.id).to.equal(parentMessageResponse.id);
            (0, chai_1.expect)(thread.channel.data?.name).to.equal(channelResponse.name);
        });
        describe('Methods', () => {
            describe('upsertReplyLocally', () => {
                it('prevents inserting a new message that does not belong to the associated thread', () => {
                    const thread = createTestThread();
                    const message = (0, generateMessage_1.generateMsg)();
                    (0, chai_1.expect)(() => thread.upsertReplyLocally({ message })).to.throw();
                });
                it('inserts a new message that belongs to the associated thread', () => {
                    const thread = createTestThread();
                    const message = (0, generateMessage_1.generateMsg)({ parent_id: thread.id });
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.replies).to.have.lengthOf(0);
                    thread.upsertReplyLocally({ message });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(1);
                    (0, chai_1.expect)(stateAfter.replies[0].id).to.equal(message.id);
                });
                it('updates existing message', () => {
                    const message = (0, generateMessage_1.generateMsg)({ parent_id: parentMessageResponse.id, text: 'aaa' });
                    const thread = createTestThread({ latest_replies: [message] });
                    const udpatedMessage = { ...message, text: 'bbb' };
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.replies).to.have.lengthOf(1);
                    (0, chai_1.expect)(stateBefore.replies[0].id).to.equal(message.id);
                    (0, chai_1.expect)(stateBefore.replies[0].text).to.not.equal(udpatedMessage.text);
                    thread.upsertReplyLocally({ message: udpatedMessage });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(1);
                    (0, chai_1.expect)(stateAfter.replies[0].text).to.equal(udpatedMessage.text);
                });
                it('updates optimistically added message', () => {
                    const optimisticMessage = (0, generateMessage_1.generateMsg)({
                        parent_id: parentMessageResponse.id,
                        text: 'aaa',
                        created_at: '2020-01-01T00:00:00Z',
                    });
                    const message = (0, generateMessage_1.generateMsg)({
                        parent_id: parentMessageResponse.id,
                        text: 'bbb',
                        created_at: '2020-01-01T00:00:10Z',
                    });
                    const thread = createTestThread({ latest_replies: [optimisticMessage, message] });
                    const updatedMessage = {
                        ...optimisticMessage,
                        text: 'ccc',
                        created_at: '2020-01-01T00:00:20Z',
                    };
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.replies).to.have.lengthOf(2);
                    (0, chai_1.expect)(stateBefore.replies[0].id).to.equal(optimisticMessage.id);
                    (0, chai_1.expect)(stateBefore.replies[0].text).to.equal('aaa');
                    (0, chai_1.expect)(stateBefore.replies[1].id).to.equal(message.id);
                    thread.upsertReplyLocally({ message: updatedMessage, timestampChanged: true });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(2);
                    (0, chai_1.expect)(stateAfter.replies[0].id).to.equal(message.id);
                    (0, chai_1.expect)(stateAfter.replies[1].id).to.equal(optimisticMessage.id);
                    (0, chai_1.expect)(stateAfter.replies[1].text).to.equal('ccc');
                });
            });
            describe('updateParentMessageLocally', () => {
                it('prevents updating a parent message if the ids do not match', () => {
                    const thread = createTestThread();
                    const message = (0, generateMessage_1.generateMsg)();
                    (0, chai_1.expect)(() => thread.updateParentMessageLocally({ message })).to.throw();
                });
                it('updates parent message and related top-level properties', () => {
                    const thread = createTestThread();
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.deletedAt).to.be.null;
                    (0, chai_1.expect)(stateBefore.replyCount).to.equal(0);
                    (0, chai_1.expect)(stateBefore.parentMessage.text).to.equal(parentMessageResponse.text);
                    const updatedMessage = (0, generateMessage_1.generateMsg)({
                        id: parentMessageResponse.id,
                        text: 'aaa',
                        reply_count: 10,
                        deleted_at: new Date().toISOString(),
                    });
                    thread.updateParentMessageLocally({ message: updatedMessage });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.deletedAt).to.be.not.null;
                    (0, chai_1.expect)(stateAfter.deletedAt.toISOString()).to.equal(updatedMessage.deleted_at);
                    (0, chai_1.expect)(stateAfter.replyCount).to.equal(updatedMessage.reply_count);
                    (0, chai_1.expect)(stateAfter.parentMessage.text).to.equal(updatedMessage.text);
                });
            });
            describe('updateParentMessageOrReplyLocally', () => {
                it('updates reply if the message has a matching parent id', () => {
                    const thread = createTestThread();
                    const message = (0, generateMessage_1.generateMsg)({ parent_id: thread.id });
                    const upsertReplyLocallyStub = sinon_1.default.stub(thread, 'upsertReplyLocally');
                    const updateParentMessageLocallyStub = sinon_1.default.stub(thread, 'updateParentMessageLocally');
                    thread.updateParentMessageOrReplyLocally(message);
                    (0, chai_1.expect)(upsertReplyLocallyStub.called).to.be.true;
                    (0, chai_1.expect)(updateParentMessageLocallyStub.called).to.be.false;
                });
                it('updates parent message if the message has a matching id and is not a reply', () => {
                    const thread = createTestThread();
                    const message = (0, generateMessage_1.generateMsg)({ id: thread.id });
                    const upsertReplyLocallyStub = sinon_1.default.stub(thread, 'upsertReplyLocally');
                    const updateParentMessageLocallyStub = sinon_1.default.stub(thread, 'updateParentMessageLocally');
                    thread.updateParentMessageOrReplyLocally(message);
                    (0, chai_1.expect)(upsertReplyLocallyStub.called).to.be.false;
                    (0, chai_1.expect)(updateParentMessageLocallyStub.called).to.be.true;
                });
                it('does nothing if the message is unrelated to the thread', () => {
                    const thread = createTestThread();
                    const message = (0, generateMessage_1.generateMsg)();
                    const upsertReplyLocallyStub = sinon_1.default.stub(thread, 'upsertReplyLocally');
                    const updateParentMessageLocallyStub = sinon_1.default.stub(thread, 'updateParentMessageLocally');
                    thread.updateParentMessageOrReplyLocally(message);
                    (0, chai_1.expect)(upsertReplyLocallyStub.called).to.be.false;
                    (0, chai_1.expect)(updateParentMessageLocallyStub.called).to.be.false;
                });
            });
            describe('hydrateState', () => {
                it('prevents hydrating state from the instance with a different id', () => {
                    const thread = createTestThread();
                    const otherThread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    (0, chai_1.expect)(thread.id).to.not.equal(otherThread.id);
                    (0, chai_1.expect)(() => thread.hydrateState(otherThread)).to.throw();
                });
                it('copies state of the instance with the same id', () => {
                    const thread = createTestThread();
                    const hydrationThread = createTestThread();
                    thread.hydrateState(hydrationThread);
                    const stateAfter = thread.state.getLatestValue();
                    const hydrationState = hydrationThread.state.getLatestValue();
                    // compare non-primitive values only
                    (0, chai_1.expect)(stateAfter.read).to.equal(hydrationState.read);
                    (0, chai_1.expect)(stateAfter.replies).to.equal(hydrationState.replies);
                    (0, chai_1.expect)(stateAfter.parentMessage).to.equal(hydrationState.parentMessage);
                    (0, chai_1.expect)(stateAfter.participants).to.equal(hydrationState.participants);
                });
                it('retains failed replies after hydration', () => {
                    const thread = createTestThread();
                    const hydrationThread = createTestThread({
                        latest_replies: [(0, generateMessage_1.generateMsg)({ parent_id: parentMessageResponse.id })],
                    });
                    const failedMessage = (0, generateMessage_1.generateMsg)({
                        status: 'failed',
                        parent_id: parentMessageResponse.id,
                    });
                    thread.upsertReplyLocally({ message: failedMessage });
                    thread.hydrateState(hydrationThread);
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(2);
                    (0, chai_1.expect)(stateAfter.replies[1].id).to.equal(failedMessage.id);
                });
            });
            describe('deleteReplyLocally', () => {
                it('deletes appropriate message', () => {
                    const createdAt = new Date().getTime();
                    // five messages "created" second apart
                    const messages = Array.from({ length: 5 }, (_, i) => (0, generateMessage_1.generateMsg)({ created_at: new Date(createdAt + 1000 * i).toISOString() }));
                    const thread = createTestThread({ latest_replies: messages });
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.replies).to.have.lengthOf(5);
                    const messageToDelete = (0, generateMessage_1.generateMsg)({
                        created_at: messages[2].created_at,
                        id: messages[2].id,
                    });
                    thread.deleteReplyLocally({ message: messageToDelete });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.not.equal(stateBefore.replies);
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(4);
                    (0, chai_1.expect)(stateAfter.replies.find((reply) => reply.id === messageToDelete.id)).to.be.undefined;
                });
            });
            describe('markAsRead', () => {
                let stubbedChannelMarkRead;
                beforeEach(() => {
                    stubbedChannelMarkRead = sinon_1.default.stub(channel, 'markRead').resolves();
                });
                it('does nothing if unread count of the current user is zero', async () => {
                    const thread = createTestThread();
                    (0, chai_1.expect)(thread.ownUnreadCount).to.equal(0);
                    await thread.markAsRead();
                    (0, chai_1.expect)(stubbedChannelMarkRead.notCalled).to.be.true;
                });
                it('calls channel.markRead if unread count of the current user is greater than zero', async () => {
                    const thread = createTestThread({
                        read: [
                            {
                                last_read: new Date().toISOString(),
                                user: { id: TEST_USER_ID },
                                unread_messages: 42,
                            },
                        ],
                    });
                    (0, chai_1.expect)(thread.ownUnreadCount).to.equal(42);
                    await thread.markAsRead();
                    (0, chai_1.expect)(stubbedChannelMarkRead.calledOnceWith({ thread_id: thread.id })).to.be.true;
                });
            });
            describe('loadPage', () => {
                it('sets up pagination on initialization (all replies included in response)', () => {
                    const thread = createTestThread({ latest_replies: [(0, generateMessage_1.generateMsg)()], reply_count: 1 });
                    const state = thread.state.getLatestValue();
                    (0, chai_1.expect)(state.pagination.prevCursor).to.be.null;
                    (0, chai_1.expect)(state.pagination.nextCursor).to.be.null;
                });
                it('sets up pagination on initialization (not all replies included in response)', () => {
                    const firstMessage = (0, generateMessage_1.generateMsg)();
                    const lastMessage = (0, generateMessage_1.generateMsg)();
                    const thread = createTestThread({ latest_replies: [firstMessage, lastMessage], reply_count: 3 });
                    const state = thread.state.getLatestValue();
                    (0, chai_1.expect)(state.pagination.prevCursor).not.to.be.null;
                    (0, chai_1.expect)(state.pagination.nextCursor).to.be.null;
                });
                it('updates pagination after loading next page (end reached)', async () => {
                    const thread = createTestThread({
                        latest_replies: [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()],
                        reply_count: 3,
                    });
                    thread.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: 'cursor',
                        },
                    }));
                    sinon_1.default.stub(thread, 'queryReplies').resolves({
                        messages: [(0, generateMessage_1.generateMsg)()],
                        duration: '',
                    });
                    await thread.loadNextPage({ limit: 2 });
                    const state = thread.state.getLatestValue();
                    (0, chai_1.expect)(state.pagination.nextCursor).to.be.null;
                });
                it('updates pagination after loading next page (end not reached)', async () => {
                    const thread = createTestThread({
                        latest_replies: [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()],
                        reply_count: 4,
                    });
                    thread.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: 'cursor',
                        },
                    }));
                    const lastMessage = (0, generateMessage_1.generateMsg)();
                    sinon_1.default.stub(thread, 'queryReplies').resolves({
                        messages: [(0, generateMessage_1.generateMsg)(), lastMessage],
                        duration: '',
                    });
                    await thread.loadNextPage({ limit: 2 });
                    const state = thread.state.getLatestValue();
                    (0, chai_1.expect)(state.pagination.nextCursor).to.equal(lastMessage.id);
                });
                it('forms correct request when loading next page', async () => {
                    const firstMessage = (0, generateMessage_1.generateMsg)();
                    const lastMessage = (0, generateMessage_1.generateMsg)();
                    const thread = createTestThread({ latest_replies: [firstMessage, lastMessage], reply_count: 3 });
                    thread.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: lastMessage.id,
                        },
                    }));
                    const queryRepliesStub = sinon_1.default.stub(thread, 'queryReplies').resolves({ messages: [], duration: '' });
                    await thread.loadNextPage({ limit: 42 });
                    (0, chai_1.expect)(queryRepliesStub.calledOnceWith({
                        id_gt: lastMessage.id,
                        limit: 42,
                    })).to.be.true;
                });
                it('updates pagination after loading previous page (end reached)', async () => {
                    const thread = createTestThread({
                        latest_replies: [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()],
                        reply_count: 3,
                    });
                    sinon_1.default.stub(thread, 'queryReplies').resolves({
                        messages: [(0, generateMessage_1.generateMsg)()],
                        duration: '',
                    });
                    await thread.loadPrevPage({ limit: 2 });
                    const state = thread.state.getLatestValue();
                    (0, chai_1.expect)(state.pagination.prevCursor).to.be.null;
                });
                it('updates pagination after loading previous page (end not reached)', async () => {
                    const thread = createTestThread({
                        latest_replies: [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()],
                        reply_count: 4,
                    });
                    const firstMessage = (0, generateMessage_1.generateMsg)();
                    sinon_1.default.stub(thread, 'queryReplies').resolves({
                        messages: [firstMessage, (0, generateMessage_1.generateMsg)()],
                        duration: '',
                    });
                    await thread.loadPrevPage({ limit: 2 });
                    const state = thread.state.getLatestValue();
                    (0, chai_1.expect)(state.pagination.prevCursor).to.equal(firstMessage.id);
                });
                it('forms correct request when loading previous page', async () => {
                    const firstMessage = (0, generateMessage_1.generateMsg)();
                    const lastMessage = (0, generateMessage_1.generateMsg)();
                    const thread = createTestThread({ latest_replies: [firstMessage, lastMessage], reply_count: 3 });
                    const queryRepliesStub = sinon_1.default.stub(thread, 'queryReplies').resolves({ messages: [], duration: '' });
                    await thread.loadPrevPage({ limit: 42 });
                    (0, chai_1.expect)(queryRepliesStub.calledOnceWith({
                        id_lt: firstMessage.id,
                        limit: 42,
                    })).to.be.true;
                });
                it('appends messages when loading next page', async () => {
                    const initialMessages = [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()];
                    const nextMessages = [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()];
                    const thread = createTestThread({ latest_replies: initialMessages, reply_count: 4 });
                    thread.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: initialMessages[1].id,
                        },
                    }));
                    sinon_1.default.stub(thread, 'queryReplies').resolves({ messages: nextMessages, duration: '' });
                    await thread.loadNextPage({ limit: 2 });
                    const stateAfter = thread.state.getLatestValue();
                    const expectedMessageOrder = [...initialMessages, ...nextMessages].map(({ id }) => id).join(', ');
                    const actualMessageOrder = stateAfter.replies.map(({ id }) => id).join(', ');
                    (0, chai_1.expect)(actualMessageOrder).to.equal(expectedMessageOrder);
                });
                it('prepends messages when loading previous page', async () => {
                    const initialMessages = [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()];
                    const prevMessages = [(0, generateMessage_1.generateMsg)(), (0, generateMessage_1.generateMsg)()];
                    const thread = createTestThread({ latest_replies: initialMessages, reply_count: 4 });
                    sinon_1.default.stub(thread, 'queryReplies').resolves({ messages: prevMessages, duration: '' });
                    await thread.loadPrevPage({ limit: 2 });
                    const stateAfter = thread.state.getLatestValue();
                    const expectedMessageOrder = [...prevMessages, ...initialMessages].map(({ id }) => id).join(', ');
                    const actualMessageOrder = stateAfter.replies.map(({ id }) => id).join(', ');
                    (0, chai_1.expect)(actualMessageOrder).to.equal(expectedMessageOrder);
                });
            });
        });
        describe('Subscription and Event Handlers', () => {
            it('marks active channel as read', () => {
                const clock = sinon_1.default.useFakeTimers();
                const thread = createTestThread({
                    read: [
                        {
                            last_read: new Date().toISOString(),
                            user: { id: TEST_USER_ID },
                            unread_messages: 42,
                        },
                    ],
                });
                thread.registerSubscriptions();
                const stateBefore = thread.state.getLatestValue();
                const stubbedMarkAsRead = sinon_1.default.stub(thread, 'markAsRead').resolves();
                (0, chai_1.expect)(stateBefore.active).to.be.false;
                (0, chai_1.expect)(thread.ownUnreadCount).to.equal(42);
                (0, chai_1.expect)(stubbedMarkAsRead.called).to.be.false;
                thread.activate();
                clock.runAll();
                const stateAfter = thread.state.getLatestValue();
                (0, chai_1.expect)(stateAfter.active).to.be.true;
                (0, chai_1.expect)(stubbedMarkAsRead.calledOnce).to.be.true;
                client.dispatchEvent({
                    type: 'message.new',
                    message: (0, generateMessage_1.generateMsg)({ parent_id: thread.id, user: { id: 'bob' } }),
                    user: { id: 'bob' },
                });
                clock.runAll();
                (0, chai_1.expect)(stubbedMarkAsRead.calledTwice).to.be.true;
                thread.unregisterSubscriptions();
                clock.restore();
            });
            it('reloads stale state when thread is active', async () => {
                const thread = createTestThread();
                thread.registerSubscriptions();
                const stateBefore = thread.state.getLatestValue();
                const stubbedGetThread = sinon_1.default
                    .stub(client, 'getThread')
                    .resolves(createTestThread({ latest_replies: [(0, generateMessage_1.generateMsg)()] }));
                thread.state.partialNext({ isStateStale: true });
                (0, chai_1.expect)(thread.hasStaleState).to.be.true;
                (0, chai_1.expect)(stubbedGetThread.called).to.be.false;
                thread.activate();
                (0, chai_1.expect)(stubbedGetThread.calledOnce).to.be.true;
                await stubbedGetThread.firstCall.returnValue;
                const stateAfter = thread.state.getLatestValue();
                (0, chai_1.expect)(stateAfter.replies).not.to.equal(stateBefore.replies);
                thread.unregisterSubscriptions();
            });
            describe('Event: thread.updated', () => {
                it('ignores incoming event if the data do not match (parent_message_id)', () => {
                    const thread = createTestThread({ title: 'A' });
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.title).to.eq('A');
                    client.dispatchEvent({
                        type: 'thread.updated',
                        thread: (0, generateThreadResponse_1.generateThreadResponse)(channelResponse, (0, generateMessage_1.generateMsg)(), { title: 'B' }),
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.title).to.eq('A');
                });
                it('correctly updates thread-level properties', () => {
                    const thread = createTestThread({ title: 'A' });
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.title).to.eq('A');
                    client.dispatchEvent({
                        type: 'thread.updated',
                        thread: (0, generateThreadResponse_1.generateThreadResponse)(channelResponse, (0, generateMessage_1.generateMsg)({ id: parentMessageResponse.id }), {
                            title: 'B',
                        }),
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.title).to.eq('B');
                });
                it('properly handles custom data', () => {
                    const customKey1 = (0, uuid_1.v4)();
                    const customKey2 = (0, uuid_1.v4)();
                    const thread = createTestThread({ [customKey1]: 1, [customKey2]: { key: 1 } });
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.custom).to.not.have.keys(Object.keys(thread_1.THREAD_RESPONSE_RESERVED_KEYS));
                    (0, chai_1.expect)(stateBefore.custom).to.have.keys([customKey1, customKey2]);
                    (0, chai_1.expect)(stateBefore.custom[customKey1]).to.equal(1);
                    client.dispatchEvent({
                        type: 'thread.updated',
                        thread: (0, generateThreadResponse_1.generateThreadResponse)(channelResponse, (0, generateMessage_1.generateMsg)({ id: parentMessageResponse.id }), {
                            [customKey1]: 2,
                        }),
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.custom).to.not.have.keys(Object.keys(thread_1.THREAD_RESPONSE_RESERVED_KEYS));
                    (0, chai_1.expect)(stateAfter.custom).to.not.have.property(customKey2);
                    (0, chai_1.expect)(stateAfter.custom[customKey1]).to.equal(2);
                });
            });
            describe('Event: user.watching.stop', () => {
                it('ignores incoming event if the data do not match (channel or user.id)', () => {
                    const thread = createTestThread();
                    thread.registerSubscriptions();
                    client.dispatchEvent({
                        type: 'user.watching.stop',
                        channel: channelResponse,
                        user: { id: 'bob' },
                    });
                    (0, chai_1.expect)(thread.hasStaleState).to.be.false;
                    client.dispatchEvent({
                        type: 'user.watching.stop',
                        channel: (0, generateChannel_1.generateChannel)().channel,
                        user: { id: TEST_USER_ID },
                    });
                    (0, chai_1.expect)(thread.hasStaleState).to.be.false;
                    thread.unregisterSubscriptions();
                });
                it('marks own state as stale whenever current user stops watching associated channel', () => {
                    const thread = createTestThread();
                    thread.registerSubscriptions();
                    client.dispatchEvent({
                        type: 'user.watching.stop',
                        channel: channelResponse,
                        user: { id: TEST_USER_ID },
                    });
                    (0, chai_1.expect)(thread.hasStaleState).to.be.true;
                    thread.unregisterSubscriptions();
                });
            });
            describe('Event: message.read', () => {
                it('does not update read state with events from other threads', () => {
                    const thread = createTestThread({
                        read: [
                            {
                                last_read: new Date().toISOString(),
                                user: { id: 'bob' },
                                unread_messages: 42,
                            },
                        ],
                    });
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.read['bob']?.unreadMessageCount).to.equal(42);
                    client.dispatchEvent({
                        type: 'message.read',
                        user: { id: 'bob' },
                        thread: (0, generateThreadResponse_1.generateThreadResponse)(channelResponse, (0, generateMessage_1.generateMsg)()),
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.read['bob']?.unreadMessageCount).to.equal(42);
                });
                it('correctly updates read information for user', () => {
                    const lastReadAt = new Date();
                    const thread = createTestThread({
                        read: [
                            {
                                last_read: lastReadAt.toISOString(),
                                last_read_message_id: '',
                                unread_messages: 42,
                                user: { id: 'bob' },
                            },
                        ],
                    });
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.read['bob']?.unreadMessageCount).to.equal(42);
                    const createdAt = new Date();
                    client.dispatchEvent({
                        type: 'message.read',
                        user: { id: 'bob' },
                        thread: (0, generateThreadResponse_1.generateThreadResponse)(channelResponse, (0, generateMessage_1.generateMsg)({ id: parentMessageResponse.id })),
                        created_at: createdAt.toISOString(),
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.read['bob']?.unreadMessageCount).to.equal(0);
                    (0, chai_1.expect)(stateAfter.read['bob']?.lastReadAt.toISOString()).to.equal(createdAt.toISOString());
                    thread.unregisterSubscriptions();
                });
            });
            describe('Event: message.new', () => {
                it('ignores a reply if it does not belong to the associated thread', () => {
                    const thread = createTestThread();
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    client.dispatchEvent({
                        type: 'message.new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: (0, uuid_1.v4)() }),
                        user: { id: TEST_USER_ID },
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore).to.equal(stateAfter);
                    thread.unregisterSubscriptions();
                });
                it('prevents handling a reply if the state of the thread is stale', () => {
                    const thread = createTestThread();
                    thread.registerSubscriptions();
                    thread.state.partialNext({ isStateStale: true });
                    const stateBefore = thread.state.getLatestValue();
                    client.dispatchEvent({
                        type: 'message.new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: (0, uuid_1.v4)() }),
                        user: { id: TEST_USER_ID },
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore).to.equal(stateAfter);
                    thread.unregisterSubscriptions();
                });
                it('increments unread count if the reply does not belong to current user', () => {
                    const thread = createTestThread({
                        read: [
                            {
                                last_read: new Date().toISOString(),
                                user: { id: TEST_USER_ID },
                                unread_messages: 0,
                            },
                        ],
                    });
                    thread.registerSubscriptions();
                    const newMessage = (0, generateMessage_1.generateMsg)({ parent_id: thread.id, user: { id: 'bob' } });
                    client.dispatchEvent({
                        type: 'message.new',
                        message: newMessage,
                        user: { id: 'bob' },
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.length(1);
                    (0, chai_1.expect)(stateAfter.replies.find((reply) => reply.id === newMessage.id)).not.to.be.undefined;
                    (0, chai_1.expect)(thread.ownUnreadCount).to.equal(1);
                    thread.unregisterSubscriptions();
                });
                it('handles receiving a reply that was previously optimistically added', () => {
                    const thread = createTestThread({
                        latest_replies: [(0, generateMessage_1.generateMsg)()],
                        read: [
                            {
                                user: { id: TEST_USER_ID },
                                last_read: new Date().toISOString(),
                                unread_messages: 0,
                            },
                        ],
                    });
                    const message = (0, generateMessage_1.generateMsg)({
                        parent_id: thread.id,
                        user: { id: TEST_USER_ID },
                    });
                    thread.upsertReplyLocally({ message });
                    const stateBefore = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.replies).to.have.length(2);
                    (0, chai_1.expect)(thread.ownUnreadCount).to.equal(0);
                    client.dispatchEvent({
                        type: 'message.new',
                        message,
                        user: { id: TEST_USER_ID },
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.length(2);
                    (0, chai_1.expect)(thread.ownUnreadCount).to.equal(0);
                });
            });
            it('resets unread count when new message is by the current user', () => {
                const thread = createTestThread({
                    read: [
                        {
                            last_read: new Date().toISOString(),
                            user: { id: TEST_USER_ID },
                            unread_messages: 42,
                        },
                    ],
                });
                thread.registerSubscriptions();
                (0, chai_1.expect)(thread.ownUnreadCount).to.equal(42);
                client.dispatchEvent({
                    type: 'message.new',
                    message: (0, generateMessage_1.generateMsg)({
                        parent_id: thread.id,
                        user: { id: TEST_USER_ID },
                    }),
                    user: { id: TEST_USER_ID },
                });
                (0, chai_1.expect)(thread.ownUnreadCount).to.equal(0);
                thread.unregisterSubscriptions();
            });
            it('does not increment unread count in an active thread', () => {
                const thread = createTestThread({
                    read: [
                        {
                            last_read: new Date().toISOString(),
                            user: { id: TEST_USER_ID },
                            unread_messages: 0,
                        },
                    ],
                });
                thread.registerSubscriptions();
                thread.activate();
                client.dispatchEvent({
                    type: 'message.new',
                    message: (0, generateMessage_1.generateMsg)({
                        parent_id: thread.id,
                        user: { id: 'bob' },
                    }),
                    user: { id: 'bob' },
                });
                (0, chai_1.expect)(thread.ownUnreadCount).to.equal(0);
                thread.unregisterSubscriptions();
            });
            describe('Event: message.deleted', () => {
                it('deletes reply from local store if it was hard-deleted', () => {
                    const createdAt = new Date().getTime();
                    // five messages "created" second apart
                    const messages = Array.from({ length: 5 }, (_, i) => (0, generateMessage_1.generateMsg)({
                        parent_id: parentMessageResponse.id,
                        created_at: new Date(createdAt + 1000 * i).toISOString(),
                    }));
                    const thread = createTestThread({ latest_replies: messages });
                    thread.registerSubscriptions();
                    const messageToDelete = messages[2];
                    client.dispatchEvent({
                        type: 'message.deleted',
                        hard_delete: true,
                        message: messageToDelete,
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(4);
                    (0, chai_1.expect)(stateAfter.replies.find((reply) => reply.id === messageToDelete.id)).to.be.undefined;
                    thread.unregisterSubscriptions();
                });
                it('updates deleted_at property of the reply if it was soft deleted', () => {
                    const createdAt = new Date().getTime();
                    // five messages "created" second apart
                    const messages = Array.from({ length: 5 }, (_, i) => (0, generateMessage_1.generateMsg)({
                        parent_id: parentMessageResponse.id,
                        created_at: new Date(createdAt + 1000 * i).toISOString(),
                    }));
                    const thread = createTestThread({ latest_replies: messages });
                    thread.registerSubscriptions();
                    const messageToDelete = messages[2];
                    (0, chai_1.expect)(messageToDelete.deleted_at).to.be.undefined;
                    const deletedAt = new Date();
                    client.dispatchEvent({
                        type: 'message.deleted',
                        message: { ...messageToDelete, type: 'deleted', deleted_at: deletedAt.toISOString() },
                    });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.replies).to.have.lengthOf(5);
                    (0, chai_1.expect)(stateAfter.replies[2].id).to.equal(messageToDelete.id);
                    (0, chai_1.expect)(stateAfter.replies[2]).to.not.equal(messageToDelete);
                    (0, chai_1.expect)(stateAfter.replies[2].deleted_at).to.be.a('date');
                    (0, chai_1.expect)(stateAfter.replies[2].deleted_at.toISOString()).to.equal(deletedAt.toISOString());
                    (0, chai_1.expect)(stateAfter.replies[2].type).to.equal('deleted');
                    thread.unregisterSubscriptions();
                });
                it('handles deletion of the thread (updates deleted_at and parentMessage properties)', () => {
                    const thread = createTestThread();
                    thread.registerSubscriptions();
                    const stateBefore = thread.state.getLatestValue();
                    const parentMessage = (0, generateMessage_1.generateMsg)({
                        id: thread.id,
                        deleted_at: new Date().toISOString(),
                        type: 'deleted',
                    });
                    (0, chai_1.expect)(thread.id).to.equal(parentMessage.id);
                    (0, chai_1.expect)(stateBefore.deletedAt).to.be.null;
                    client.dispatchEvent({ type: 'message.deleted', message: parentMessage });
                    const stateAfter = thread.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.deletedAt).to.be.a('date');
                    (0, chai_1.expect)(stateAfter.deletedAt.toISOString()).to.equal(parentMessage.deleted_at);
                    (0, chai_1.expect)(stateAfter.parentMessage.deleted_at).to.be.a('date');
                    (0, chai_1.expect)(stateAfter.parentMessage.deleted_at.toISOString()).to.equal(parentMessage.deleted_at);
                });
            });
            describe('Events: message.updated, reaction.new, reaction.deleted', () => {
                ['message.updated', 'reaction.new', 'reaction.deleted', 'reaction.updated'].forEach((eventType) => {
                    it(`updates reply or parent message on "${eventType}"`, () => {
                        const thread = createTestThread();
                        const updateParentMessageOrReplyLocallySpy = sinon_1.default.spy(thread, 'updateParentMessageOrReplyLocally');
                        thread.registerSubscriptions();
                        client.dispatchEvent({
                            type: eventType,
                            message: (0, generateMessage_1.generateMsg)({ parent_id: thread.id }),
                        });
                        (0, chai_1.expect)(updateParentMessageOrReplyLocallySpy.calledOnce).to.be.true;
                        thread.unregisterSubscriptions();
                    });
                });
            });
        });
    });
    describe('ThreadManager', () => {
        it('initializes properly', () => {
            const state = threadManager.state.getLatestValue();
            (0, chai_1.expect)(state.threads).to.be.empty;
            (0, chai_1.expect)(state.unseenThreadIds).to.be.empty;
            (0, chai_1.expect)(state.pagination.isLoading).to.be.false;
            (0, chai_1.expect)(state.pagination.nextCursor).to.be.null;
        });
        describe('resetState', () => {
            it('resets the state properly', async () => {
                threadManager.state.partialNext({
                    threads: [createTestThread(), createTestThread()],
                    unseenThreadIds: ['1', '2'],
                });
                threadManager.registerSubscriptions();
                (0, chai_1.expect)(threadManager.state.getLatestValue().threads).to.have.lengthOf(2);
                (0, chai_1.expect)(threadManager.state.getLatestValue().unseenThreadIds).to.have.lengthOf(2);
                threadManager.resetState();
                (0, chai_1.expect)(threadManager.state.getLatestValue()).to.be.deep.equal(src_1.THREAD_MANAGER_INITIAL_STATE);
            });
        });
        it('resets the thread state on disconnect', async () => {
            const clientWithUser = await (0, getClient_1.getClientWithUser)({ id: 'user1' });
            const thread = createTestThread();
            clientWithUser.threads.state.partialNext({ ready: true, threads: [thread] });
            clientWithUser.threads.registerSubscriptions();
            const { threads, unseenThreadIds } = clientWithUser.threads.state.getLatestValue();
            (0, chai_1.expect)(threads).to.deep.equal([thread]);
            (0, chai_1.expect)(unseenThreadIds.length).to.equal(0);
            await clientWithUser.disconnectUser();
            (0, chai_1.expect)(clientWithUser.threads.state.getLatestValue().threads).to.have.lengthOf(0);
            (0, chai_1.expect)(clientWithUser.threads.state.getLatestValue().unseenThreadIds).to.have.lengthOf(0);
        });
        describe('Subscription and Event Handlers', () => {
            beforeEach(() => {
                threadManager.registerSubscriptions();
            });
            afterEach(() => {
                threadManager.unregisterSubscriptions();
                sinon_1.default.restore();
            });
            [
                ['health.check', 2],
                ['notification.mark_read', 1],
                ['notification.thread_message_new', 8],
                ['notification.channel_deleted', 11],
            ].forEach(([eventType, expectedUnreadCount]) => {
                it(`updates unread thread count on "${eventType}"`, () => {
                    client.dispatchEvent({
                        type: eventType,
                        unread_threads: expectedUnreadCount,
                    });
                    const { unreadThreadCount } = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(unreadThreadCount).to.equal(expectedUnreadCount);
                });
            });
            it('removes threads from the state if their channel got deleted', () => {
                const thread = createTestThread();
                const toBeRemoved = [
                    createTestThread({ channelOverrides: { id: 'channel1' } }),
                    createTestThread({ channelOverrides: { id: 'channel1' } }),
                    createTestThread({ channelOverrides: { id: 'channel2' } }),
                ];
                threadManager.state.partialNext({ threads: [thread, ...toBeRemoved] });
                (0, chai_1.expect)(threadManager.state.getLatestValue().threads).to.have.lengthOf(4);
                client.dispatchEvent({
                    type: 'notification.channel_deleted',
                    cid: 'messaging:channel1',
                });
                client.dispatchEvent({
                    type: 'notification.channel_deleted',
                    cid: 'messaging:channel2',
                });
                (0, chai_1.expect)(threadManager.state.getLatestValue().threads).to.deep.equal([thread]);
            });
            describe('Event: notification.thread_message_new', () => {
                it('ignores notification.thread_message_new before anything was loaded', () => {
                    client.dispatchEvent({
                        type: 'notification.thread_message_new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: (0, uuid_1.v4)() }),
                    });
                    (0, chai_1.expect)(threadManager.state.getLatestValue().unseenThreadIds).to.be.empty;
                });
                it('tracks new unseen threads', () => {
                    threadManager.state.partialNext({ ready: true });
                    client.dispatchEvent({
                        type: 'notification.thread_message_new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: (0, uuid_1.v4)() }),
                    });
                    (0, chai_1.expect)(threadManager.state.getLatestValue().unseenThreadIds).to.have.lengthOf(1);
                });
                it('deduplicates unseen threads', () => {
                    threadManager.state.partialNext({ ready: true });
                    const parentMessageId = (0, uuid_1.v4)();
                    client.dispatchEvent({
                        received_at: new Date().toISOString(),
                        type: 'notification.thread_message_new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: parentMessageId }),
                    });
                    client.dispatchEvent({
                        received_at: new Date().toISOString(),
                        type: 'notification.thread_message_new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: parentMessageId }),
                    });
                    (0, chai_1.expect)(threadManager.state.getLatestValue().unseenThreadIds).to.have.lengthOf(1);
                });
                it('tracks thread order becoming stale', () => {
                    const thread = createTestThread();
                    threadManager.state.partialNext({
                        threads: [thread],
                        ready: true,
                    });
                    const stateBefore = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.isThreadOrderStale).to.be.false;
                    (0, chai_1.expect)(stateBefore.unseenThreadIds).to.be.empty;
                    client.dispatchEvent({
                        received_at: new Date().toISOString(),
                        type: 'notification.thread_message_new',
                        message: (0, generateMessage_1.generateMsg)({ parent_id: thread.id }),
                    });
                    const stateAfter = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.isThreadOrderStale).to.be.true;
                    (0, chai_1.expect)(stateAfter.unseenThreadIds).to.be.empty;
                });
            });
            it('reloads after connection drop', () => {
                const thread = createTestThread();
                threadManager.state.partialNext({ threads: [thread] });
                threadManager.registerSubscriptions();
                const stub = sinon_1.default.stub(client, 'queryThreads').resolves({
                    threads: [],
                    next: undefined,
                });
                const clock = sinon_1.default.useFakeTimers();
                client.dispatchEvent({
                    type: 'connection.changed',
                    online: false,
                });
                const { lastConnectionDropAt } = threadManager.state.getLatestValue();
                (0, chai_1.expect)(lastConnectionDropAt).to.be.a('date');
                client.dispatchEvent({ type: 'connection.recovered' });
                clock.runAll();
                (0, chai_1.expect)(stub.calledOnce).to.be.true;
                threadManager.unregisterSubscriptions();
                clock.restore();
            });
            it('reloads list on activation', () => {
                const stub = sinon_1.default.stub(threadManager, 'reload').resolves();
                threadManager.activate();
                (0, chai_1.expect)(stub.called).to.be.true;
            });
            it('manages subscriptions when threads are added to and removed from the list', () => {
                const createTestThreadAndSpySubscriptions = () => {
                    const thread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const registerSubscriptionsSpy = sinon_1.default.spy(thread, 'registerSubscriptions');
                    const unregisterSubscriptionsSpy = sinon_1.default.spy(thread, 'unregisterSubscriptions');
                    return [thread, registerSubscriptionsSpy, unregisterSubscriptionsSpy];
                };
                const [thread1, registerThread1, unregisterThread1] = createTestThreadAndSpySubscriptions();
                const [thread2, registerThread2, unregisterThread2] = createTestThreadAndSpySubscriptions();
                const [thread3, registerThread3, unregisterThread3] = createTestThreadAndSpySubscriptions();
                threadManager.state.partialNext({
                    threads: [thread1, thread2],
                });
                (0, chai_1.expect)(registerThread1.calledOnce).to.be.true;
                (0, chai_1.expect)(registerThread2.calledOnce).to.be.true;
                threadManager.state.partialNext({
                    threads: [thread2, thread3],
                });
                (0, chai_1.expect)(unregisterThread1.calledOnce).to.be.true;
                (0, chai_1.expect)(registerThread3.calledOnce).to.be.true;
                threadManager.unregisterSubscriptions();
                (0, chai_1.expect)(unregisterThread1.calledOnce).to.be.true;
                (0, chai_1.expect)(unregisterThread2.calledOnce).to.be.true;
                (0, chai_1.expect)(unregisterThread3.calledOnce).to.be.true;
            });
        });
        describe('Methods & Getters', () => {
            let stubbedQueryThreads;
            beforeEach(() => {
                stubbedQueryThreads = sinon_1.default.stub(client, 'queryThreads').resolves({
                    threads: [],
                    next: undefined,
                });
            });
            describe('threadsById', () => {
                it('lazily generates & re-generates a proper lookup table', () => {
                    const thread1 = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const thread2 = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const thread3 = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    (0, chai_1.expect)(threadManager.threadsById).to.be.empty;
                    threadManager.state.partialNext({ threads: [thread1, thread2] });
                    const state1 = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(state1.threads).to.have.lengthOf(2);
                    (0, chai_1.expect)(Object.keys(threadManager.threadsById)).to.have.lengthOf(2);
                    (0, chai_1.expect)(threadManager.threadsById).to.have.keys(thread1.id, thread2.id);
                    threadManager.state.partialNext({ threads: [thread3] });
                    const state2 = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(state2.threads).to.have.lengthOf(1);
                    (0, chai_1.expect)(Object.keys(threadManager.threadsById)).to.have.lengthOf(1);
                    (0, chai_1.expect)(threadManager.threadsById).to.have.keys(thread3.id);
                    (0, chai_1.expect)(threadManager.threadsById[thread3.id]).to.equal(thread3);
                });
            });
            describe('registerSubscriptions', () => {
                it('properly initiates unreadThreadCount on subscribeUnreadThreadsCountChange call', () => {
                    client._setUser({ id: TEST_USER_ID, unread_threads: 4 });
                    const stateBefore = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(stateBefore.unreadThreadCount).to.equal(0);
                    threadManager.registerSubscriptions();
                    const stateAfter = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(stateAfter.unreadThreadCount).to.equal(4);
                });
            });
            describe('reload', () => {
                it('reloads with a default limit if both threads and unseenThreadIds are empty', async () => {
                    threadManager.state.partialNext({
                        threads: [],
                        unseenThreadIds: [],
                    });
                    await threadManager.reload();
                    (0, chai_1.expect)(stubbedQueryThreads.calledWithMatch({ limit: 25 })).to.be.true;
                });
                it('skips reload if there were no updates since the latest reload', async () => {
                    threadManager.state.partialNext({ ready: true });
                    await threadManager.reload();
                    (0, chai_1.expect)(stubbedQueryThreads.notCalled).to.be.true;
                });
                it('reloads if thread list order is stale', async () => {
                    threadManager.state.partialNext({ isThreadOrderStale: true });
                    await threadManager.reload();
                    (0, chai_1.expect)(threadManager.state.getLatestValue().isThreadOrderStale).to.be.false;
                    (0, chai_1.expect)(stubbedQueryThreads.calledOnce).to.be.true;
                });
                it('reloads if there are new unseen threads', async () => {
                    threadManager.state.partialNext({ unseenThreadIds: [(0, uuid_1.v4)()] });
                    await threadManager.reload();
                    (0, chai_1.expect)(threadManager.state.getLatestValue().unseenThreadIds).to.be.empty;
                    (0, chai_1.expect)(stubbedQueryThreads.calledOnce).to.be.true;
                });
                it('picks correct limit when reloading', async () => {
                    threadManager.state.partialNext({
                        threads: [createTestThread()],
                        unseenThreadIds: [(0, uuid_1.v4)()],
                    });
                    await threadManager.reload();
                    (0, chai_1.expect)(stubbedQueryThreads.calledWithMatch({ limit: 2 })).to.be.true;
                });
                it('adds new thread instances to the list', async () => {
                    const thread = createTestThread();
                    threadManager.state.partialNext({ unseenThreadIds: [thread.id] });
                    stubbedQueryThreads.resolves({
                        threads: [thread],
                        next: undefined,
                    });
                    await threadManager.reload();
                    const { threads, unseenThreadIds } = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(threads).to.contain(thread);
                    (0, chai_1.expect)(unseenThreadIds).to.be.empty;
                });
                it('reuses existing thread instances', async () => {
                    const existingThread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const newThread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    threadManager.state.partialNext({ threads: [existingThread], unseenThreadIds: [newThread.id] });
                    stubbedQueryThreads.resolves({
                        threads: [newThread, existingThread],
                        next: undefined,
                    });
                    await threadManager.reload();
                    const { threads } = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(threads[0]).to.equal(newThread);
                    (0, chai_1.expect)(threads[1]).to.equal(existingThread);
                });
                it('hydrates existing stale threads when reloading', async () => {
                    const existingThread = createTestThread();
                    existingThread.state.partialNext({ isStateStale: true });
                    const newThread = createTestThread({
                        thread_participants: [{ user_id: 'u1' }],
                    });
                    threadManager.state.partialNext({
                        threads: [existingThread],
                        unseenThreadIds: [newThread.id],
                    });
                    stubbedQueryThreads.resolves({
                        threads: [newThread],
                        next: undefined,
                    });
                    await threadManager.reload();
                    const { threads } = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(threads).to.have.lengthOf(1);
                    (0, chai_1.expect)(threads).to.contain(existingThread);
                    (0, chai_1.expect)(existingThread.state.getLatestValue().participants).to.have.lengthOf(1);
                });
                it('reorders threads according to the response order', async () => {
                    const existingThread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const newThread1 = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const newThread2 = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    threadManager.state.partialNext({
                        threads: [existingThread],
                        unseenThreadIds: [newThread1.id, newThread2.id],
                    });
                    stubbedQueryThreads.resolves({
                        threads: [newThread1, existingThread, newThread2],
                        next: undefined,
                    });
                    await threadManager.reload();
                    const { threads } = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(threads[1]).to.equal(existingThread);
                });
            });
            describe('loadNextPage', () => {
                it('does nothing if there is no next page to load', async () => {
                    threadManager.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: null,
                        },
                    }));
                    await threadManager.loadNextPage();
                    (0, chai_1.expect)(stubbedQueryThreads.called).to.be.false;
                });
                it('prevents loading next page if already loading', async () => {
                    threadManager.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            isLoadingNext: true,
                            nextCursor: 'cursor',
                        },
                    }));
                    await threadManager.loadNextPage();
                    (0, chai_1.expect)(stubbedQueryThreads.called).to.be.false;
                });
                it('forms correct request when loading next page', async () => {
                    threadManager.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: 'cursor',
                        },
                    }));
                    stubbedQueryThreads.resolves({
                        threads: [],
                        next: undefined,
                    });
                    await threadManager.loadNextPage();
                    (0, chai_1.expect)(stubbedQueryThreads.calledWithMatch({
                        limit: 25,
                        participant_limit: 10,
                        reply_limit: 10,
                        next: 'cursor',
                        watch: true,
                    })).to.be.true;
                });
                it('switches loading state properly', async () => {
                    threadManager.state.next((current) => ({
                        ...current,
                        pagination: {
                            ...current.pagination,
                            nextCursor: 'cursor',
                        },
                    }));
                    const spy = sinon_1.default.spy();
                    threadManager.state.subscribeWithSelector((nextValue) => ({ isLoadingNext: nextValue.pagination.isLoadingNext }), spy);
                    spy.resetHistory();
                    await threadManager.loadNextPage();
                    (0, chai_1.expect)(spy.callCount).to.equal(2);
                    (0, chai_1.expect)(spy.firstCall.calledWith({ isLoadingNext: true })).to.be.true;
                    (0, chai_1.expect)(spy.lastCall.calledWith({ isLoadingNext: false })).to.be.true;
                });
                it('updates thread list and pagination', async () => {
                    const existingThread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    const newThread = createTestThread({ parentMessageOverrides: { id: (0, uuid_1.v4)() } });
                    threadManager.state.next((current) => ({
                        ...current,
                        threads: [existingThread],
                        pagination: {
                            ...current.pagination,
                            nextCursor: 'cursor1',
                        },
                    }));
                    stubbedQueryThreads.resolves({
                        threads: [newThread],
                        next: 'cursor2',
                    });
                    await threadManager.loadNextPage();
                    const { threads, pagination } = threadManager.state.getLatestValue();
                    (0, chai_1.expect)(threads).to.have.lengthOf(2);
                    (0, chai_1.expect)(threads[1]).to.equal(newThread);
                    (0, chai_1.expect)(pagination.nextCursor).to.equal('cursor2');
                });
            });
        });
    });
});
