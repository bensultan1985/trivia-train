import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Welcome to Trivia Train! 🎯
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Train Like a Champion
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Welcome, <span className="font-bold">{session.user.username}</span>! 
            Get ready to sharpen your trivia skills and dominate your next game show.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Choose a training mode from the sidebar to get started.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/training/speed" className="block">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-bold mb-2">Speed Training</h3>
              <p className="text-sm opacity-90">
                Test your quick thinking with rapid-fire questions
              </p>
            </div>
          </Link>
          
          <Link href="/training/accuracy" className="block">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-bold mb-2">Accuracy Training</h3>
              <p className="text-sm opacity-90">
                Focus on getting every answer right
              </p>
            </div>
          </Link>
          
          <Link href="/training/category" className="block">
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-xl font-bold mb-2">Category Training</h3>
              <p className="text-sm opacity-90">
                Master specific trivia categories
              </p>
            </div>
          </Link>
        </div>
        
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">
            💡 Pro Tip
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Consistent practice is key! Try to train for at least 15 minutes each day 
            to see real improvement in your trivia skills.
          </p>
        </div>
      </div>
    </div>
  )
}
