

// GalleryView.jsx
import { useState, useEffect } from 'react'
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'

const db = getFirestore();

export function GalleryView() {
  const [headlines, setHeadlines] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'headlines'), 
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const headlinesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setHeadlines(headlinesData);
    }, (error) => {
      console.error("Error fetching headlines:", error);
      setError("Failed to load headlines");
    });

    return () => unsubscribe();
  }, []);

  const getLayoutClass = (index) => {
    if (index === 0) {
      return "col-span-3 row-span-1" // Latest headline takes 3 columns
    }
    return "col-span-1" // All other headlines take 1 column
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Future Headlines Gallery</h1>
        <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Back to Generator
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 text-red-700 mb-4">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-10 grid-rows-2 gap-2 auto-rows-fr">
        {headlines.slice(0, 20).map((item, index) => (
          <article 
            key={item.id} 
            className={`relative overflow-hidden ${getLayoutClass(index)}`}
            style={{ 
              gridColumn: index === 0 ? '2 / span 3' : 'auto',
              gridRow: index === 0 ? '1' : index <= 4 ? '1' : '2'
            }}
          >
            <img 
              src={item.imageUrl} 
              alt={item.headline}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
              <h2 className={`text-white font-bold font-serif ${index === 0 ? 'text-xl' : 'text-sm'} leading-tight`}>
                {item.headline}
              </h2>
              <p className="text-gray-300 text-xs mt-1">
                {item.timestamp?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}