
// SubmissionView.jsx
import { useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore'
import { Link } from 'react-router-dom'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function SubmissionView() {
  const [headline, setHeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateAndStoreImage = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const enhancedPrompt = `Generate a vivid, realistic image depicting this future scenario: "${headline}". Make it detailed and imaginative, focusing on the key elements of the scene.`
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            size: "1365x1024",
            prompt: enhancedPrompt
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json()

      if (data.output && typeof data.output === 'string') {
        await addDoc(collection(db, 'headlines'), {
          headline,
          imageUrl: data.output,
          timestamp: Timestamp.now()
        });

        setHeadline('')
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      setError(err.message)
      console.error('Error details:', err);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-center">Future Headlines Generator</h1>
          <Link to="/gallery" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            View Gallery
          </Link>
        </div>
        
        <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-blue-600">Tailwind Test Page</h1>
      
      {/* Background Colors */}
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-red-500 rounded-lg"></div>
        <div className="w-16 h-16 bg-blue-500 rounded-lg"></div>
        <div className="w-16 h-16 bg-green-500 rounded-lg"></div>
      </div>

      {/* Text Styles */}
      <div className="space-y-2">
        <p className="text-xl text-purple-600 font-bold">Bold Purple Text</p>
        <p className="text-sm text-gray-500 italic">Small Gray Italic Text</p>
      </div>

      {/* Border and Shadow */}
      <div className="border-2 border-orange-500 shadow-lg p-4 rounded-xl">
        Box with Border and Shadow
      </div>

      {/* Hover and Transform */}
      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transform hover:scale-105 transition-all">
        Hover Me
      </button>

      {/* Flex and Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-yellow-200 p-2 text-center">1</div>
        <div className="bg-yellow-300 p-2 text-center">2</div>
        <div className="bg-yellow-400 p-2 text-center">3</div>
      </div>
    </div>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              What headline do you see in the future?
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., 'First Human Colony on Mars Celebrates 10 Years'"
              className="w-full p-3 border rounded-lg text-lg"
            />
          </div>

          <button
            onClick={generateAndStoreImage}
            disabled={loading || !headline}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Vision'}
          </button>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mt-8 bg-red-100 border-l-4 border-red-500 p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {loading && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <div className="animate-pulse text-blue-600">
              Visualizing the future... Please wait...
            </div>
          </div>
        )}
      </div>
    </div>
    
  )
}