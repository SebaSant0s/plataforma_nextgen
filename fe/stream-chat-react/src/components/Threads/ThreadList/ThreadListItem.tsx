import axios from 'axios';
import { useChatContext } from '../../../../../stream-chat-react/src';
import type { Message, SendMessageOptions } from '../../../../../stream-chat/src/types'
import type { DefaultStreamChatGenerics } from '../../../../../stream-chat-react/src/types';
import type { MessageToSend } from '../../../../../stream-chat-react/src';


export const useCustomSubmitHandler = () => {
  const { channel } = useChatContext<DefaultStreamChatGenerics>();

  const customSubmitHandler = async (
    message: MessageToSend<DefaultStreamChatGenerics>,
    channelCid: string,
    customMessageData?: Partial<Message<DefaultStreamChatGenerics>>,
    options?: SendMessageOptions
  ) => {
    if (!channel) {
      console.error('❌ No hay canal activo para enviar el mensaje.');
      return;
    }

    const messageToSend = {
      ...message,
      mentioned_users: message.mentioned_users?.map((u) => u.id),
    };

    const sentMessage = await channel.sendMessage(messageToSend, options);

    try {

      const savedMessage = sentMessage.message;

      if (!savedMessage.user) {
        console.warn("⚠️ El mensaje enviado no tiene información del usuario. Cancelando guardado.");
        return;
}

      await axios.post('http://localhost:5200/messages', {
        text: savedMessage.text,
        html: savedMessage.html,
        cid: savedMessage.cid,
        user: {
          id: savedMessage.user.id,
          name: savedMessage.user.name,
        },
        reply_to_id: savedMessage.parent_id || null,
      });

      console.log('✅ Mensaje guardado en el backend');
    } catch (error) {
      console.error('❌ Error al guardar el mensaje:', error);
    }
  };

  return { customSubmitHandler };
};
