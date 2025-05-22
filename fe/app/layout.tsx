import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'

import '../stream-chat-css/src/v2/styles/index.scss';
import './globals.css'
import Providers from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Whatsapp Business Interface',
  description: 'The platform that increases the value from your business'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang='en'
        className='scroll-smooth antialiased'
        suppressHydrationWarning
      >
        <body className={`${inter.className}`} >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}