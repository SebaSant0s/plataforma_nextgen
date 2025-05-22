"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
//
// 1) “queryChannels” list endpoint
//
router.post('/channels', async (req, res) => {
    const start = Date.now();
    try {
        const { filter_conditions = {}, message_limit = 25 } = req.body;
        // build Prisma where
        const where = {};
        if (filter_conditions.cid?.['$eq'])
            where.cid = filter_conditions.cid['$eq'];
        if (filter_conditions.id?.['$eq'])
            where.id = filter_conditions.id['$eq'];
        if (filter_conditions.type?.['$eq'])
            where.type = filter_conditions.type['$eq'];
        const dbChannels = await prisma.chat_channels.findMany({ where });
        const channels = await Promise.all(dbChannels.map(async (ch) => {
            // load last N messages
            const dbMessages = await prisma.chat_messages.findMany({
                where: { cid: ch.cid },
                orderBy: { created_at: 'desc' },
                take: message_limit,
            });
            // map to MessageResponseBase
            const messages = dbMessages
                .reverse()
                .map(m => ({
                id: m.id,
                text: m.text,
                html: m.html,
                type: m.type,
                user: m.user,
                attachments: m.attachments,
                latest_reactions: m.latest_reactions,
                own_reactions: m.own_reactions,
                reaction_counts: m.reaction_counts,
                reaction_scores: m.reaction_scores,
                reply_count: m.reply_count,
                deleted_reply_count: m.deleted_reply_count,
                cid: m.cid,
                created_at: m.created_at.toISOString(),
                updated_at: m.updated_at.toISOString(),
                shadowed: m.shadowed,
                mentioned_users: m.mentioned_users,
                silent: m.silent,
                pinned: m.pinned,
                pinned_at: m.pinned_at?.toISOString() || null,
                pinned_by: m.pinned_by,
                pin_expires: m.pin_expires?.toISOString() || null,
                restricted_visibility: m.restricted_visibility,
            }));
            const pinned_messages = messages.filter(m => m.pinned);
            const last_message_at = messages.length > 0
                ? messages[messages.length - 1].created_at
                : ch.last_message_at?.toISOString() || null;
            return {
                channel: {
                    id: ch.id,
                    cid: ch.cid,
                    type: ch.type,
                    name: ch.name,
                    created_by: ch.created_by,
                    config: ch.config,
                    member_count: ch.member_count,
                    blocked: ch.blocked,
                    disabled: ch.disabled,
                    frozen: ch.frozen,
                    hidden: ch.hidden,
                    own_capabilities: ch.own_capabilities,
                    created_at: ch.created_at.toISOString(),
                    updated_at: ch.updated_at.toISOString(),
                    last_message_at,
                },
                members: [], // ChannelMemberResponse[]
                watchers: [], // UserResponse[]
                read: [], // ReadResponse[]
                pinned_messages, // MessageResponse[]
                watcher_count: 0, // number
                membership: { user_id: 'test-member' },
                messages, // MessageResponse[]
                threads: [],
            };
        }));
        const durationMs = Date.now() - start;
        res.json({
            duration: `${durationMs.toFixed(2)}ms`,
            channels, // ChannelAPIResponse[]
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to query channels' });
    }
});
//
// 2) Single‐channel “query” endpoint
//
router.post('/channels/:type/:id/query', async (req, res) => {
    const start = Date.now();
    const { type, id } = req.params;
    const { data, message_limit = 25 } = req.body;
    try {
        const now = new Date();
        // upsert the channel row
        await prisma.chat_channels.upsert({
            where: { id },
            create: {
                id, type,
                name: data.name,
                created_by: data.created_by,
                config: data.config ?? {},
                member_count: data.member_count ?? (data.members?.length ?? 0),
                cid: `${type}:${id}`,
                blocked: data.blocked ?? false,
                disabled: data.disabled ?? false,
                frozen: data.frozen ?? false,
                hidden: data.hidden ?? false,
                last_message_at: data.last_message_at ? new Date(data.last_message_at) : null,
                own_capabilities: data.own_capabilities ?? [],
                created_at: now,
                updated_at: now,
            },
            update: { updated_at: now },
        });
        // load last N messages
        const dbMessages = await prisma.chat_messages.findMany({
            where: { cid: `${type}:${id}` },
            orderBy: { created_at: 'desc' },
            take: message_limit,
        });
        const messages = dbMessages
            .reverse()
            .map(m => ({
            id: m.id,
            text: m.text,
            html: m.html,
            type: m.type,
            user: m.user,
            attachments: m.attachments,
            latest_reactions: m.latest_reactions,
            own_reactions: m.own_reactions,
            reaction_counts: m.reaction_counts,
            reaction_scores: m.reaction_scores,
            reply_count: m.reply_count,
            deleted_reply_count: m.deleted_reply_count,
            cid: m.cid,
            created_at: m.created_at.toISOString(),
            updated_at: m.updated_at.toISOString(),
            shadowed: m.shadowed,
            mentioned_users: m.mentioned_users,
            silent: m.silent,
            pinned: m.pinned,
            pinned_at: m.pinned_at?.toISOString() || null,
            pinned_by: m.pinned_by,
            pin_expires: m.pin_expires?.toISOString() || null,
            restricted_visibility: m.restricted_visibility,
        }));
        const pinned_messages = messages.filter(m => m.pinned);
        const last_message_at = messages.length
            ? messages[messages.length - 1].created_at
            : null;
        // update channel row’s last_message_at so list view stays in sync
        if (last_message_at) {
            await prisma.chat_channels.update({
                where: { id },
                data: { last_message_at: new Date(last_message_at) },
            });
        }
        const durationMs = Date.now() - start;
        // finally, return the full QueryChannelAPIResponse
        res.json({
            duration: `${durationMs.toFixed(2)}ms`,
            channel: {
                id,
                cid: `${type}:${id}`,
                type,
                name: data.name,
                config: data.config ?? {},
                created_by: data.created_by,
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
                member_count: data.member_count ?? (data.members?.length ?? 0),
                blocked: data.blocked ?? false,
                disabled: data.disabled ?? false,
                frozen: data.frozen ?? false,
                hidden: data.hidden ?? false,
                last_message_at,
                own_capabilities: data.own_capabilities ?? [],
            },
            members: [], // ChannelMemberResponse[]
            watchers: [], // UserResponse[]
            read: [], // ReadResponse[]
            pinned_messages, // MessageResponse[]
            watcher_count: 0, // number
            membership: { user_id: 'test-member' },
            messages, // MessageResponse[]
            threads: []
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to query channel' });
    }
});
//
// 3) Your message‐saving endpoint is unchanged
//
router.post('/channels/:type/:id/message', async (req, res) => {
    const { type, id } = req.params;
    const { message } = req.body; // Stream‑SDK style payload
    console.log(`📨 Received message for channel ${type}/${id}:`, message);
    try {
        const now = new Date();
        /* -----------------------------------------------------------
           1.  Fetch the sender from chat_users (if it exists)
        ----------------------------------------------------------- */
        let senderJson = null;
        if (message.user_id) {
            const sender = await prisma.chat_users.findUnique({
                where: { id: message.user_id },
            });
            if (sender) {
                // Prisma returns Dates; convert to ISO so they stay JSON‑friendly
                senderJson = {
                    ...sender,
                    created_at: sender.created_at?.toISOString(),
                    updated_at: sender.updated_at?.toISOString(),
                    last_active: sender.last_active?.toISOString(),
                };
            }
        }
        /* -----------------------------------------------------------
           2.  Insert (or upsert) the message, embedding the sender
        ----------------------------------------------------------- */
        const savedMessage = await prisma.chat_messages.create({
            data: {
                id: message.id,
                text: message.text,
                html: message.html ?? null,
                type: message.type ?? 'regular',
                user: senderJson, // <‑‑ the user JSON
                attachments: message.attachments ?? [],
                latest_reactions: message.latest_reactions ?? [],
                own_reactions: message.own_reactions ?? [],
                reaction_counts: message.reaction_counts ?? {},
                reaction_scores: message.reaction_scores ?? {},
                reply_count: message.reply_count ?? 0,
                deleted_reply_count: message.deleted_reply_count ?? 0,
                cid: message.cid ?? `${type}:${id}`,
                created_at: message.created_at
                    ? new Date(message.created_at)
                    : now,
                updated_at: message.updated_at
                    ? new Date(message.updated_at)
                    : now,
                shadowed: message.shadowed ?? false,
                mentioned_users: message.mentioned_users ?? [],
                silent: message.silent ?? false,
                pinned: message.pinned ?? false,
                pinned_at: message.pinned_at
                    ? new Date(message.pinned_at)
                    : null,
                pinned_by: message.pinned_by ?? null,
                pin_expires: message.pin_expires
                    ? new Date(message.pin_expires)
                    : null,
                restricted_visibility: message.restricted_visibility ?? [],
            }
        });
        /* -----------------------------------------------------------
           3.  Respond with the saved message
        ----------------------------------------------------------- */
        res.json({
            message: {
                ...savedMessage,
                created_at: savedMessage.created_at?.toISOString() ?? null,
                updated_at: savedMessage.updated_at?.toISOString() ?? null,
            },
        });
    }
    catch (err) {
        console.error('❌ Error saving message to DB:', err);
        res
            .status(500)
            .json({ error: 'Failed to save message to database.' });
    }
});
exports.default = router;
