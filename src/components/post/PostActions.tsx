import { useState } from 'react';
import { MessageCircle, Share2, MoreHorizontal, Trash2, Edit2, Check, X } from 'lucide-react';
import { Post, User } from '@/types/models';
import LikeButton from '../LikeButton';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface PostActionsProps {
  post: Post;
  currentUser: User;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onShare: (postId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: Post) => void;
}

export default function PostActions({
  post,
  currentUser,
  onLike,
  onComment,
  onShare,
  onPostDeleted,
  onPostUpdated,
}: PostActionsProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser._id));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLike = async () => {
    try {
      // Cette fonction est maintenant utilisée comme callback pour LikeButton
      await onLike(post._id.toString());
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;

    try {
      await onComment(post._id.toString(), commentContent);
      setCommentContent('');
      setIsCommenting(false);
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    setShowOptions(false);
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && (!post.media || post.media.length === 0)) {
      alert('Le post doit contenir du texte ou au moins un média');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await api.put(`/posts/${post._id}`, {
        content: editContent,
        media: post.media || [],
        tags: post.tags || [],
      });

      if (onPostUpdated) {
        onPostUpdated(response.data);
      }
      setIsEditing(false);
      setIsProcessing(false);
    } catch (error) {
      console.error('Erreur lors de la modification du post:', error);
      alert('Une erreur est survenue lors de la modification du post');
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      await api.delete(`/posts/${post._id}`);
      
      if (onPostDeleted) {
        onPostDeleted(post._id);
      } else {
        // Comportement par défaut si la fonction de callback n'est pas fournie
        router.refresh(); // Rafraîchit la page pour refléter la suppression
      }
      setIsDeleting(false);
      setIsProcessing(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du post:', error);
      alert('Une erreur est survenue lors de la suppression du post');
      setIsProcessing(false);
      setIsDeleting(false);
    }
  };
  
  // Vérifier si l'utilisateur est l'auteur du post
  const isAuthor = currentUser && post.author && 
    (typeof post.author === 'string' ? post.author === currentUser._id : post.author._id === currentUser._id);

  return (
    <div className="p-4 border-t">
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Que voulez-vous dire ?"
            className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isProcessing}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={handleCancelEdit}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSaveEdit}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              disabled={isProcessing}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : isDeleting ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 mb-2">Êtes-vous sûr de vouloir supprimer ce post ?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelDelete}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isProcessing}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
              disabled={isProcessing}
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : null}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <LikeButton 
            itemId={post._id.toString()} 
            itemType="post" 
            initialLikes={likeCount} 
            initialLikedStatus={isLiked}
            onLikeSuccess={handleLike} 
          />
          <button
            onClick={() => setIsCommenting(!isCommenting)}
            className="flex items-center space-x-1 text-gray-500"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments.length}</span>
          </button>
          <button
            onClick={() => onShare(post._id.toString())}
            className="text-gray-500"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        
        {isAuthor && !isEditing && !isDeleting && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 py-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <button 
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isCommenting && (
        <div className="mt-4">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={() => setIsCommenting(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleComment}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 