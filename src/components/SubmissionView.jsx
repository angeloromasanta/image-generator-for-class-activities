
// src/components/SubmissionView.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export default function SubmissionView({ db }) {
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
        // Redirect to gallery after successful submission
        window.location.href = '/gallery'
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