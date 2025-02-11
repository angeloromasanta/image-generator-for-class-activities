import { useState } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateImage = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            size: "1365x1024",
            prompt: prompt
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json()
      console.log('API Response:', data); // Debug log

      // Check if response has the direct output URL
      if (data.output && typeof data.output === 'string') {
        setImage(data.output);
      } else {
        setError('No image URL in response');
        console.error('Unexpected API response:', data);
      }
    } catch (err) {
      setError(err.message)
      console.error('Error details:', err);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Image Generator</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={generateImage}
        disabled={loading || !prompt}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>

      {error && (
        <div className="text-red-500 mt-4">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 text-blue-500">
          Generating your image... This may take a minute...
        </div>
      )}

      {image && (
        <div className="mt-6">
          <img 
            src={image} 
            alt={prompt} 
            className="max-w-full rounded shadow-lg"
            onError={(e) => {
              console.error('Image loading error');
              setError('Failed to load the generated image');
            }}
          />
        </div>
      )}
    </div>
  )
}

export default App