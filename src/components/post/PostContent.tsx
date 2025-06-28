'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Post, Media } from '../../types/models';
import MediaModal from '../ImageModal';

interface PostContentProps {
  post: Post;
}

export default function PostContent({ post }: PostContentProps) {
  // État pour la modal de média
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string>('');
  const [modalAlt, setModalAlt] = useState<string>('');
  const [modalType, setModalType] = useState<'image' | 'video'>('image');
  const [mentionIds, setMentionIds] = useState<{ [username: string]: string }>({});
  
  // Fonction pour récupérer l'id d'un username
  const fetchUserId = async (username: string) => {
    if (mentionIds[username]) return; // déjà récupéré
    try {
      const res = await fetch(`/api/users/find-id-by-username/${username}`);
      if (res.ok) {
        const data = await res.json();
        setMentionIds(prev => ({ ...prev, [username]: data._id }));
      }
    } catch (e) {
      // ignore si non trouvé
    }
  };

  // Fonction pour ouvrir la modal avec le média sélectionné
  const openMediaModal = (src: string, alt: string = '', type: 'image' | 'video' = 'image') => {
    setModalSrc(src);
    setModalAlt(alt);
    setModalType(type);
    setModalOpen(true);
  };
  // Fonction pour obtenir la source du média (URL ou base64)
  const getMediaSrc = (media: Media, index: number): string => {
    // Si il y a des données base64, les convertir en data URL
    if (media.base64 && media.contentType) {
      return `data:${media.contentType};base64,${media.base64}`;
    }
    
    // Si c'est une URL externe complète
    if (media.url && (media.url.startsWith('http://') || media.url.startsWith('https://'))) {
      return media.url;
    }
    
    // Si c'est une URL relative ou absolue locale
    if (media.url) {
      return media.url;
    }
    
    // Fallback pour l'ancienne structure de données
    if ((media as any).data) {
      return (media as any).data;
    }
    
    // Sinon, on utilise la nouvelle route API avec postId et index
    // Format: /media/post/:postId/media/:mediaIndex?format=raw
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Éviter le doublon /api/api en vérifiant si l'URL de base contient déjà /api
    return `${apiBaseUrl}/media/post/${post._id}/media/${index}?format=raw`;
  };

  // Fonction pour transformer les mentions en liens cliquables
  const renderContentWithMentions = (content: string) => {
    if (!content) return '';
    
    // Regex pour détecter les mentions @username
    const mentionRegex = /@([\w.-]+)/g;
    const segments = [];
    let lastIndex = 0;
    let match;
    
    // Parcourir toutes les correspondances de mentions
    while ((match = mentionRegex.exec(content)) !== null) {
      // Ajouter le texte avant la mention
      if (match.index > lastIndex) {
        segments.push(content.substring(lastIndex, match.index));
      }
      
      // Ajouter la mention comme un lien
      const username = match[1];
      useEffect(() => { fetchUserId(username); }, [username]);
      segments.push(
        <Link 
          key={`mention-${match.index}`}
          href={`/profile/${mentionIds[username] || username}`}
          className="text-blue-500 hover:text-blue-700 hover:underline"
        >
          @{username}
        </Link>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du texte après la dernière mention
    if (lastIndex < content.length) {
      segments.push(content.substring(lastIndex));
    }
    
    return segments;
  };

  return (
    <div className="p-4">
      <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
        {renderContentWithMentions(post.content)}
      </p>
      
      {/* Affichage des médias (limité à 4) */}
      {post.medias && post.medias.length > 0 && (
        <div className={`mt-4 grid ${post.medias.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
          {post.medias.slice(0, 4).map((media: Media, index: number) => {
            const imageSrc = getMediaSrc(media, index);
            return (
              <div key={index} className="relative aspect-square cursor-pointer" 
                onClick={() => {
                  // Déterminer si c'est une image ou une vidéo
                  const type = media.contentType?.startsWith('video/') ? 'video' : 'image';
                  openMediaModal(imageSrc, media.alt || `Post media ${index + 1}`, type);
                }}>
                {media.contentType?.startsWith('video/') ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    {/* Video thumbnail avec effet de preview */}
                    <div className="w-full h-full relative">
                      <video
                        src={imageSrc}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        onLoadedMetadata={(e) => {
                          // Générer une miniature à partir d'un moment intéressant
                          const video = e.currentTarget;
                          setTimeout(() => {
                            try {
                              // Mettre le curseur à ~1 seconde ou 25% de la vidéo pour une meilleure prévisualisation
                              video.currentTime = Math.min(1, video.duration / 4);
                            } catch (err) {}
                          }, 50);
                        }}
                      />
                      {/* Overlay avec effet de hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-10 transition-all flex items-center justify-center">
                        <span className="flex items-center gap-2 text-white font-medium bg-black bg-opacity-60 hover:bg-opacity-80 px-4 py-2 rounded-lg transition-all">
                          <span className="text-xl">▶️</span> Vidéo
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={imageSrc}
                    alt={media.alt || `Post media ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                )}
                {/* Indicateur de nombre total si plus de 4 médias */}
                {index === 3 && post.medias && post.medias.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    +{post.medias.length - 4}
                  </div>
                )}
              </div>
            );
          })}
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
      
      {/* Modal pour afficher les médias en grand */}
      <MediaModal
        isOpen={modalOpen}
        src={modalSrc}
        alt={modalAlt}
        mediaType={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}