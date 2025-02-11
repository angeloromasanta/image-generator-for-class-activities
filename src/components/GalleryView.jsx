import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import GalleryItem from './GalleryItem'

export default function GalleryView({ db }) {
  const [headlines, setHeadlines] = useState([])
  
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
    });

    return () => unsubscribe();
  }, []);

  // Get the latest headline and remaining headlines
  const latestHeadline = headlines[0] || null;
  const remainingHeadlines = headlines.slice(1);

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Future Headlines Gallery</h1>
        <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Submit New
        </Link>
      </div>

      <div className="grid grid-rows-2 gap-4">
        {/* First row - 10 columns */}
        <div className="grid grid-cols-10 gap-4">
          {/* Position 1 */}
          <div className="col-span-1">
            {remainingHeadlines[0] && (
              <GalleryItem headline={remainingHeadlines[0]} size="small" />
            )}
          </div>

          {/* Latest headline in positions 2-4 */}
          {latestHeadline && (
            <div className="col-span-3 col-start-2">
              <GalleryItem headline={latestHeadline} size="large" />
            </div>
          )}

          {/* Positions 5-10 */}
          {remainingHeadlines.slice(1, 7).map((headline) => (
            <div key={headline.id} className="col-span-1">
              <GalleryItem headline={headline} size="small" />
            </div>
          ))}
        </div>

        {/* Second row - 10 columns */}
        <div className="grid grid-cols-10 gap-4">
          {remainingHeadlines.slice(7, 17).map((headline) => (
            <div key={headline.id} className="col-span-1">
              <GalleryItem headline={headline} size="small" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}