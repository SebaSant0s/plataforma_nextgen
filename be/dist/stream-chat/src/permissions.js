"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltinPermissions = exports.BuiltinRoles = exports.DenyAll = exports.AllowAll = exports.Permission = exports.MinPriority = exports.MaxPriority = exports.AnyRole = exports.AnyResource = exports.Deny = exports.Allow = void 0;
exports.Allow = 'Allow';
exports.Deny = 'Deny';
exports.AnyResource = ['*'];
exports.AnyRole = ['*'];
exports.MaxPriority = 999;
exports.MinPriority = 1;
// deprecated permission object class, you should use the new permission system v2 and use permissions
// defined in BuiltinPermissions to configure your channel types
class Permission {
    constructor(name, priority, resources = exports.AnyResource, roles = exports.AnyRole, owner = false, action = exports.Allow) {
        this.name = name;
        this.action = action;
        this.owner = owner;
        this.priority = priority;
        this.resources = resources;
        this.roles = roles;
    }
}
exports.Permission = Permission;
// deprecated
exports.AllowAll = new Permission('Allow all', exports.MaxPriority, exports.AnyResource, exports.AnyRole, false, exports.Allow);
// deprecated
exports.DenyAll = new Permission('Deny all', exports.MinPriority, exports.AnyResource, exports.AnyRole, false, exports.Deny);
exports.BuiltinRoles = {
    Admin: 'admin',
    Anonymous: 'anonymous',
    ChannelMember: 'channel_member',
    ChannelModerator: 'channel_moderator',
    Guest: 'guest',
    User: 'user',
};
exports.BuiltinPermissions = {
    AddLinks: 'Add Links',
    BanUser: 'Ban User',
    CreateChannel: 'Create Channel',
    CreateMessage: 'Create Message',
    CreateReaction: 'Create Reaction',
    DeleteAnyAttachment: 'Delete Any Attachment',
    DeleteAnyChannel: 'Delete Any Channel',
    DeleteAnyMessage: 'Delete Any Message',
    DeleteAnyReaction: 'Delete Any Reaction',
    DeleteOwnAttachment: 'Delete Own Attachment',
    DeleteOwnChannel: 'Delete Own Channel',
    DeleteOwnMessage: 'Delete Own Message',
    DeleteOwnReaction: 'Delete Own Reaction',
    ReadAnyChannel: 'Read Any Channel',
    ReadOwnChannel: 'Read Own Channel',
    RunMessageAction: 'Run Message Action',
    UpdateAnyChannel: 'Update Any Channel',
    UpdateAnyMessage: 'Update Any Message',
    UpdateMembersAnyChannel: 'Update Members Any Channel',
    UpdateMembersOwnChannel: 'Update Members Own Channel',
    UpdateOwnChannel: 'Update Own Channel',
    UpdateOwnMessage: 'Update Own Message',
    UploadAttachment: 'Upload Attachment',
    UseFrozenChannel: 'Send messages and reactions to frozen channels',
};
