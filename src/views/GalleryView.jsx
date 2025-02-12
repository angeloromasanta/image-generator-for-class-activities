

// views/GalleryView.jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function GalleryView() {
  const [headlines, setHeadlines] = useState([]);

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

  const newestHeadline = headlines[0];
  const otherHeadlines = headlines.slice(1, 11); // Get next 10 headlines

  return (
    <div className="gallery-container">
      <header>
        <h1>Future Headlines Gallery</h1>
        <nav>
          <a href="/" className="submit-link">Submit New Headline</a>
        </nav>
      </header>

      <main className="gallery-grid">
        {newestHeadline && (
          <article className="featured-headline">
            <div className="headline-image">
              <img src={newestHeadline.imageUrl} alt={newestHeadline.headline} />
              <div className="headline-overlay">
                <h2>{newestHeadline.headline}</h2>
                <time>
                  {newestHeadline.timestamp.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>
            </div>
          </article>
        )}

        {otherHeadlines.map((item) => (
          <article key={item.id} className="headline-card">
            <div className="headline-image">
              <img src={item.imageUrl} alt={item.headline} />
              <div className="headline-overlay">
                <h2>{item.headline}</h2>
                <time>
                  {item.timestamp.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

export default GalleryView;
