// Types pour les modèles du frontend (sans dépendance à Mongoose)

export interface User {
  _id: string;
  username: string;
  email?: string;
  role: 'user' | 'moderator' | 'admin';
  profilePicture?: string;
  followers?: string[];
  following?: string[];
  bio?: string;
  role?: 'user' | 'admin' | 'moderator'; // Rôles utilisateurs avec une valeur par défaut
  createdAt?: string;
  updatedAt?: string;
}

export interface SuggestedUser extends Omit<User, 'email' | 'createdAt' | 'updatedAt'> {
  isFollowing?: boolean;
}

export interface Media {
  _id?: string;
  filename?: string;
  url?: string; // Optionnel pour la compatibilité
  type: 'image' | 'video';
  alt?: string;
  base64?: string; // Support pour les images en Base64
  contentType?: string; // Type de contenu pour le décodage
}

export interface Comment {
  _id: string;
  content: string;
  author: User | string;
  medias?: Media[];
  comments: Array<string | Comment>;
  parentPost?: string | null;
  isComment?: boolean;
  isReply?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  content: string;
  author: User | string;
  medias?: Media[];
  parentPost: string;
  parentComment?: string;
  replies?: Comment[];
  repliesCount?: number;
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
