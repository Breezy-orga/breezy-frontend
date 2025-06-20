import { useState } from 'react';
import { MessageCircle, Share2 } from 'lucide-react';
import { Post, User } from '@/types/models';
import LikeButton from '../LikeButton';

interface PostActionsProps {
  post: Post;
  currentUser: User;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onShare: (postId: string) => void;
}

export default function PostActions({
  post,
  currentUser,
  onLike,
  onComment,
  onShare,
}: PostActionsProps) {
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser._id));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');

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

  return (
    <div className="p-4 border-t">
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