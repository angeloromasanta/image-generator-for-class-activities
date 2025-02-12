// GalleryView.jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

function GalleryView() {
  const [headlines, setHeadlines] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [animatingHeadlines, setAnimatingHeadlines] = useState(new Set());

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
      
      // Delete images from Storage and documents from Firestore
      await Promise.all(headlines.map(async (headline) => {
        const imageRef = ref(storage, headline.imageUrl);
        await deleteObject(imageRef);
        const docRef = doc(db, 'headlines', headline.id);
        batch.delete(docRef);
      }));

      await batch.commit();
    } catch (error) {
      console.error('Error clearing headlines:', error);
      alert('Failed to clear headlines. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const removeHeadline = async (id, imageUrl) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      await writeBatch(db).delete(doc(db, 'headlines', id)).commit();
    } catch (error) {
      console.error('Error removing headline:', error);
      alert('Failed to remove headline. Please try again.');
    }
  };

  const animateImage = async (headline) => {
    if (animatingHeadlines.has(headline.id)) return;
    
    setAnimatingHeadlines(prev => new Set([...prev, headline.id]));
    
    try {
      await updateDoc(doc(db, 'headlines', headline.id), {
        isAnimating: true
      });

      const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_RUNWAYML_API_SECRET}`,
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify({
          promptImage: headline.imageUrl,
          promptText: headline.headline,
          model: 'gen3a_turbo'
        })
      });

      if (!response.ok) {
        throw new Error('Animation failed');
      }

      // Handle animation response...
      
    } catch (error) {
      console.error('Animation error:', error);
      alert('Failed to animate image. Please try again.');
    } finally {
      setAnimatingHeadlines(prev => {
        const newSet = new Set(prev);
        newSet.delete(headline.id);
        return newSet;
      });
      await updateDoc(doc(db, 'headlines', headline.id), {
        isAnimating: false
      });
    }
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
            <div className="headline-controls">
              <button 
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHeadline(newestHeadline.id, newestHeadline.imageUrl);
                }}
              >
                ×
              </button>
              <button 
                className="animate-button"
                onClick={(e) => {
                  e.stopPropagation();
                  animateImage(newestHeadline);
                }}
                disabled={animatingHeadlines.has(newestHeadline.id)}
              >
                {animatingHeadlines.has(newestHeadline.id) ? '⌛' : '▶'}
              </button>
            </div>
            <div className="headline-image">
              <img 
                src={newestHeadline.imageUrl}
                alt={newestHeadline.headline}
                onClick={() => setSelectedImage(newestHeadline.imageUrl)}
              />
              <div className="headline-overlay">
                <div className="headline-content">
                  <span className="breaking-news">Breaking News</span>
                  <h2>{newestHeadline.headline}</h2>
                  <div className="headline-meta">
                    <span className="team-name">Team: {newestHeadline.teamName}</span>
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
            </div>
          </article>
        )}

        {otherHeadlines.map((item) => (
          <article key={item.id} className="headline-card">
            <div className="headline-controls">
              <button 
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHeadline(item.id, item.imageUrl);
                }}
              >
                ×
              </button>
              <button 
                className="animate-button"
                onClick={(e) => {
                  e.stopPropagation();
                  animateImage(item);
                }}
                disabled={animatingHeadlines.has(item.id)}
              >
                {animatingHeadlines.has(item.id) ? '⌛' : '▶'}
              </button>
            </div>
            <div className="headline-image">
              <img 
                src={item.imageUrl}
                alt={item.headline}
                onClick={() => setSelectedImage(item.imageUrl)}
              />
              <div className="headline-overlay">
                <div className="headline-content">
                  <h2>{item.headline}</h2>
                  <div className="headline-meta">
                    <span className="team-name">Team: {item.teamName}</span>
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