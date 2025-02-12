import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

function GalleryView() {
  const [headlines, setHeadlines] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const clearAllHeadlines = async () => {
    if (!window.confirm('Are you sure you want to clear all headlines? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      const batch = writeBatch(db);
      
      headlines.forEach((headline) => {
        const docRef = doc(db, 'headlines', headline.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing headlines:', error);
      alert('Failed to clear headlines. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const removeHeadline = async (id) => {
    try {
      await writeBatch(db).delete(doc(db, 'headlines', id)).commit();
    } catch (error) {
      console.error('Error removing headline:', error);
      alert('Failed to remove headline. Please try again.');
    }
  };

  const handleImageClick = (imageData) => {
    setSelectedImage(imageData);
  };

  const newestHeadline = headlines[0];
  const otherHeadlines = headlines.slice(1, 11);

  return (
    <div className="gallery-container">
      <header className="newspaper-header">
        <div className="header-content">
          <h1>The Future Times @ Esade</h1>
          <div className="header-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
        </div>
      </header>

      <main className="gallery-grid">
        {newestHeadline && (
          <article className="featured-headline">
            <button 
              className="remove-button"
              onClick={(e) => {
                e.stopPropagation();
                removeHeadline(newestHeadline.id);
              }}
            >
              ×
            </button>
            <div className="headline-image">
              <img 
                src={newestHeadline.imageData}
                alt={newestHeadline.headline}
                onClick={() => handleImageClick(newestHeadline.imageData)}
                style={{ cursor: 'pointer' }}
              />
              <div className="headline-overlay">
                <div className="headline-content">
                  <span className="breaking-news">Breaking News</span>
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
            </div>
          </article>
        )}

        {otherHeadlines.map((item) => (
          <article key={item.id} className="headline-card">
            <button 
              className="remove-button"
              onClick={(e) => {
                e.stopPropagation();
                removeHeadline(item.id);
              }}
            >
              ×
            </button>
            <div className="headline-image">
              <img 
                src={item.imageData}
                alt={item.headline}
                onClick={() => handleImageClick(item.imageData)}
                style={{ cursor: 'pointer' }}
              />
              <div className="headline-overlay">
                <div className="headline-content">
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
            </div>
          </article>
        ))}

        {headlines.length === 0 && (
          <div className="empty-state">
            No headlines yet. Be the first to make history!
          </div>
        )}
      </main>

      <footer className="gallery-footer">
      <img src="qr-code.png" alt="QR Code" className="qr-code" />
        <button 
          onClick={clearAllHeadlines}
          disabled={isClearing || headlines.length === 0}
          className="clear-button"
        >
          {isClearing ? 'Clearing Archives...' : 'Clear All Headlines'}
        </button>
      </footer>

      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Expanded view" className="modal-image" />
        </div>
      )}
    </div>
  );
}

export default GalleryView;