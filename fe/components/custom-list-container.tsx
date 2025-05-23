'use client'

import { PropsWithChildren, useState } from 'react'

import {
  DefaultStreamChatGenerics,
  ChannelListMessengerProps,
  LoadingErrorIndicator,
  LoadingIndicator
} from '../stream-chat-react/src'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import NewConversationForm from '@/components/new-conversation-form'

import { MessageSquarePlus } from 'lucide-react'

export default function CustomListContainer(
  props: PropsWithChildren<ChannelListMessengerProps<DefaultStreamChatGenerics>>
) {
  const {loadedChannels, error, loading, children } = props
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  function closeDialog() {
    setDialogIsOpen(false)
  }

  if (error) {
    return <LoadingErrorIndicator />
  }

  if (loading) {
    return <LoadingIndicator />
  }

  console.log("Loaded Channels:", loadedChannels);
  
  return (
    <section style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Encabezado */}
      <div className='relative hidden flex-col items-start gap-8 p-4 md:flex'>
        <header className='w-full'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold'>Chats</h1>
          </div>
          <div className='mt-4'>
            <Input placeholder='Search...' className='bg-muted' />
          </div>
        </header>
      </div>

      {/* Lista de chats */}
      <div
        className='str-chat__channel-list-messenger'
        style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flexGrow: 1 }}>{children}</div>
      </div>
    </section>
  );
}

