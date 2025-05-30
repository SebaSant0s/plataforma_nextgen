import React, { createContext, useContext } from 'react';
import axios from 'axios';

import type { Thread } from '../../../../../stream-chat/src';
import { useComponentContext } from '../../../context';
import { ThreadListItemUI as DefaultThreadListItemUI } from './ThreadListItemUI';
import type { ThreadListItemUIProps } from './ThreadListItemUI';

import { ChatViewSelector } from '../../ChatView';

import {
  useChatContext,
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ThreadList,
  View,
  Views,
  ThreadProvider,
} from '../../../../../stream-chat-react/src';

export type ThreadListItemProps = {
  thread: Thread;
  threadListItemUIProps?: ThreadListItemUIProps;
};

const ThreadListItemContext = createContext<Thread | undefined>(undefined);
export const useThreadListItemContext = () => useContext(ThreadListItemContext);

export const ThreadListItem = ({
  thread,
  threadListItemUIProps,
}: ThreadListItemProps) => {
  const { ThreadListItemUI = DefaultThreadListItemUI } = useComponentContext();
  const { channel, client: chatClient } = useChatContext();

  const customSubmitHandler = async (
    message,
    channelCid,
    customMessageData,
    options
  ) => {
    const sentMessage = await channel.sendMessage(message, options);

    try {
      await axios.post('http://localhost:5200/messages', {
        text: sentMessage.text,
        html: sentMessage.html,
        cid: sentMessage.cid,
        user: {
          id: sentMessage.user.id,
          name: sentMessage.user.name,
        },
        reply_to_id: sentMessage.parent_id || null,
      });

      console.log('✅ Mensaje guardado en el backend');
    } catch (error) {
      console.error('❌ Error al guardar el mensaje:', error);
    }
  };

  return (
    <Chat client={chatClient}>
      <Views>
        <ChatViewSelector onItemPointerDown={() => {}} />
        <View.Chat>
          <Channel channel={channel}>
            <MessageList />
            <MessageInput overrideSubmitHandler={customSubmitHandler} />
          </Channel>
        </View.Chat>
        <View.Thread>
          <ThreadList />
          <ThreadProvider>
            <Thread />
          </ThreadProvider>
        </View.Thread>
      </Views>
    </Chat>
  );
};
