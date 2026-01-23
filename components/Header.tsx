'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: {
    username: string
    email: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">Trivia Training App</h1>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm">Welcome, {user.username}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <a
                href="/login"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors text-sm"
              >
                Login
              </a>
              <a
                href="/register"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-sm"
              >
                Register
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
