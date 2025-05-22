"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// basic sanity check
const types_1 = require("../../dist/types");
const apiKey = 'apiKey';
let voidReturn;
let voidPromise;
const client = new types_1.StreamChat(apiKey, undefined, {
    timeout: 3000,
    logger: (logLevel, msg, extraData) => { },
});
const clientWithoutSecret = new types_1.StreamChat(apiKey, {
    timeout: 3000,
    logger: (logLevel, msg, extraData) => { },
});
const singletonClient = types_1.StreamChat.getInstance(apiKey);
const singletonClient1 = types_1.StreamChat.getInstance(apiKey);
const singletonClient2 = types_1.StreamChat.getInstance(apiKey, '', {});
const devToken = client.devToken('joshua');
const token = client.createToken('james', 3600);
const authType = client.getAuthType();
voidReturn = client.setBaseURL('https://chat.stream-io-api.com/');
const settingsPromise = client.updateAppSettings({});
const appPromise = client.getAppSettings();
voidPromise = client.disconnectUser();
const updateRequest = {
    id: 'vishal',
    set: {
        name: 'Awesome',
    },
    unset: ['example'],
};
const updateUser = client.partialUpdateUser(updateRequest);
const updateUsers = client.partialUpdateUsers([updateRequest]);
const updateUsersWithSingletonClient = singletonClient.partialUpdateUsers([updateRequest]);
const eventHandler = (event) => { };
voidReturn = client.on(eventHandler);
voidReturn = client.off(eventHandler);
voidReturn = client.on('message.new', eventHandler);
voidReturn = client.off('message.new', eventHandler);
let userReturn;
userReturn = client.connectUser({ id: 'john', phone: 2 }, devToken);
userReturn = client.connectUser({ id: 'john', phone: 2 }, async () => 'token');
userReturn = client.setUser({ id: 'john', phone: 2 }, devToken);
userReturn = client.setUser({ id: 'john', phone: 2 }, async () => 'token');
userReturn = client.connectAnonymousUser();
userReturn = client.setAnonymousUser();
userReturn = client.setGuestUser({ id: 'steven' });
let clientRes;
clientRes = client.get('https://chat.stream-io-api.com/', { id: 2 });
clientRes = client.put('https://chat.stream-io-api.com/', { id: 2 });
clientRes = client.post('https://chat.stream-io-api.com/', { id: 2 });
clientRes = client.patch('https://chat.stream-io-api.com/', { id: 2 });
clientRes = client.delete('https://chat.stream-io-api.com/', { id: 2 });
const file = client.sendFile('aa', 'bb', 'text.jpg', 'image/jpg', { id: 'james' });
const type = 'user.updated';
const event = {
    type,
    cid: 'channelid',
    message: {
        id: 'id',
        text: 'Heloo',
        type: 'system',
        updated_at: '',
        created_at: '',
        html: 'Hello',
    },
    reaction: {
        type: 'like',
        message_id: '',
        user: {
            id: 'john',
        },
        created_at: '',
        updated_at: '',
        score: 10,
    },
    member: { user_id: 'john' },
    user: { id: 'john', online: true },
    unread_count: 3,
    online: true,
};
voidReturn = client.dispatchEvent(event);
voidPromise = client.recoverState();
const channels = client.queryChannels({}, {}, {});
channels.then((response) => {
    const type = response[0].type;
    const cid = response[0].cid;
});
const channel = client.channel('messaging', 'channelName', { color: 'green' });
const channelState = channel.state;
const chUser1 = channelState.members.someUser12433222;
const chUser2 = channelState.members.someUser124332221;
const chUser3 = channelState.read.someUserId.user;
const typing = channelState.typing['someUserId'];
const acceptInvite = channel.acceptInvite({});
voidReturn = channel.on(eventHandler);
voidReturn = channel.off(eventHandler);
voidReturn = channel.on('message.new', eventHandler);
voidReturn = channel.off('message.new', eventHandler);
channel.sendMessage({ text: 'text' }); // send a msg without id
const permissions = [
    new types_1.Permission('Admin users can perform any action', types_1.MaxPriority, types_1.AnyResource, types_1.AnyRole, false, types_1.Allow),
    new types_1.Permission('Anonymous users are not allowed', 500, types_1.AnyResource, ['anonymous'], false, types_1.Deny),
    new types_1.Permission('Users can modify their own messages', 400, types_1.AnyResource, ['user'], true, types_1.Allow),
    new types_1.Permission('Users can create channels', 300, types_1.AnyResource, ['user'], false, types_1.Allow),
    new types_1.Permission('Channel Members', 200, ['ReadChannel', 'CreateMessage'], ['channel_member'], false, types_1.Allow),
    new types_1.Permission('Discard all', 100, types_1.AnyResource, types_1.AnyRole, false, types_1.Deny),
];
client.updateChannelType('messaging', { permissions }).then((response) => {
    const permissions = response.permissions || [];
    const permissionName = permissions[0].name || '';
    const permissionRoles = permissions[0].roles || [];
});
client.queryChannels({
    members: {
        $in: ['vishal'],
    },
    cid: {
        $in: ['messaging:channelid'],
    },
    name: {
        $autocomplete: 'chan',
    },
});
const testChannelUpdate = channel.update({
    ...channel._data,
    name: 'helloWorld',
    color: 'yellow',
});
const testChannelUpdate2 = channel.update({
    ...channel.data,
    name: 'helloWorld2',
    color: 'yellow',
});
// Good
const testChannel1 = client.channel('hello', { color: 'red' });
const testChannel2 = client.channel('hello2', 'myId', { color: 'green' });
const testChannel3 = client.channel('hello3');
const testChannel4 = client.channel('hello4', undefined, { color: 'red ' });
// Bad
// const testChannel5 = client.channel('hello3', { color: 'newColor' }, { color: 'green' });
// TODO: Fix this
// channel.queryMembers({
//   $or: [
//     { name: { $autocomplete: 'Rob' } }, // rob, rob2
//     { banned: true }, // banned
//     { is_moderator: true }, // mod
//     {
//       // invited
//       $and: [
//         { name: { $q: 'Mar' } },
//         { invite: 'accepted' },
//         {
//           $or: [
//             { name: { $autocomplete: 'mar' } },
//             { invite: 'rejected' },
//           ],
//         },
//       ],
//     },
//     {
//       // no match
//       $nor: [
//         {
//           $and: [{ name: { $q: 'Car' } }, { invite: 'accepted' }],
//         },
//       ],
//     },
//   ],
// });
