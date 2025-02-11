import { useState } from 'react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateImage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://api.cors.lol/?url=https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            Prefer: 'wait',
          },
          body: JSON.stringify({
            input: {
              size: '1365x1024',
              prompt: prompt,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      if (data.output && data.output[0]) {
        setImage(data.output[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      {error && <div className="text-red-500 mt-4">Error: {error}</div>}

      {image && (
        <div className="mt-6">
          <img
            src={image}
            alt={prompt}
            className="max-w-full rounded shadow-lg"
          />
        </div>
      )}
    </div>
  );
}

export default App;
