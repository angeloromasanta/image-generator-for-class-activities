import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function AudienceView() {
  const [headlines, setHeadlines] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);

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
  const otherHeadlines = headlines.slice(1);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4 px-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800">The Future Times @ Esade</h1>
          <div className="text-center text-gray-600 mt-2">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {newestHeadline && (
          <article className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative aspect-video">
              <div 
                className="cursor-pointer w-full h-full"
                onClick={() => setSelectedMedia({
                  url: newestHeadline.animationUrl || newestHeadline.imageUrl,
                  type: newestHeadline.animationUrl ? 'video' : 'image'
                })}
              >
                {newestHeadline.animationUrl ? (
                  <video 
                    src={newestHeadline.animationUrl}
                    alt={newestHeadline.headline}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={newestHeadline.imageUrl}
                    alt={newestHeadline.headline}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-0 p-4 text-white">
                  <span className="inline-block px-2 py-1 bg-red-600 text-sm font-bold rounded mb-2">
                    Breaking News
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold mb-2">{newestHeadline.headline}</h2>
                  <div className="flex flex-col md:flex-row md:items-center text-sm opacity-90 space-y-1 md:space-y-0 md:space-x-4">
                    <span>Team: {newestHeadline.teamName}</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherHeadlines.map((item) => (
            <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative aspect-video">
                <div 
                  className="cursor-pointer w-full h-full"
                  onClick={() => setSelectedMedia({
                    url: item.animationUrl || item.imageUrl,
                    type: item.animationUrl ? 'video' : 'image'
                  })}
                >
                  {item.animationUrl ? (
                    <video 
                      src={item.animationUrl}
                      alt={item.headline}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={item.imageUrl}
                      alt={item.headline}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="absolute bottom-0 p-4 text-white">
                    <h2 className="text-lg font-bold mb-2">{item.headline}</h2>
                    <div className="flex flex-col text-sm opacity-90 space-y-1">
                      <span>Team: {item.teamName}</span>
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
        </div>

        {headlines.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            Stay tuned! Headlines coming soon...
          </div>
        )}
      </main>

      {selectedMedia && (
  <div 
    className="modal-overlay fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
    onClick={() => setSelectedMedia(null)}
  >
    <div className="modal-content relative max-w-4xl w-full">
      <button 
        className="modal-close absolute -top-10 right-0 text-white text-3xl"
        onClick={() => setSelectedMedia(null)}
      >
        ×
      </button>
      {selectedMedia.type === 'video' ? (
        <video 
          src={selectedMedia.url} 
          className="modal-video w-full h-auto max-h-[80vh]"
          autoPlay
          loop
          controls
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img 
          src={selectedMedia.url} 
          alt="Expanded view" 
          className="modal-image w-full h-auto max-h-[80vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  </div>
)}
    </div>
  );
}

export default AudienceView;