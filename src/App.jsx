// App.jsx
import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { getStorage, ref, uploadString } from 'firebase/storage'
import './App.css'

// Firebase configuration - replace with your config
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
const storage = getStorage(app);

function App() {
  const [headline, setHeadline] = useState('')
  const [headlines, setHeadlines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Subscribe to headlines collection
    const q = query(collection(db, 'headlines'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const headlinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHeadlines(headlinesData);
    });

    return () => unsubscribe();
  }, []);

  const generateAndStoreImage = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Enhanced prompt engineering for newspaper headlines
      const enhancedPrompt = `Create a realistic, dramatic newspaper front page image featuring this headline from the future: "${headline}". Style: Clean, professional newspaper layout with bold typography, high contrast, and a serious journalistic feel. Include a subtle futuristic element in the design.`
      
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
        // Store in Firebase
        const timestamp = new Date();
        const docRef = await addDoc(collection(db, 'headlines'), {
          headline,
          imageUrl: data.output,
          timestamp,
        });

        console.log('Stored in Firebase with ID:', docRef.id);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      setError(err.message)
      console.error('Error details:', err);
    } finally {
      setLoading(false)
      setHeadline('') // Clear input after successful submission
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Future Headlines Generator</h1>
        
        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-12 bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Write a headline from the future:
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., 'First Human Colony on Mars Celebrates 10 Years'"
              className="w-full p-3 border rounded-lg text-lg font-serif"
            />
          </div>

          <button
            onClick={generateAndStoreImage}
            disabled={loading || !headline}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Future Headline'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-100 border-l-4 border-red-500 p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <div className="animate-pulse text-blue-600">
              Creating your future headline... Please wait...
            </div>
          </div>
        )}

        {/* Headlines Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {headlines.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.headline} 
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-serif font-bold mb-2">{item.headline}</h2>
                <p className="text-gray-600 text-sm">
                  Generated: {item.timestamp.toDate().toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App