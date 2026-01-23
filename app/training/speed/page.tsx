import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function SpeedTrainingPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">⚡</span>
            <div>
              <h1 className="text-4xl font-bold">Speed Training</h1>
              <p className="text-purple-100 mt-2">Test your quick thinking with rapid-fire questions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Coming Soon!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Speed Training mode will help you develop lightning-fast recall and decision-making skills.
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Quick Rounds
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Answer as many questions as possible in 60 seconds
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Progressive Difficulty
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Questions get harder as you answer correctly
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Leaderboards
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compete with other players for the top score
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              💡 <strong>Pro Tip:</strong> Speed training is perfect for game shows with buzzer rounds 
              where quick reflexes matter as much as knowledge.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
