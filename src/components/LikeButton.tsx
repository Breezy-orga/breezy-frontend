'use client';

import { useState, useEffect } from 'react';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';

import { useTranslation } from 'react-i18next';

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
    const res = await fetch('/api/profile/me', {
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
  const { t } = useTranslation();

  const [userId, setUserId] = useState<string | null>(null);


  // Synchronise l'état du composant avec les props si elles changent
  useEffect(() => {
    fetchUserId().then(setUserId);
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
      const endpoint =
        itemType === 'comment'
          ? `api/comments/${itemId}/like`
          : `api/posts/${itemId}/like`;

      const response = await fetch(endpoint, {
        method: 'POST',
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
      aria-label={isLiked ? t('post.remove') : t('post.add')}
      title={isLiked ? t('post.remove') : t('post.add')}
    >
      {isLiked ? 
        <MdFavorite className={size === 'small' ? "w-4 h-4 text-red-500" : "w-5 h-5 text-red-500"} /> : 
        <MdFavoriteBorder className={size === 'small' ? "w-4 h-4" : "w-5 h-5"} />
      }
      <span>{likesCount}</span>
    </button>
  );
}
