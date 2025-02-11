// src/components/GalleryItem.jsx
export default function GalleryItem({ headline, size = 'small' }) {
  const imageClass = size === 'large' 
    ? 'h-96 object-cover' 
    : 'h-40 object-cover';

  const titleClass = size === 'large'
    ? 'text-xl'
    : 'text-sm';

  return (
    <article className="relative rounded-lg overflow-hidden h-full">
      <img 
        src={headline.imageUrl} 
        alt={headline.headline}
        className={`w-full ${imageClass}`}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
        <h2 className={`text-white font-bold leading-tight font-serif ${titleClass}`}>
          {headline.headline}
        </h2>
        <p className="text-gray-300 text-xs mt-1">
          {headline.timestamp?.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </article>
  )
}
