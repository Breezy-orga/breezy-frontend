`use client`

import { useState, useEffect } from 'react';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import type { Post as PostType } from '@/types/models';

interface LikeButtonProps {
  itemId: string;
  itemType: 'post' | 'comment';
  parentId?: string;          // ajouté pour gérer les commentaires
  initialLikes: number;
  initialLikedStatus: boolean;
  onLikeSuccess?: (updatedPost: PostType) => void;
  size?: 'small' | 'normal';
}

const fetchUserId = async (): Promise<string | null> => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiBaseUrl}/profile/me`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Échec récupération userId');
    const data = await res.json();
    return data._id || null;
  } catch (err) {
    console.error('Erreur fetchUserId:', err);
    return null;
  }
};

export default function LikeButton({
  itemId,
  itemType,
  parentId,
  initialLikes,
  initialLikedStatus,
  onLikeSuccess,
  size = 'normal',
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLikedStatus);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserId().then(setUserId);
  }, []);

  useEffect(() => {
    setIsLiked(initialLikedStatus);
    setLikesCount(initialLikes);
  }, [initialLikedStatus, initialLikes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;

    // calcul du nouvel état
    const newLiked = !isLiked;
    setIsProcessing(true);
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    // construction de l'endpoint
    let endpoint: string;
    if (itemType === 'comment') {
      if (!parentId) {
        console.error('parentId is required for comment likes');
        setIsProcessing(false);
        return;
      }
      endpoint = `/api/posts/${parentId}/comments/${itemId}/like`;
    } else {
      endpoint = `/api/posts/${itemId}/like`;
    }

    // méthode POST pour commentaires (toggle côté backend), POST/DELETE pour posts
    const method = itemType === 'comment' ? 'POST' : (newLiked ? 'POST' : 'DELETE');

    try {
      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Erreur lors du like: ${response.status}`);
      }
      // optionnel : récupérer la ressource mise à jour
      // if (onLikeSuccess) {
      //   const updated = await response.json();
      //   onLikeSuccess(updated);
      // }
    } catch (error) {
      console.error('Erreur lors du like:', error);
      // rollback local en cas d'erreur
      setIsLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      className={`flex items-center gap-1 ${isProcessing ? 'opacity-70' : ''}`}
      onClick={handleLike}
      disabled={isProcessing}
      aria-label={isLiked ? 'Retirer le like' : 'Aimer'}
      title={isLiked ? 'Retirer le like' : 'Aimer'}
    >
      {isLiked ?
        <MdFavorite className={size === 'small' ? 'w-4 h-4 text-red-500' : 'w-5 h-5 text-red-500'} /> :
        <MdFavoriteBorder className={size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} />
      }
      <span>{likesCount}</span>
    </button>
  );
}
