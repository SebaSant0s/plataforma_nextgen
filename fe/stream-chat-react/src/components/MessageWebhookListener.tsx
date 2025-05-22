import { useEffect } from 'react';
import { useChannelStateContext } from '..';
import type { UserResponse } from '../../../stream-chat/src';
import type { DefaultStreamChatGenerics } from '..';

export const MessageWebhookListener = () => {
  const { channel } = useChannelStateContext();

  useEffect(() => {
    if (!channel) return;

    
    const handleNewMessage = async (event: any) => {
      const message = event.message;

      console.log(message)
      console.log(channel.getClient())

      if (!message || message.user?.id !== channel.getClient().user?.id) {
        // ✅ Only send webhooks for messages created by **this user**e
        return;
      }

      try {
        console.log("🚀 Sending message to webhook:", message.text);

        await fetch('https://n8n.nextgenpredictions.com/webhook/webhook2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            messageId: message.id,
            text: message.text,
            user: {
              id: message.user?.id,
              name: message.user?.name,
              image: message.user?.image,
            },
            attachments: message.attachments || [],
            mentionedUsers: message.mentioned_users?.map((user: UserResponse<DefaultStreamChatGenerics>) => ({
              id: user.id,
              name: user.name,
            })),
            createdAt: message.created_at,
            replyCount: message.reply_count,
            pinned: message.pinned,
            channelCid: channel.cid,
            channelType: channel.type,
            channelId: channel.id,
            channelName: channel.data?.name,
            channelImage: channel.data?.image,
            memberCount: channel.state?.members?.size,
          }),
        });

        console.log("✅ Webhook sent!");
      } catch (error) {
        console.error("❌ Webhook error:", error);
      }
    };

    console.log("🎧 Listening for message.new on channel:", channel.cid);
    channel.on('message.new', handleNewMessage);

    return () => {
      console.log("🛑 Removing listener for channel:", channel.cid);
      channel.off('message.new', handleNewMessage);
    };
  }, [channel]);

  return null;
};