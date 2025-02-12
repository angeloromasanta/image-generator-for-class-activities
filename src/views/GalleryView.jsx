import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      
      await Promise.all(headlines.map(async (headline) => {
        const imageRef = ref(storage, headline.imageUrl);
        await deleteObject(imageRef);
        
        // Also delete animation if it exists
        if (headline.animationUrl) {
          const videoRef = ref(storage, `animations/${headline.id}.mp4`);
          try {
            await deleteObject(videoRef);
          } catch (error) {
            if (error.code !== 'storage/object-not-found') {
              console.error('Error deleting animation:', error);
            }
          }
        }
        
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
      // Delete image from Storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      // Check if there's an animation and delete it too
      const videoRef = ref(storage, `animations/${id}.mp4`);
      try {
        await deleteObject(videoRef);
      } catch (error) {
        if (error.code !== 'storage/object-not-found') {
          throw error;
        }
      }
      
      // Delete the document
      await writeBatch(db).delete(doc(db, 'headlines', id)).commit();
    } catch (error) {
      console.error('Error removing headline:', error);
      alert('Failed to remove headline. Please try again.');
    }
  };

  const animateImage = async (headline) => {
    if (animatingHeadlines.has(headline.id)) return;
    
    console.log('Starting animation for headline:', headline.id);
    setAnimatingHeadlines(prev => new Set([...prev, headline.id]));
    
    try {
      await updateDoc(doc(db, 'headlines', headline.id), {
        isAnimating: true
      });
      console.log('Updated isAnimating status in Firestore');

      const startAnimation = async () => {
        console.log('Making initial animation request');
        const response = await fetch('/api/animate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptImage: headline.imageUrl,
            promptText: headline.headline,
            headlineId: headline.id
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Animation request failed:', error);
          throw new Error(error.message || 'Animation failed');
        }

        const result = await response.json();
        console.log('Animation request result:', result);
        
        if (result.status === 'processing') {
          console.log('Starting polling process');
          let attempts = 0;
          const maxAttempts = 30;
          
          while (attempts < maxAttempts) {
            attempts++;
            console.log(`Polling attempt ${attempts}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const pollResponse = await fetch('/api/check-animation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: result.id
              })
            }).catch(error => {
              console.error('Polling request failed:', error);
              throw new Error('Network error during polling');
            });
            
            if (!pollResponse.ok) {
              const errorData = await pollResponse.json();
              console.error('Poll response not OK:', errorData);
              throw new Error(`Polling failed: ${errorData.message || pollResponse.statusText}`);
            }
            
            const pollResult = await pollResponse.json();
            console.log('Poll result:', pollResult);
            
            if (pollResult.status === 'success' && pollResult.videoData) {
              console.log('Successfully received video data');
              return pollResult;
            } else if (pollResult.status === 'failed') {
              console.error('Animation processing failed:', pollResult);
              throw new Error(pollResult.message || 'Animation processing failed');
            }
            console.log('Still processing, continuing to poll...');
          }
          throw new Error('Animation timed out after 60 seconds');
        }
        
        return result;
      };

      const animationResult = await startAnimation();
      console.log('Animation completed, processing result');
      
      if (animationResult.status === 'success' && animationResult.videoData) {
        console.log('Converting video data to blob');
        const videoBlob = await fetch(`data:${animationResult.contentType};base64,${animationResult.videoData}`)
          .then(res => res.blob());
        
        console.log('Uploading to Firebase Storage');
        const videoRef = ref(storage, `animations/${headline.id}.mp4`);
        await uploadBytes(videoRef, videoBlob, {
          contentType: 'video/mp4'
        });
        
        console.log('Getting download URL');
        const videoUrl = await getDownloadURL(videoRef);
        console.log('Video URL:', videoUrl);
        
        console.log('Updating Firestore document');
        await updateDoc(doc(db, 'headlines', headline.id), {
          animationUrl: videoUrl
        });
        console.log('Successfully updated document with animation URL');
      }
      
    } catch (error) {
      console.error('Animation error:', error);
      alert('Failed to animate image: ' + error.message);
    } finally {
      setAnimatingHeadlines(prev => {
        const newSet = new Set(prev);
        newSet.delete(headline.id);
        return newSet;
      });
      await updateDoc(doc(db, 'headlines', headline.id), {
        isAnimating: false
      });
      console.log('Animation process completed');
    }
  };

  const newestHeadline = headlines[0];
  const otherHeadlines = headlines.slice(1);

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
              {newestHeadline.animationUrl ? (
                <video 
                  src={newestHeadline.animationUrl}
                  alt={newestHeadline.headline}
                  onClick={() => setSelectedImage(newestHeadline.animationUrl)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="headline-video"
                />
              ) : (
                <img 
                  src={newestHeadline.imageUrl}
                  alt={newestHeadline.headline}
                  onClick={() => setSelectedImage(newestHeadline.imageUrl)}
                />
              )}
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
              {item.animationUrl ? (
                <video 
                  src={item.animationUrl}
                  alt={item.headline}
                  onClick={() => setSelectedImage(item.animationUrl)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="headline-video"
                />
              ) : (
                <img 
                  src={item.imageUrl}
                  alt={item.headline}
                  onClick={() => setSelectedImage(item.imageUrl)}
                />
              )}
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
          {selectedImage.endsWith('.mp4') ? (
            <video 
              src={selectedImage} 
              className="modal-video"
              autoPlay
              loop
              muted
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={selectedImage} 
              alt="Expanded view" 
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default GalleryView;