import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { getChannel } from '../../../utils/getChannel';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from '../../../../../stream-chat/src';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useNotificationMessageNewListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<StreamChatGenerics>(
    'useNotificationMessageNewListener',
  );

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (allowNewMessagesFromUnfilteredChannels && event.channel?.type) {
        const channel = await getChannel({
          client,
          id: event.channel.id,
          type: event.channel.type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.message_new', handleEvent);

    return () => {
      client.off('notification.message_new', handleEvent);
    };
  }, [allowNewMessagesFromUnfilteredChannels, client, customHandler, setChannels]);
};
