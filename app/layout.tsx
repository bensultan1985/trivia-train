import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Trivia Train - Train Like a Champion',
  description: 'A game show and trivia training app for people who want to win.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col h-screen">
          <Header user={session?.user} />
          <div className="flex flex-1 overflow-hidden">
            {session && <Sidebar />}
            <main className={`flex-1 overflow-y-auto ${session ? 'lg:ml-64' : ''}`}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
