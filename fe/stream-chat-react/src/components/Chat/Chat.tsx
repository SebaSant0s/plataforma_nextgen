import React, { PropsWithChildren, useMemo } from 'react';
import type { StreamChat } from '../../../../stream-chat/src';
import {
  ChannelSearchSource,
  MessageSearchSource,
  SearchController,
  UserSearchSource,
} from '../../../../stream-chat/src';

import { useChat } from './hooks/useChat';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useChannelsQueryState } from './hooks/useChannelsQueryState';

import { ChatProvider, CustomClasses } from '../../context/ChatContext';
import { TranslationProvider } from '../../context/TranslationContext';

import type { MessageContextValue } from '../../context';
import type { SupportedTranslations } from '../../i18n/types';
import type { Streami18n } from '../../i18n/Streami18n';
import type { DefaultStreamChatGenerics } from '../../types/types';


import { useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext'; // ajusta si tu path es diferente
import type { Event } from 'stream-chat';

const useLogNewMessages = () => {
  const { channel } = useChatContext('ChatLogger');

  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event: Event) => {
      const message = event.message;
      console.log('[REPLY] Mensaje recibido:', message);

      // Si ya viene completo (ideal)
      if (message?.quoted_message) {
        console.log('[REPLY] Este mensaje es una respuesta a:', message.quoted_message);
      }

      // Fallback: solo viene el ID del mensaje citado
      if (message?.quoted_message_id && !message.quoted_message) {
        const quotedFromMessages =
          channel?.state.messages.find((m) => m.id === message.quoted_message_id);

        const quotedFromThreads = Object.values(channel?.state.threads || {})
          .flat()
          .find((m) => m.id === message.quoted_message_id);

        const quoted = quotedFromMessages || quotedFromThreads;

        if (quoted) {
          message.quoted_message = quoted as unknown as typeof message.quoted_message;
          console.log('[REPLY] (Fallback) Asociado manualmente el mensaje citado:', quoted);
        } else {
          console.warn(
            '[REPLY] No se encontró mensaje citado con ID:',
            message.quoted_message_id
          );
          console.log('[REPLY] Mensajes disponibles en channel.state.messages:', channel?.state.messages);
          console.log('[REPLY] Mensajes disponibles en channel.state.threads:', channel?.state.threads);
        }
      }

      // Confirmación final
      if (message?.quoted_message) {
        console.log('[REPLY] Este mensaje es una respuesta a:', message.quoted_message);
      }
    };

    channel.on('message.new', handleNewMessage);

    return () => {
      channel.off('message.new', handleNewMessage);
    };
  }, [channel]);
};

export type ChatProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /** The StreamChat client object */
  client: StreamChat<StreamChatGenerics>;
  /** Object containing custom CSS classnames to override the library's default container CSS */
  customClasses?: CustomClasses;
  /** Sets the default fallback language for UI component translation, defaults to 'en' for English */
  defaultLanguage?: SupportedTranslations;
  /** Instance of Stream i18n */
  i18nInstance?: Streami18n;
  /** Initial status of mobile navigation */
  initialNavOpen?: boolean;
  /** Instance of SearchController class that allows to control all the search operations. */
  searchController?: SearchController<StreamChatGenerics>;
  /** Used for injecting className/s to the Channel and ChannelList components */
  theme?: string;
  /**
   * Windows 10 does not support country flag emojis out of the box. It chooses to render these emojis as characters instead. Stream
   * Chat can override this behavior by loading a custom web font that will render images instead (PNGs or SVGs depending on the platform).
   * Set this prop to true if you want to use these custom emojis for Windows users.
   *
   * Note: requires importing `stream-chat-react/css/v2/emoji-replacement.css` style sheet
   */
  useImageFlagEmojisOnWindows?: boolean;
} & Partial<Pick<MessageContextValue<StreamChatGenerics>, 'isMessageAIGenerated'>>;

/**
 * Wrapper component for a StreamChat application. Chat needs to be placed around any other chat components
 * as it provides the ChatContext.
 */
export const Chat = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  props: PropsWithChildren<ChatProps<StreamChatGenerics>>,
) => {
  const {
    children,
    client,
    customClasses,
    defaultLanguage,
    i18nInstance,
    initialNavOpen = true,
    isMessageAIGenerated,
    searchController: customChannelSearchController,
    theme = 'messaging light',
    useImageFlagEmojisOnWindows = false,
  } = props;

  const {
    channel,
    closeMobileNav,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  } = useChat({ client, defaultLanguage, i18nInstance, initialNavOpen });

  const channelsQueryState = useChannelsQueryState();

  const searchController = useMemo(
    () =>
      customChannelSearchController ?? new SearchController<StreamChatGenerics>({
        sources: [
          new ChannelSearchSource<StreamChatGenerics>(client),
          new UserSearchSource<StreamChatGenerics>(client),
          new MessageSearchSource<StreamChatGenerics>(client),
        ],
      }),
    [client, customChannelSearchController],
  );

  const chatContextValue = useCreateChatContext<StreamChatGenerics>({
    channel,
    channelsQueryState,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    isMessageAIGenerated,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    searchController,
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  });

  // 🟢 Aquí va la llamada al hook que escucha nuevos mensajes
  useLogNewMessages();

  if (!translators.t) return null;

  return (
    <ChatProvider value={chatContextValue}>
      <TranslationProvider value={translators}>{children}</TranslationProvider>
    </ChatProvider>
  );
};
