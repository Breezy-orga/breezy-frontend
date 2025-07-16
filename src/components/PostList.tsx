import { useState, useEffect } from 'react';
import Post from './Post';
import { Post as PostType, User } from '@/types/models';

interface PostListProps {
  initialPosts: PostType[];
  fetchUrl: string;
  onDelete: (postId: string) => void;
  onLike?: (postId: string, update: { liked: boolean; totalLikes: number }) => void;
}

export default function PostList({ 
  initialPosts, 
  fetchUrl, 
  onDelete, 
  onLike 
}: PostListProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me', { 
          credentials: 'include' 
        });
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Synchroniser avec les props
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Charger les posts depuis l'URL
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch(fetchUrl, {
          credentials: 'include'
        });
        if (response.ok) {
          const newPosts = await response.json();
          setPosts(newPosts);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [fetchUrl]);

  // Gérer les likes localement et notifier le parent
  const handleLike = (postId: string, update: { liked: boolean; totalLikes: number }) => {
    console.log('handleLike dans PostList:', postId, update);
    
    // Mettre à jour l'état local
    if (currentUser) {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const userId = currentUser._id;
            let newLikes = [...(post.likes || [])];
            
            if (update.liked) {
              // Ajouter le like s'il n'existe pas déjà
              if (!newLikes.includes(userId)) {
                newLikes.push(userId);
              }
            } else {
              // Retirer le like
              newLikes = newLikes.filter(id => id !== userId);
            }
            
            return { ...post, likes: newLikes };
          }
          return post;
        })
      );
    }
    
    // Notifier le parent
    onLike?.(postId, update);
  };

  const handleComment = async (postId: string, updatedPost: PostType) => {
    // Mettre à jour le post avec les  commentaires
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId ? updatedPost : post
      )
    );
  };

  const handleShare = (postId: string) => {
    // Logique de partage
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => console.log('Lien copié'))
      .catch(() => console.error('Erreur lors de la copie'));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton loading */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="space-y-1">
                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <Post
          key={post._id}
          post={post}
          currentUser={currentUser}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onDelete={onDelete}
        />
      ))}
      
      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun post à afficher
          </p>
        </div>
      )}
    </div>
  );
}