'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { MdMoreVert, MdDelete, MdChatBubbleOutline } from 'react-icons/md';
import LikeButton from './LikeButton';
import PostForm from './PostForm';
import { Comment, User } from '@/types/models';

interface CommentsListProps {
  comments: Comment[];
  currentUser: User | null;
  onCommentUpdate: () => void;
  onCommentDelete?: (commentId: string) => void;
  formatDate: (date: string) => string;
  maxDepth?: number;
}

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  onCommentUpdate: () => void;
  onCommentDelete?: (commentId: string) => void;
  formatDate: (date: string) => string;
  depth?: number;
  maxDepth?: number;
  replies?: Comment[];
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onCommentUpdate,
  onCommentDelete,
  formatDate,
  depth = 0,
  maxDepth = 3,
  replies = []
}) => {
  const { t } = useTranslation();
  const [isReplying, setIsReplying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const author = typeof comment.author === 'object' ? comment.author : null;
  const isOwnComment = currentUser?._id === author?._id;
  const hasReplies = replies.length > 0;
  const canReply = depth < maxDepth;
  
  // Indentation progressive avec une limite
  const indentationLevel = Math.min(depth, 4);
  const indentationClass = `comment-indent-${indentationLevel}`;
  
  const handleReplySubmit = () => {
    setIsReplying(false);
    onCommentUpdate();
  };

  const handleDelete = async () => {
    if (!window.confirm(t('comment.confirmDelete'))) return;
    
    try {
      const response = await fetch(`/api/comments/${comment._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        onCommentDelete?.(comment._id);
        onCommentUpdate();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(t('comment.deleteError'));
    }
  };

  return (
    <div className={`${indentationClass} border-l-2 border-gray-100 dark:border-gray-700`}>
      <div className="pl-4 py-3">
        {/* Header du commentaire */}
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <Link href={`/profile/${author?._id}`} className="flex-shrink-0">
            <Image
              src={author?.profilePicture || '/default-avatar.svg'}
              alt={author?.displayName || author?.username || 'User'}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          </Link>

          {/* Contenu du commentaire */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              {/* En-tête avec nom et menu */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/profile/${author?._id}`}
                    className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {author?.displayName || author?.username}
                  </Link>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                
                {/* Menu options */}
                {isOwnComment && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <MdMoreVert size={16} />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button
                          onClick={handleDelete}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <MdDelete size={14} />
                          <span>{t('comment.delete')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contenu du commentaire */}
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {comment.content}
              </div>

              {/* Médias du commentaire */}
              {comment.medias && comment.medias.length > 0 && (
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(comment.medias.length, 2)}, 1fr)` }}>
                  {comment.medias.map((media, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden">
                      {media.contentType?.startsWith('video/') ? (
                        <video
                          src={media.base64 ? `data:${media.contentType};base64,${media.base64}` : media.url}
                          controls
                          className="w-full h-auto rounded-lg"
                        />
                      ) : (
                        <Image
                          src={media.base64 ? `data:${media.contentType};base64,${media.base64}` : media.url || '/default-image.png'}
                          alt={media.alt || 'Comment image'}
                          width={200}
                          height={200}
                          className="w-full h-auto object-cover rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions du commentaire */}
            <div className="flex items-center space-x-4 mt-2 text-sm">
              {/* Bouton Like */}
              <LikeButton
                itemId={comment._id}
                itemType="comment"
                initialLikes={comment.likes?.length || 0}
                initialLikedStatus={comment.isLiked || false}
                onLikeSuccess={onCommentUpdate}
                size="small"
              />

              {/* Bouton Répondre */}
              {canReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <MdChatBubbleOutline size={16} />
                </button>
              )}

              {/* Indicateur de réponses */}
              {hasReplies && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {replies.length} {replies.length === 1 ? t('comment.reply') : t('comment.replies')}
                </span>
              )}
            </div>

            {/* Formulaire de réponse */}
            {isReplying && (
              <div className="mt-3">
                <PostForm
                  parentPostId={comment.parentPost}
                  parentCommentId={comment._id}
                  onPostCreated={handleReplySubmit}
                  placeholder={t('comment.replyPlaceholder')}
                  autoFocus={true}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Réponses imbriquées */}
        {hasReplies && (
          <div className="mt-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUser={currentUser}
                onCommentUpdate={onCommentUpdate}
                onCommentDelete={onCommentDelete}
                formatDate={formatDate}
                depth={depth + 1}
                maxDepth={maxDepth}
                replies={[]} // Les réponses aux réponses peuvent être gérées récursivement si nécessaire
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  currentUser,
  onCommentUpdate,
  onCommentDelete,
  formatDate,
  maxDepth = 3
}) => {
  const { t } = useTranslation();

  // Organiser les commentaires de façon hiérarchique
  const organizeComments = (comments: Comment[]) => {
    const commentMap = new Map<string, Comment & { replies: Comment[] }>();
    const rootComments: (Comment & { replies: Comment[] })[] = [];

    // Créer une map de tous les commentaires avec un tableau de réponses vide
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });

    // Organiser la hiérarchie
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment._id)!;
      
      if (comment.parentComment) {
        // C'est une réponse à un autre commentaire
        const parentId = comment.parentComment;
        const parent = commentMap.get(parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        } else {
          // Si le parent n'est pas trouvé, traiter comme commentaire racine
          rootComments.push(commentWithReplies);
        }
      } else {
        // C'est un commentaire de niveau racine
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const organizedComments = organizeComments(comments);

  if (organizedComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>{t('comment.noComments')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {organizedComments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          currentUser={currentUser}
          onCommentUpdate={onCommentUpdate}
          onCommentDelete={onCommentDelete}
          formatDate={formatDate}
          depth={0}
          maxDepth={maxDepth}
          replies={comment.replies}
        />
      ))}
    </div>
  );
};

export default CommentsList;
