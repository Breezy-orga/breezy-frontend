import { useState } from 'react';
import Image from 'next/image';

interface Media {
  data: string;
  contentType?: string;
}

interface PostContentProps {
  content: string;
  media?: Media | null;
  className?: string;
}

export default function PostContent({ content, media, className = '' }: PostContentProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Vérifier si le média est une image ou une vidéo
  const isImage = media?.contentType?.startsWith('image/') || 
                 (media?.data?.startsWith('data:image/') && !media?.data?.includes(';base64,undefined'));

  // Si le média est vide ou invalide, ne rien afficher
  if (!media?.data || imageError) {
    return (
      <div className={`${className} break-words`}>
        {content && <p className="whitespace-pre-line">{content}</p>}
      </div>
    );
  }


  return (
    <div className={`${className} space-y-2`}>
      {content && <p className="whitespace-pre-line">{content}</p>}
      
      {isImage ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={media.data}
            alt=""
            className={`w-full h-auto max-h-[500px] object-cover transition-opacity duration-200 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
        </div>
      ) : null}
    </div>
  );
}