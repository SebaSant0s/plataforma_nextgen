import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { getChannel } from '../../../utils/getChannel';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from '../../../../../stream-chat/src';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useChannelVisibleListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useChannelVisibleListener');

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (event.type && event.channel_type && event.channel_id) {
        const channel = await getChannel({
          client,
          id: event.channel_id,
          type: event.channel_type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('channel.visible', handleEvent);

    return () => {
      client.off('channel.visible', handleEvent);
    };
  }, [client, customHandler, setChannels]);
};
