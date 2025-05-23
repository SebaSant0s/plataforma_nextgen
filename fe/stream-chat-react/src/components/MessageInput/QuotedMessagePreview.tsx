import React, { useMemo } from 'react';

import { CloseIcon } from './icons';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { Poll } from '../Poll';

import { useChatContext } from '../../context/ChatContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { TranslationLanguages } from '../../../../stream-chat/src';
import type { StreamMessage } from '../../context/ChannelStateContext';
import type { MessageContextValue } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { renderText as defaultRenderText } from '../Message';

export const QuotedMessagePreviewHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const { setQuotedMessage } =
    useChannelActionContext<StreamChatGenerics>('QuotedMessagePreview');
  const { t } = useTranslationContext('QuotedMessagePreview');

  return (
    <div className='str-chat__quoted-message-preview-header'>
      <div className='str-chat__quoted-message-reply-to-message'>
        {t<string>('Reply to Message')}
      </div>
      <button
        aria-label={t('aria/Cancel Reply')}
        className='str-chat__quoted-message-remove'
        onClick={() => setQuotedMessage(undefined)}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export type QuotedMessagePreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  quotedMessage: StreamMessage<StreamChatGenerics>;
  renderText?: MessageContextValue<StreamChatGenerics>['renderText'];
};

export const QuotedMessagePreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  quotedMessage,
  renderText = defaultRenderText,
}: QuotedMessagePreviewProps<StreamChatGenerics>) => {
  const { client } = useChatContext();
  const { Attachment = DefaultAttachment, Avatar = DefaultAvatar } =
    useComponentContext<StreamChatGenerics>('QuotedMessagePreview');
  const { userLanguage } = useTranslationContext('QuotedMessagePreview');

  const quotedMessageText =
    quotedMessage.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    quotedMessage.text;

  const renderedText = useMemo(
    () => renderText(quotedMessageText, quotedMessage.mentioned_users),
    [quotedMessage.mentioned_users, quotedMessageText, renderText],
  );

  const quotedMessageAttachment = useMemo(() => {
    const [attachment] = quotedMessage.attachments ?? [];
    return attachment ? [attachment] : [];
  }, [quotedMessage.attachments]);

  if (!quotedMessageText && !quotedMessageAttachment) return null;

  const poll = quotedMessage.poll_id && client.polls.fromState(quotedMessage.poll_id);

  return (
    <div
      className='str-chat__quoted-message-preview'
      data-testid='quoted-message-preview'
    >
      {quotedMessage.user && (
        <Avatar
          className='str-chat__avatar--quoted-message-sender'
          image={quotedMessage.user.image}
          name={quotedMessage.user.name || quotedMessage.user.id}
          user={quotedMessage.user}
        />
      )}
      <div className='str-chat__quoted-message-bubble'>
        {poll ? (
          <Poll isQuoted poll={poll} />
        ) : (
          <>
            {!!quotedMessageAttachment.length && (
              <Attachment attachments={quotedMessageAttachment} isQuoted />
            )}
            <div
              className='str-chat__quoted-message-text'
              data-testid='quoted-message-text'
            >
              {renderedText}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
