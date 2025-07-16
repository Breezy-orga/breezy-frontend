// Types pour les modèles du frontend (sans dépendance à Mongoose)

export interface User {
  _id: string;
  username: string;
  email?: string;
  name?: string;
  role: 'user' | 'moderator' | 'admin';
  profilePicture?: string;
  followers?: string[];
  following?: string[];
  bio?: string;
  
  status?: 'active' | 'suspended' | 'banned';
  suspendedUntil?: string;
  suspensionReason?: string;
  moderationHistory?: string[];
  
  createdAt?: string;
  updatedAt?: string;
}

export interface SuggestedUser extends Omit<User, 'email' | 'createdAt' | 'updatedAt'> {
  isFollowing?: boolean;
}

export interface Media {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  base64?: string; // Ajout du support pour les images en Base64
  contentType?: string; // Ajout du type de contenu pour le décodage
}

export interface Comment {
  _id: string;
  content: string;
  author: User | string;
  postId: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  content: string;
  author: User | string;
  media?: Media[];
  images?: string[];  // URLs des images pour la compatibilité avec PostContent
  likes: string[];
  comments: Comment[] | string[];
  isLiked?: boolean;
  isSaved?: boolean;
  location?: string;
  tags?: string[];  // Tags pour catégoriser les posts
  createdAt: string;
  updatedAt: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ModerationAction {
  _id: string;
  type: 'suspend' | 'ban' | 'unban' | 'warn' | 'delete_content';
  targetUser: string;
  moderator: string;
  reason: string;
  duration?: number;
  targetContent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  reporter: string;
  targetUser?: string;
  targetPost?: string;
  type: 'user' | 'post';
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderator?: string;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}