import React, { useMemo, useState, useEffect} from 'react';
import clsx from 'clsx';

import { MessageErrorIcon } from './icons';
/* import { MessageBouncePrompt as DefaultMessageBouncePrompt } from 'stream-chat-react'; */
import { MessageDeleted as DefaultMessageDeleted } from '../../../stream-chat-react/src';
import { MessageOptions as DefaultMessageOptions } from '../MessageOptions/CustomMessageOptions';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from '../../../stream-chat-react/src';
import { MessageStatus as DefaultMessageStatus } from '../../../stream-chat-react/src';
import { MessageText } from '../../../stream-chat-react/src';
import { MessageTimestamp as DefaultMessageTimestamp } from '../../../stream-chat-react/src';
import {
  areMessageUIPropsEqual,
  isMessageBounced,
  isMessageEdited,
  messageHasAttachments,
  messageHasReactions,
} from '../../../stream-chat-react/src';

import { Avatar as DefaultAvatar } from '../../../stream-chat-react/src';
import { Attachment as DefaultAttachment } from '../../../stream-chat-react/src';
/* import { CUSTOM_MESSAGE_TYPE } from 'stream-chat-react'; */
import { EditMessageForm as DefaultEditMessageForm, MessageInput } from '../../../stream-chat-react/src';
import { MML } from '../../../stream-chat-react/src';
import { Modal } from '../../../stream-chat-react/src';
import { Poll } from '../../../stream-chat-react/src';
import { ReactionsList as DefaultReactionList } from '../../../stream-chat-react/src';
/* import { MessageBounceModal } from 'stream-chat-react'; */
import { useComponentContext } from '../../../stream-chat-react/src';
import { MessageContextValue, useMessageContext } from '../../../stream-chat-react/src';

import { useChatContext, useTranslationContext } from '../../../stream-chat-react/src';
/* import { MessageEditedTimestamp } from 'stream-chat-react'; */

import type { MessageUIComponentProps } from '../../../stream-chat-react/src';
import type { DefaultStreamChatGenerics } from '../../../stream-chat-react/src';
import { StreamedMessageText as DefaultStreamedMessageText } from '../../../stream-chat-react/src';

type MessageSimpleWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = MessageContextValue<StreamChatGenerics>;



const MessageSimpleWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageSimpleWithContextProps<StreamChatGenerics>,
) => {

  const [publicUser, setPublicUser] = useState<{ id: string; image: string } | null>(null);

  useEffect(() => {
    fetch('/userdata.json')
      .then((res) => res.json())
      .then((data) => setPublicUser(data))
      .catch((err) => console.error('Failed to load userdata.json', err));
  }, []);

 
  
  const {
    additionalMessageInputProps,
    clearEditingState,
    editing,
    endOfGroup,
    firstOfGroup,
    groupedByUser,
    handleAction,
    handleOpenThread,
    handleRetry,
    highlighted,
    isMessageAIGenerated,
    isMyMessage,
    message,
    onUserClick,
    onUserHover,
    renderText,
    threadList,
  } = props;
  const { client } = useChatContext('MessageSimple');
  const { t } = useTranslationContext('MessageSimple');
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const [isEditedTimestampOpen, setEditedTimestampOpen] = useState(false);
const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    EditMessageInput = DefaultEditMessageForm,
    MessageOptions = DefaultMessageOptions,
    // TODO: remove this "passthrough" in the next
    // major release and use the new default instead
    MessageActions = MessageOptions,
    MessageDeleted = DefaultMessageDeleted,
    /* MessageBouncePrompt = DefaultMessageBouncePrompt, */
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageStatus = DefaultMessageStatus,
    MessageTimestamp = DefaultMessageTimestamp,
    ReactionsList = DefaultReactionList,
    StreamedMessageText = DefaultStreamedMessageText,
    PinIndicator,
  } = useComponentContext<StreamChatGenerics>('MessageSimple');

  const hasAttachment = messageHasAttachments(message);
  const hasReactions = messageHasReactions(message);
  const isAIGenerated = useMemo(
    () => isMessageAIGenerated?.(message),
    [isMessageAIGenerated, message],
  );

  const CUSTOM_MESSAGE_TYPE = {
    date: 'message.date',
    intro: 'channel.intro',
  } as const;

  if (message.customType === CUSTOM_MESSAGE_TYPE.date) {
    return null;
  }

  if (message.deleted_at  endOfGroup;
  const showReplyCountButton = !threadList && !!message.reply_count;
  const allowRetry = message.status === 'failed' && message.errorStatusCode !== 403;
  const isBounced = isMessageBounced(message);
  const isEdited = isMessageEdited(message) && !isAIGenerated;

  let handleClick: (() => void) | undefined = undefined;

  if (allowRetry) {
    handleClick = () => handleRetry(message);
  } else if (isBounced) {
    handleClick = () => setIsBounceDialogOpen(true);
  } else if (isEdited) {
    handleClick = () => setEditedTimestampOpen((prev) => !prev);
  }


  const isMyMsg = () => {
    const myUsers = [
      { id: "5491140897287", name: "NextGen AI" },
      ...(publicUser ? [{ id: publicUser.id, name: "App User" }] : [])
    ];

    return myUsers.some(
      (user) =>
        message.user?.id === user.id  !message.id) {
    return null; // or some fallback UI
  }
return (
    <>
      {/* {editing && (
        <Modal
          className='str-chat__edit-message-modal'
          onClose={clearEditingState}
          open={editing}
        >
          <MessageInput
            clearEditingState={clearEditingState}
            grow
            hideSendButton
            Input={EditMessageInput}
            message={message}
            {...additionalMessageInputProps}
          />
        </Modal>
      )}
      {isBounceDialogOpen && (
        <MessageBounceModal
          MessageBouncePrompt={MessageBouncePrompt}
          onClose={() => setIsBounceDialogOpen(false)}
          open={isBounceDialogOpen}
        />
      )} */}
      {
        <div className={rootClassName} key={message.id}>
          {PinIndicator && <PinIndicator />}
          {message.user && (
            <Avatar
              image={message.user.image}
              name={message.user.name  isBounced,
            })}
            data-testid='message-inner'
            onClick={handleClick}
            onKeyUp={handleClick}
          >
            <MessageActions />
            <div className='str-chat__message-reactions-host'>
              {hasReactions && <ReactionsList reverse />}
            </div>
            <div className='str-chat__message-bubble'>
              {poll && <Poll poll={poll} />}
              {message.attachments?.length && !message.quoted_message ? (
                <Attachment
                  actionHandler={handleAction}
                  attachments={message.attachments}
                />
              ) : null}
              {isAIGenerated ? (
                <StreamedMessageText message={message} renderText={renderText} />
              ) : (
                <MessageText message={message} renderText={renderText} />
              )}
              {message.mml && (
                <MML
                  
                  actionHandler={handleAction}
                  align={ isMyMsg() ? 'right' : 'left' }
                  source={message.mml}
                />
              )}
              <MessageErrorIcon />
            </div>
          </div>
          {showReplyCountButton && (
            <MessageRepliesCountButton
              onClick={handleOpenThread}
              reply_count={message.reply_count}
            />
          )}
          {showMetadata && (
            <div className='str-chat__message-metadata'>
              <MessageStatus />
              {/* {isMyMsg() && message.user && (
                <span className='str-chat__message-simple-name'>
                  {message.user.name || message.user.id}
                </span>
              )} */}
              <MessageTimestamp customClass='str-chat__message-simple-timestamp' />
              {isEdited && (
                <span className='str-chat__mesage-simple-edited'>
                  {t<string>('Edited')}
                </span>
              )}
              {/* {isEdited && (
                <MessageEditedTimestamp calendar open={isEditedTimestampOpen} />
              )} */}
            </div>
          )}
        </div>
      }
    </>
  );
};

const MemoizedMessageSimple = React.memo(
  MessageSimpleWithContext,
  areMessageUIPropsEqual,
) as typeof MessageSimpleWithContext;

/**
 * The default UI component that renders a message and receives functionality and logic from the MessageContext.
 */
export const CustomMessageSimple = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageUIComponentProps<StreamChatGenerics>,
) => {
  const messageContext = useMessageContext<StreamChatGenerics>('MessageSimple');

  return <MemoizedMessageSimple {...messageContext} {...props} />;
};
