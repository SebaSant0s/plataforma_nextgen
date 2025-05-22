import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import {config, own_capabilities} from '../utils/utils'


const prisma = new PrismaClient();

export async function loadMembers(channelId: string) {
  const rows = await prisma.chat_channel_members.findMany({
    where: { channel_id: channelId },
    include: { user: true },
  });

  return rows.map((m) => ({
    user_id: m.user_id,
    user: m.user,
    status:             m.status,
    created_at:         m.created_at.toISOString(),
    updated_at:         m.updated_at.toISOString(),
    banned:             m.banned,
    shadow_banned:      m.shadow_banned,
    role:               m.role,
    channel_role:       m.channel_role,
    notifications_muted: m.notifications_muted,
  }));
}

const router = express.Router();

router.post('/channels', async (req, res) => {
  const start = Date.now();
  try {
    const { filter_conditions = {}, message_limit = 25 } = req.body as any;

    // 1) Build Prisma where-clause from filter_conditions
    const where: any = {};
    if (filter_conditions.cid?.['$eq'])  where.cid  = filter_conditions.cid['$eq'];
    if (filter_conditions.id?.['$eq'])   where.id   = filter_conditions.id['$eq'];
    if (filter_conditions.type?.['$eq']) where.type = filter_conditions.type['$eq'];

    // 2) Load channels
    const dbChannels = await prisma.chat_channels.findMany({ where });

    // 3) For each channel, load messages + members
    const channels = await Promise.all(
      dbChannels.map(async ch => {
        // 3a) Load last N messages
        const dbMessages = await prisma.chat_messages.findMany({
          where:   { cid: ch.cid },
          orderBy: { created_at: 'desc' },
          take:    message_limit,
        });
        const messages = dbMessages
          .reverse()
          .map(m => ({
            id:                    m.id,
            text:                  m.text,
            html:                  m.html,
            type:                  m.type,
            user:                  m.user,
            attachments:           m.attachments,
            latest_reactions:      m.latest_reactions,
            own_reactions:         m.own_reactions,
            reaction_counts:       m.reaction_counts,
            reaction_scores:       m.reaction_scores,
            reply_count:           m.reply_count,
            deleted_reply_count:   m.deleted_reply_count,
            cid:                   m.cid,
            created_at:            m.created_at!.toISOString(),
            updated_at:            m.updated_at!.toISOString(),
            shadowed:              m.shadowed,
            mentioned_users:       m.mentioned_users,
            silent:                m.silent,
            pinned:                m.pinned,
            pinned_at:             m.pinned_at?.toISOString() || null,
            pinned_by:             m.pinned_by,
            pin_expires:           m.pin_expires?.toISOString() || null,
            restricted_visibility: m.restricted_visibility,
          }));

        // 3b) Load membership rows for this channel
        const dbMembers = await prisma.chat_channel_members.findMany({
          where:   { channel_id: ch.id },
          include: { user: true },
        });
        const members = dbMembers.map(m => ({
          user_id:              m.user_id,
          user: {
            id:               m.user.id,
            name:             m.user.name,
            language:         m.user.language,
            role:             m.user.role,
            teams:            m.user.teams,
            created_at:       m.user.created_at.toISOString(),
            updated_at:       m.user.updated_at.toISOString(),
            banned:           m.user.banned,
            online:           m.user.online,
            blocked_user_ids: m.user.blocked_user_ids,
            last_active:      m.user.last_active?.toISOString() ?? null,
          },
          status:               m.status,
          created_at:           m.created_at.toISOString(),
          updated_at:           m.updated_at.toISOString(),
          banned:               m.banned,
          shadow_banned:        m.shadow_banned,
          role:                 m.role,
          channel_role:         m.channel_role,
          notifications_muted:  m.notifications_muted,
        }));

        // 3c) Extract pinned messages + last_message_at
        const pinned_messages = messages.filter(m => m.pinned);
        const last_message_at = messages.length
          ? messages[messages.length - 1].created_at
          : ch.last_message_at?.toISOString() || null;

        return {
          channel: {
            id:               ch.id,
            cid:              ch.cid,
            type:             ch.type,
            name:             ch.name,
            created_by:       ch.created_by,
            config:           ch.config,
            member_count:     ch.member_count,
            blocked:          ch.blocked,
            disabled:         ch.disabled,
            frozen:           ch.frozen,
            hidden:           ch.hidden,
            own_capabilities: ch.own_capabilities,
            created_at:       ch.created_at!.toISOString(),
            updated_at:       ch.updated_at!.toISOString(),
            last_message_at,
          },
          members,                // <-- populated from chat_channel_members
          watchers:        [],    // UserResponse[]
          read:            [],    // ReadResponse[]
          pinned_messages,        // MessageResponse[]
          watcher_count:   0,     // number
          membership:      { user_id: '___yourUserId___' },
          messages,               // MessageResponse[]
        };
      }),
    );

    const durationMs = Date.now() - start;
    res.json({
      duration: `${durationMs.toFixed(2)}ms`,
      channels,
    });
  } catch (err) {
    console.error('❌ Error in POST /channels:', err);
    res.status(500).json({ error: 'Failed to query channels' });
  }
});


router.post('/channels/:type/:id/query', async (req, res) => {
  const start = Date.now();
  const { type, id } = req.params;
  const { data, message_limit = 25 } = req.body as any;

  try {
    const now = new Date();

    //
    // 1) Fetch and build `created_by` JSON
    //
    const creatorId = typeof data.created_by === 'string'
      ? data.created_by
      : data.created_by?.id;

    let creatorJson: Prisma.InputJsonValue = {};
    if (creatorId) {
      const user = await prisma.chat_users.findUnique({ where: { id: creatorId } });
      if (user) {
        creatorJson = {
          id:               user.id,
          name:             user.name,
          language:         user.language,
          role:             user.role,
          teams:            user.teams,
          created_at:       user.created_at.toISOString(),
          updated_at:       user.updated_at.toISOString(),
          banned:           user.banned,
          online:           user.online,
          blocked_user_ids: user.blocked_user_ids,
          last_active:      user.last_active?.toISOString() ?? null,
        };
      }
    }

    //
    // 2) Upsert the channel row
    //
    await prisma.chat_channels.upsert({
      where: { id },
      create: {
        id,
        type,
        cid:              `${type}:${id}`,
        name:             data.name,
        created_by:       creatorJson,
        last_message_at:  data.last_message_at ? new Date(data.last_message_at) : null,
        created_at:       now,
        updated_at:       now,
        frozen:           data.frozen   ?? false,
        disabled:         data.disabled ?? false,
        hidden:           data.hidden   ?? false,
        blocked:          data.blocked  ?? false,
        member_count:     data.member_count ?? (data.members?.length ?? 0),
        config,
        own_capabilities,
      },
      update: {
        updated_at: now,
      },
    });

    //
    // 3) (Re‐)populate chat_channel_members
    //
    const memberIds: string[] = Array.isArray(data.members)
      ? data.members
      : [];

    for (const userId of memberIds) {
      await prisma.chat_channel_members.upsert({
        where: {
          channel_id_user_id: { channel_id: id, user_id: userId },
        },
        create: {
          channel_id:           id,
          user_id:              userId,
          status:               'member',
          role:                 'member',
          channel_role:         'channel_member',
          banned:               false,
          shadow_banned:        false,
          notifications_muted:  false,
          created_at:           now,
          updated_at:           now,
        },
        update: {
          updated_at: now,
        },
      });
    }

    //
    // 4) Load messages
    //
    const dbMessages = await prisma.chat_messages.findMany({
      where:   { cid: `${type}:${id}` },
      orderBy: { created_at: 'desc' },
      take:    message_limit,
    });

    const messages = dbMessages.reverse().map(m => ({
      id:                    m.id,
      text:                  m.text,
      html:                  m.html,
      type:                  m.type,
      user:                  m.user,
      attachments:           m.attachments,
      latest_reactions:      m.latest_reactions,
      own_reactions:         m.own_reactions,
      reaction_counts:       m.reaction_counts,
      reaction_scores:       m.reaction_scores,
      reply_count:           m.reply_count,
      deleted_reply_count:   m.deleted_reply_count,
      cid:                   m.cid,
      created_at:            m.created_at!.toISOString(),
      updated_at:            m.updated_at!.toISOString(),
      shadowed:              m.shadowed,
      mentioned_users:       m.mentioned_users,
      silent:                m.silent,
      pinned:                m.pinned,
      pinned_at:             m.pinned_at?.toISOString() || null,
      pinned_by:             m.pinned_by,
      pin_expires:           m.pin_expires?.toISOString() || null,
      restricted_visibility: m.restricted_visibility,
    }));

    const pinned_messages = messages.filter(m => m.pinned);
    const last_message_at  = messages.length
      ? messages[messages.length - 1].created_at
      : null;

    // keep the channel row’s last_message_at in sync
    if (last_message_at) {
      await prisma.chat_channels.update({
        where: { id },
        data:  { last_message_at: new Date(last_message_at) },
      });
    }

    //
    // 5) Fetch and format members for the response
    //
    const dbMembers = await prisma.chat_channel_members.findMany({
      where:   { channel_id: id },
      include: { user: true },
    });

    const members = dbMembers.map(m => ({
      user_id:              m.user_id,
      user: {
        id:               m.user.id,
        name:             m.user.name,
        language:         m.user.language,
        role:             m.user.role,
        teams:            m.user.teams,
        created_at:       m.user.created_at.toISOString(),
        updated_at:       m.user.updated_at.toISOString(),
        banned:           m.user.banned,
        online:           m.user.online,
        blocked_user_ids: m.user.blocked_user_ids,
        last_active:      m.user.last_active?.toISOString() ?? null,
      },
      status:               m.status,
      created_at:           m.created_at.toISOString(),
      updated_at:           m.updated_at.toISOString(),
      banned:               m.banned,
      shadow_banned:        m.shadow_banned,
      role:                 m.role,
      channel_role:         m.channel_role,
      notifications_muted:  m.notifications_muted,
    }));

    //
    // 6) Return the full QueryChannelAPIResponse envelope
    //
    const durationMs = Date.now() - start;
    res.json({
      duration:   `${durationMs.toFixed(2)}ms`,
      channel: {
        id,
        cid:              `${type}:${id}`,
        type,
        name:             data.name,
        created_by:       creatorJson,
        created_at:       now.toISOString(),
        updated_at:       now.toISOString(),
        member_count:     data.member_count ?? memberIds.length,
        blocked:          data.blocked   ?? false,
        disabled:         data.disabled  ?? false,
        frozen:           data.frozen    ?? false,
        hidden:           data.hidden    ?? false,
        last_message_at,
        config,
        own_capabilities,
      },
      members,            // <-- now populated from chat_channel_members
      watchers:   [],     // UserResponse[]
      read:       [],     // ReadResponse[]
      pinned_messages,    // MessageResponse[]
      watcher_count: 0,
      membership:    { user_id: creatorId || '___yourUserId___' },
      messages,           // MessageResponse[]
    });
  } catch (err) {
    console.error('❌ Error in POST /channels/:type/:id/query', err);
    res.status(500).json({ error: 'Failed to query channel' });
  }
});

//
// 3) Your message‐saving endpoint is unchanged
//
router.post('/channels/:type/:id/message', async (req, res) => {
  const { type, id } = req.params;
  const { message } = req.body;          // Stream‑SDK style payload

  console.log(`📨 Received message for channel ${type}/${id}:`, message);

  try {
    const now = new Date();

    /* -----------------------------------------------------------
       1.  Fetch the sender from chat_users (if it exists)
    ----------------------------------------------------------- */
    let senderJson: any = null;

    const sender = await prisma.chat_users.findUnique({
      where: { id: 'default-user' },
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


    /* -----------------------------------------------------------
       2.  Insert (or upsert) the message, embedding the sender
    ----------------------------------------------------------- */
    const savedMessage = await prisma.chat_messages.create({
      data: {
        id: message.id,
        text: message.text,
        html: `\u003cp\u003e${message.text}\u003c/p\u003e\n`,
        type: message.type ?? 'regular',
        user: senderJson,                       // <‑‑ the user JSON
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
  } catch (err) {
    console.error('❌ Error saving message to DB:', err);
    res
      .status(500)
      .json({ error: 'Failed to save message to database.' });
  }
});


export default router;
