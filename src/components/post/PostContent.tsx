import Image from 'next/image';
import { Post, Media } from '../../types/models';

interface PostContentProps {
  post: Post;
}

// Définition de l'interface pour les médias avec base64
interface MediaWithBase64 extends Media {
  url: string; // Assure que url est toujours présent
  alt?: string; // Ajoute la propriété alt optionnelle
  base64?: string;
  contentType?: string;
}

export default function PostContent({ post }: PostContentProps) {
  // Fonction pour obtenir la source de l'image (URL ou base64)
  const getImageSrc = (media: MediaWithBase64): string => {
    if (media.base64) {
      // Si l'image est en base64, on la décode
      return `data:${media.contentType || 'image/jpeg'};base64,${media.base64}`;
    }
    // Sinon, on utilise l'URL
    return media.url;
  };

  return (
    <div className="p-4">
<<<<<<< Updated upstream
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
      {post.images && post.images.length > 0 && (
=======
      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      
      {/* Affichage des médias */}
      {post.media && post.media.length > 0 && (
>>>>>>> Stashed changes
        <div className="mt-4 grid grid-cols-2 gap-2">
          {post.media.map((media: MediaWithBase64, index: number) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={getImageSrc(media)}
                alt={media.alt || `Post media ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Rétrocompatibilité avec l'ancienne propriété images */}
      {(!post.media || post.media.length === 0) && post.images && post.images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {post.images.map((image: string, index: number) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={image}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Affichage des tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}