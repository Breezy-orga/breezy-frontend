'use client';

import { useState, useEffect } from 'react';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
interface LikeButtonProps {
  itemId: string;
  itemType: 'post' | 'comment';
  initialLikes: number;
  initialLikedStatus: boolean;
  onLikeSuccess?: () => void;
  size?: 'small' | 'normal';
}

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
    
    try {
      // Construire l'URL en fonction du type d'item
      const endpoint = itemType === 'comment' 
        ? `/comments/${itemId}/like` 
        : `/posts/${itemId}/like`;
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
      console.log(`Like ${itemType} : ${url}`);

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors du like: ${response.status} ${response.statusText}`);
      }
      
      // Mettre à jour l'état local
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      // Notifier le composant parent si besoin
      if (onLikeSuccess) onLikeSuccess();
    } catch (error) {
      console.error('Erreur lors du like:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
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
