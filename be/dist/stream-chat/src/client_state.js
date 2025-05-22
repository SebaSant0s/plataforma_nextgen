"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientState = void 0;
/**
 * ClientState - A container class for the client state.
 */
class ClientState {
    constructor({ client }) {
        // show the status for a certain user...
        // ie online, offline etc
        this.client = client;
        this.users = {};
        // store which channels contain references to the specified user...
        this.userChannelReferences = {};
    }
    updateUsers(users) {
        for (const user of users) {
            this.updateUser(user);
        }
    }
    updateUser(user) {
        if (user != null && this.client._cacheEnabled()) {
            this.users[user.id] = user;
        }
    }
    updateUserReference(user, channelID) {
        if (user == null || !this.client._cacheEnabled()) {
            return;
        }
        this.updateUser(user);
        if (!this.userChannelReferences[user.id]) {
            this.userChannelReferences[user.id] = {};
        }
        this.userChannelReferences[user.id][channelID] = true;
    }
    deleteAllChannelReference(channelID) {
        for (const userID in this.userChannelReferences) {
            delete this.userChannelReferences[userID][channelID];
        }
    }
}
exports.ClientState = ClientState;
