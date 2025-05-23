'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { createToken } from '@/lib/actions';

import { ChannelPreviewMessenger } from '../stream-chat-react/src/components/ChannelPreview';
import { ChannelHeader } from '../stream-chat-react/src/components/ChannelHeader';
import { MessageSimple } from '../stream-chat-react/src/components/Message';
import { MessageInput } from '../stream-chat-react/src/components/MessageInput';
import {
  doFileUploadRequest,
  doImageUploadRequest
} from '../stream-chat-react/src/components/MessageInput';

import type {
  ChannelSort,
  ChannelFilters,
  ChannelOptions
} from '../stream-chat/src';

import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
  DefaultStreamChatGenerics
} from '../stream-chat-react/src';

import { EmojiPicker } from '../stream-chat-react/src/plugins/Emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';
init({ data });

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import CustomListContainer from '@/components/custom-list-container';

import { Dock, Megaphone, MessageCircleMore, MessageSquare, Scan, UsersRound } from 'lucide-react';
import { HomeIcon } from '@radix-ui/react-icons';

interface StreamChatProps {
  userData: {
    id: string;
    name?: string;
    image?: string;
  };
}

export default function StreamChat({ userData }: StreamChatProps) {
  const { resolvedTheme } = useTheme();

  // Chat client setup
  const tokenProvider = useCallback(async () => {
    const res = await fetch('/api/messages');
    const data = await res.json();
    return data.token;
  }, []);

  const client = useCreateChatClient({
    userData,
    tokenOrProvider: tokenProvider,
    apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!
  });

  const sort: ChannelSort<DefaultStreamChatGenerics> = { last_message_at: -1 };
  const filters: ChannelFilters<DefaultStreamChatGenerics> = {
    type: 'messaging',
    members: { $in: ['default-user'] },
    last_message_at: { $exists: true }
  };
  const options: ChannelOptions = { limit: 10 };

  // Redimensionamiento
  const channelListRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !channelListRef.current) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) {
        channelListRef.current.style.flexBasis = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!client) return null;

  return (
    <Chat
      client={client}
      theme={cn(resolvedTheme === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light')}
    >
      {/* Barra lateral de navegación */}
      <aside className='inset-y z-20 flex h-full flex-col border-r'>
        <nav className='grid gap-1 px-2 py-4'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='rounded-lg' aria-label='Home' asChild>
                  <Link href='/'>
                    <HomeIcon className='size-5' />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right' sideOffset={5}>
                Home
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-lg bg-muted'
                  aria-label='Chats'
                >
                  <MessageSquare className='size-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right' sideOffset={5}>
                Chats
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>

        <nav className='mt-auto grid gap-2 px-2 py-4'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ThemeToggle />
              </TooltipTrigger>
              <TooltipContent side='right' sideOffset={5}>
                Theme
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className='flex items-center justify-center'>
            <UserButton />
          </div>
        </nav>
      </aside>

      {/* Área de chat redimensionable */}
      <div className='chat-wrapper'>
        <div 
          ref={channelListRef} 
          className='str-chat__channel-list'
          style={{ flexBasis: '300px' }}>
          <ChannelList
            sort={sort}
            filters={filters}
            options={options}
            List={CustomListContainer}
            Preview={ChannelPreviewMessenger}
          />
        </div>

        <div
          className='resizer'
          onMouseDown={() => {
            setIsResizing(true);
            document.body.style.cursor = 'col-resize';
          }}
        />

        <div className='str-chat__channel'>
          <Channel
            EmojiPicker={EmojiPicker}
            Message={MessageSimple}
            emojiSearchIndex={SearchIndex}
          >
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput
                doFileUploadRequest={doFileUploadRequest}
                doImageUploadRequest={doImageUploadRequest}
                audioRecordingEnabled
              />
            </Window>
            <Thread />
          </Channel>
        </div>
      </div>
    </Chat>
  );
}
