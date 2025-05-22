import Link from 'next/link'

export default function Home() {
  return (
    <section className='py-0'>
      <div className='container'>
        <div className='mx-auto max-w-2xl py-32'>
          {/* <div className='hidden sm:mb-8 sm:flex sm:justify-center'>
            <div className='relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-gray-900/10 hover:ring-gray-900/20'>
              Announcing our next round of funding.{' '}
              <Link href='/' className='font-semibold text-emerald-600'>
                <span aria-hidden='true' className='absolute inset-0' />
                Read more <span aria-hidden='true'>&rarr;</span>
              </Link>
            </div>
          </div> */}
          <div className='text-center'>
            <h1 className='text-4xl font-bold tracking-tight sm:text-6xl'>
              Realtime Whatsapp Business Platform
            </h1>
            <p className='mt-6 text-lg leading-8 text-muted-foreground'>
              Accede instantáneamente a conversaciones e interacciones automatizadas en WhatsApp Business. Nuestra plataforma te permite gestionar mensajes en tiempo real, incluyendo imágenes y audios enviados durante las conversaciones
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Link
                href='/chat'
                className='rounded-md bg-yellow-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500'
              >
                Access
              </Link>
              {/* <Link href='/' className='text-sm font-semibold leading-6'>
                Learn more <span aria-hidden='true'>→</span>
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
