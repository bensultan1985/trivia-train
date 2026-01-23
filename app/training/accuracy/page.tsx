import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function AccuracyTrainingPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🎯</span>
            <div>
              <h1 className="text-4xl font-bold">Accuracy Training</h1>
              <p className="text-blue-100 mt-2">Focus on getting every answer right</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Coming Soon!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Accuracy Training mode will help you build precision and confidence in your answers.
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Untimed Practice
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Take your time to think through each question carefully
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Detailed Explanations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn why answers are correct or incorrect
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Progress Tracking
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your accuracy rate over time
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Pro Tip:</strong> Accuracy training is ideal for preparing for game shows 
              where wrong answers have penalties or where precision is crucial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
