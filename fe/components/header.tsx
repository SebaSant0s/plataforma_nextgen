import Image from 'next/image'
import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className='py-4'>
      <nav className='container flex items-center justify-between'>
        <ul className='flex items-center gap-10 text-sm font-medium'>
        <Link href="https://nextgenpredictions.com" target="_blank" rel="noopener noreferrer">
          <Image 
            src="/Signature2_7.png" 
            alt="NextGen Predictions" 
            className="h-8 w-auto mr-2"
          />
        </Link>
          <li>
            <Link href='/chat'>Chat</Link>
          </li>
        </ul>

        <div className='flex items-center justify-between gap-6'>
          <ThemeToggle />

          <SignedOut>
            <SignInButton>
              <Button size='sm'>Sign in</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
