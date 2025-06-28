'use client';

import { useState, useEffect } from 'react';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import type { Post as PostType } from '@/types/models';

interface LikeButtonProps {
  itemId: string;
  itemType: 'post' | 'comment';
  initialLikes: number;
  initialLikedStatus: boolean;
  onLikeSuccess?: (updatedPost: PostType) => void;
  size?: 'small' | 'normal';
}

const fetchUserId = async (): Promise<string | null> => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiBaseUrl}/profile/me`, {
      credentials: 'include'
    });
    console.log(res.status);
    if (!res.ok) throw new Error('Échec récupération userId');
    const data = await res.json();
    return data._id || null;
  } catch (err) {
    console.error('Erreur fetchUserId:', err);
    return null;
  }
};


/**
 * Composant réutilisable pour gérer les likes sur les posts et commentaires
 */
export default function LikeButton({
  itemId,
  itemType,
  initialLikes,
  initialLikedStatus,
  onLikeSuccess,
  size = 'normal'
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLikedStatus);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'userId au montage du composant
  useEffect(() => {
    fetchUserId().then(setUserId);
  }, []);

  // Synchronise l'état du composant avec les props si elles changent
  useEffect(() => {
    setIsLiked(initialLikedStatus);
    setLikesCount(initialLikes);
  }, [initialLikedStatus, initialLikes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing) return;

    setIsProcessing(true);

    // Mise à jour locale immédiate du like et compteur
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }

    try {
      const endpoint = itemType === 'comment'
        ? `/api/comments/${itemId}/like`
        : `/api/posts/${itemId}/like`;

      // Pour les commentaires, on utilise toujours POST (le backend gère le toggle)
      // Pour les posts, on garde le système POST/DELETE
      const method = itemType === 'comment' ? 'POST' : (newIsLiked ? 'POST' : 'DELETE');

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erreur lors du like: ${response.status} ${response.statusText}`);
      }

      // if (onLikeSuccess) {
      //   const updatedPost = await response.json();
      //   onLikeSuccess(updatedPost);
      // }
      
    } catch (error) {
      console.error('Erreur lors du like:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <button
      type="button" 
      className={`flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors duration-200 ${isProcessing ? 'opacity-70' : ''}`}
      onClick={handleLike}
      disabled={isProcessing}
      aria-label={isLiked ? 'Retirer le like' : 'Aimer'}
      title={isLiked ? 'Retirer le like' : 'Aimer'}
    >
      {isLiked ? 
        <MdFavorite className={size === 'small' ? "w-4 h-4 text-red-500" : "w-5 h-5 text-red-500"} /> : 
        <MdFavoriteBorder className={size === 'small' ? "w-4 h-4" : "w-5 h-5"} />
      }
      <span>{likesCount}</span>
    </button>
  );
}
