// App.jsx
import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [headline, setHeadline] = useState('')
  const [headlines, setHeadlines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch headlines on component mount
  useEffect(() => {
    const q = query(
      collection(db, 'headlines'), 
      orderBy('timestamp', 'desc')
    );

    // Real-time listener for headlines
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const headlinesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() // Convert Firestore Timestamp to Date
      }));
      setHeadlines(headlinesData);
    }, (error) => {
      console.error("Error fetching headlines:", error);
      setError("Failed to load headlines");
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const generateAndStoreImage = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simple prompt focused on the image content
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
        // Store in Firebase with current timestamp
        await addDoc(collection(db, 'headlines'), {
          headline,
          imageUrl: data.output,
          timestamp: Timestamp.now()
        });

        setHeadline('') // Clear input after successful submission
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
        <h1 className="text-4xl font-bold mb-8 text-center">Future Headlines Gallery</h1>
        
        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-12 bg-white rounded-lg shadow-lg p-6">
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
              Visualizing the future... Please wait...
            </div>
          </div>
        )}

        {/* Headlines Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {headlines.map((item) => (
            <article key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.headline}
                  className="w-full h-64 object-cover"
                />
                {/* Headline overlay with newspaper-style formatting */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <h2 className="text-white text-xl font-bold leading-tight font-serif">
                    {item.headline}
                  </h2>
                  <p className="text-gray-300 text-sm mt-2">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Date unavailable'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App