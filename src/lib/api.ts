import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { User, Post, Comment } from '@/types';
import { API_ROUTES, getApiUrl } from '@/config/api.routes';

// Normaliser l'URL de base de l'API
const normalizeBaseUrl = (url: string | undefined, defaultUrl: string) => {
  if (!url) return defaultUrl;
  // Supprimer les / à la fin de l'URL
  return url.replace(/\/+$/, '');
};

// Définir l'URL de base de l'API
const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL,
  'http://localhost:5000/api' // URL par défaut en développement
);

// Crée une instance axios avec une configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important pour envoyer les cookies avec les requêtes cross-origin
  timeout: 10000, // Timeout de 10 secondes
});

// Intercepteur pour ajouter les en-têtes nécessaires à chaque requête
api.interceptors.request.use(
  (config) => {
    // Journalisation des requêtes en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    
    // S'assurer que les credentials sont inclus pour toutes les requêtes
    config.withCredentials = true;
    
    // Ajouter le token d'authentification si disponible
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Fonction utilitaire pour déterminer si une erreur est une erreur réseau
const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && !error.status;
};

// Fonction utilitaire pour déterminer si une erreur est une erreur de timeout
const isTimeoutError = (error: AxiosError): boolean => {
  return error.code === 'ECONNABORTED' || (!!error.message && error.message.includes('timeout'));
};

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    // Vous pouvez ajouter ici un traitement global pour les réponses réussies si nécessaire
    return response;
  },
  async (error: unknown) => {
    // Vérifier si c'est une erreur Axios
    if (!axios.isAxiosError(error)) {
      const unknownError: ApiErrorResponse = {
        message: 'Une erreur inconnue est survenue',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
      };
      return Promise.reject(unknownError);
    }
    
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Récupérer la configuration de la requête originale
    const originalRequest = axiosError.config as (AxiosRequestConfig & { _retry?: boolean }) || {};
    
    // Log détaillé des erreurs pour le débogage (uniquement en développement)
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        url: originalRequest.url,
        method: originalRequest.method,
        data: axiosError.response?.data,
        code: axiosError.code,
        isAxiosError: true,
        config: originalRequest,
      });
    }

    // Gestion des erreurs réseau
    if (!axiosError.response && !axiosError.status) {
      console.error('Erreur réseau - Vérifiez votre connexion internet');
      const networkError: ApiErrorResponse = {
        message: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
        isNetworkError: true,
        code: 'NETWORK_ERROR',
        statusCode: 0
      };
      return Promise.reject(networkError);
    }

    // Gestion des timeouts
    if (axiosError.code === 'ECONNABORTED' || (axiosError.message && axiosError.message.includes('timeout'))) {
      console.error('La requête a expiré - Le serveur met trop de temps à répondre');
      const timeoutError: ApiErrorResponse = {
        message: 'Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.',
        isTimeout: true,
        code: 'TIMEOUT_ERROR',
        statusCode: 504
      };
      return Promise.reject(timeoutError);
    }
    
    // Si l'erreur est une erreur d'authentification (401)
    if (axiosError.response?.status === 401 && typeof window !== 'undefined') {
      // Si c'est une requête de login, on laisse passer l'erreur
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject({
          ...(axiosError.response?.data || {}),
          isAuthError: true,
          requiresLogin: true
        });
      }
      
      // Sinon, on redirige vers la page de connexion
      if (!window.location.pathname.startsWith('/login')) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
      
      const authError: ApiErrorResponse = {
        message: 'Session expirée. Veuillez vous reconnecter.',
        isAuthError: true,
        requiresLogin: true,
        code: 'UNAUTHORIZED',
        statusCode: 401
      };
      
      return Promise.reject(authError);
    }

    // Si le token est expiré ou invalide (403)
    if (axiosError.response?.status === 403 && typeof window !== 'undefined') {
      console.warn('Accès refusé - Token expiré ou invalide');
      
      // Si on n'est pas déjà sur la page de connexion, on redirige
      if (!window.location.pathname.startsWith('/login')) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
      
      const authError: ApiErrorResponse = {
        message: 'Session expirée. Veuillez vous reconnecter.',
        isAuthError: true,
        requiresLogin: true,
        code: 'FORBIDDEN',
        statusCode: 403
      };
      
      return Promise.reject(authError);
    }
    
    // Gestion des autres erreurs HTTP
    const errorResponse = axiosError.response?.data as ApiErrorResponse | undefined;
    const errorMessage = errorResponse?.message || axiosError.message || 'Une erreur est survenue';
    const status = axiosError.response?.status || 500;
    
    const apiError: ApiErrorResponse & { isAxiosError?: boolean; status?: number } = {
      message: errorMessage,
      statusCode: status,
      status,
      isAxiosError: true,
      code: axiosError.code || 'UNKNOWN_ERROR',
      ...(errorResponse || {})
    };
    
    return Promise.reject(apiError);
  }
);

// Interface pour les erreurs d'API
export interface ApiErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  error?: string;
  isAxiosError?: boolean;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  requiresLogin?: boolean;
  [key: string]: any;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
  statusCode?: number;
}

// Type pour la pagination
export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {}

// Type pour la configuration étendue des requêtes
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _isRetry?: boolean;
}

// Type pour les erreurs d'API
export interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: {
    data?: any;
    status?: number;
    statusText?: string;
    headers?: any;
  };
  config?: AxiosRequestConfig;
  isAxiosError: boolean;
  toJSON: () => object;
}

// Fonction utilitaire pour gérer les erreurs API
export const handleApiError = (error: unknown): never => {
  // Si c'est une erreur Axios
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    
    // Créer un objet d'erreur enrichi
    const apiError: ApiError = {
      ...error,
      isAxiosError: true,
      status,
      code: error.code || 'UNKNOWN_ERROR',
      response: {
        data: responseData,
        status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
      },
      toJSON: () => ({
        message: error.message,
        status,
        code: error.code,
        response: {
          data: responseData,
          status,
          statusText: error.response?.statusText,
        },
      }),
    };
    
    // Si c'est une erreur d'authentification, on peut ajouter une redirection ici
    if (status === 401 || status === 403) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    
    throw apiError;
  }
  
  // Si c'est une erreur standard
  if (error instanceof Error) {
    const standardError: ApiError = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      isAxiosError: false,
      toJSON: () => ({
        message: error.message,
        name: error.name,
        stack: error.stack,
      }),
    };
    throw standardError;
  }
  
  // Pour les autres types d'erreurs
  throw new Error('Une erreur inconnue est survenue');
};

// Wrapper pour les appels API avec gestion d'erreur
export const apiRequest = async <T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await request;
    
    // Vérifier si la réponse est valide
    if (!response.data) {
      throw new Error('Réponse du serveur invalide');
    }
    
    // Si la requête a réussi mais que le backend signale une erreur
    if (!response.data.success) {
      const error = new Error(response.data.message || 'Erreur inconnue du serveur');
      (error as any).response = response;
      throw error;
    }
    
    // Retourner les données si tout est OK
    return response.data.data as T;
  } catch (error) {
    return handleApiError(error);
  }
};

// Authentification
export const authApi = {
  // Récupérer l'utilisateur actuellement connecté
  getMe: (): Promise<User> => 
    api.get(API_ROUTES.AUTH.ME)
      .then(res => {
        // Le backend renvoie directement l'objet utilisateur
        if (!res.data) {
          throw new Error('Aucune donnée utilisateur reçue');
        }
        return res.data as User;
      })
      .catch(error => {
        console.error('Error in authApi.getMe:', error);
        throw error;
      }),
  
  // Se connecter
  login: (credentials: { email: string; password: string }) => 
    api.post(API_ROUTES.AUTH.LOGIN, credentials).then(res => res.data),
  
  // S'inscrire
  register: (userData: { username: string; email: string; password: string }) => 
    api.post(API_ROUTES.AUTH.REGISTER, userData).then(res => res.data),
  
  // Se déconnecter
  logout: () => 
    api.post(API_ROUTES.AUTH.LOGOUT).then(res => res.data),
  
  // Rafraîchir le token
  refreshToken: () => 
    api.post(API_ROUTES.AUTH.REFRESH).then(res => res.data),
};

// Utilisateurs
export const userApi = {
  /**
   * Met à jour le profil de l'utilisateur actuellement connecté (PUT /users/me)
   * @param userData Données du profil à mettre à jour (JSON, peut contenir avatar/banner base64)
   * @returns L'utilisateur mis à jour
   */
  updateMe: (userData: Partial<User>): Promise<{ user: User }> =>
    apiRequest(
      api.put(API_ROUTES.USERS.ME, userData, {
        headers: { 'Content-Type': 'application/json' }
      })
    ),
  // Récupérer un utilisateur par son ID
  getUser: (userId: string): Promise<{ user: User }> => 
    apiRequest(api.get(API_ROUTES.USERS.BY_ID(userId))),
  
  // Mettre à jour un utilisateur
  updateUser: (userId: string, userData: FormData): Promise<{ user: User }> => 
    apiRequest(
      api.put(API_ROUTES.USERS.BY_ID(userId), userData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    ),
  
  // Suivre/Ne plus suivre un utilisateur (toggle)
  // Retourne { following: boolean } indiquant le nouvel état
  toggleFollow: (userId: string): Promise<{ following: boolean }> =>
    apiRequest(api.post(`/users/${userId}/follow`)),
  
  // Récupérer les abonnés d'un utilisateur
  getFollowers: (userId: string): Promise<{ followers: User[] }> =>
    apiRequest(api.get(API_ROUTES.USERS.FOLLOWERS(userId))),
  
  // Récupérer les abonnements d'un utilisateur
  getFollowing: (userId: string): Promise<{ following: User[] }> =>
    apiRequest(api.get(API_ROUTES.USERS.FOLLOWING(userId))),
  
  // Rechercher des utilisateurs
  searchUsers: (query: string): Promise<{ users: User[] }> =>
    apiRequest(
      api.get(API_ROUTES.USERS.SEARCH, { params: { q: query } })
    ),
};

// Publications
export const postApi = {
  // Récupérer les publications d'un utilisateur
  getUserPosts: (userId: string, params?: { page?: number; limit?: number }): Promise<{ posts: Post[] }> => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[getUserPosts] Aucun token JWT trouvé dans localStorage lors de la récupération des posts utilisateur.');
      }
    }
    return apiRequest(
      api.get(API_ROUTES.POSTS.USER(userId), { params })
    );
  },
  
  // Récupérer une publication par son ID
  getPost: (postId: string): Promise<{ post: Post }> =>
    apiRequest(api.get(API_ROUTES.POSTS.BY_ID(postId))),
  
  // Créer une publication
  createPost: (postData: FormData): Promise<{ post: Post }> =>
    apiRequest(
      api.post(API_ROUTES.POSTS.BASE, postData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    ),
  
  // Mettre à jour une publication
  updatePost: (postId: string, postData: FormData): Promise<{ post: Post }> =>
    apiRequest(
      api.put(API_ROUTES.POSTS.BY_ID(postId), postData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    ),
  
  // Supprimer une publication
  deletePost: (postId: string): Promise<{ message: string }> =>
    apiRequest(api.delete(API_ROUTES.POSTS.BY_ID(postId))),
  
  // Aimer une publication
  likePost: (postId: string): Promise<{ message: string; likes: number }> =>
    apiRequest(api.post(API_ROUTES.POSTS.LIKE(postId))),
  
  // Ne plus aimer une publication
  unlikePost: (postId: string): Promise<{ message: string; likes: number }> =>
    apiRequest(api.delete(API_ROUTES.POSTS.UNLIKE(postId))),
  
  // Récupérer les commentaires d'une publication
  getComments: (postId: string): Promise<{ comments: Comment[] }> =>
    apiRequest(api.get(API_ROUTES.POSTS.COMMENTS(postId))),
  
  // Ajouter un commentaire
  addComment: (postId: string, content: string): Promise<{ comment: Comment }> =>
    apiRequest(
      api.post(API_ROUTES.POSTS.COMMENTS(postId), { content })
    ),
  
  // Supprimer un commentaire
  deleteComment: (commentId: string): Promise<{ message: string }> =>
    apiRequest(api.delete(API_ROUTES.COMMENTS.BY_ID(commentId))),
  
  // Aimer un commentaire
  likeComment: (commentId: string): Promise<{ message: string; likes: number }> =>
    apiRequest(api.post(API_ROUTES.COMMENTS.LIKE(commentId))),
  
  // Ne plus aimer un commentaire
  unlikeComment: (commentId: string): Promise<{ message: string; likes: number }> =>
    apiRequest(api.delete(API_ROUTES.COMMENTS.UNLIKE(commentId))),
};

// Messages
export const messageApi = {
  // Récupérer les conversations
  getConversations: (): Promise<{ conversations: any[] }> =>
    apiRequest(api.get(API_ROUTES.MESSAGES.BASE)),
  
  // Récupérer les messages d'une conversation
  getMessages: (conversationId: string): Promise<{ messages: any[] }> =>
    apiRequest(api.get(API_ROUTES.MESSAGES.CONVERSATION(conversationId))),
  
  // Envoyer un message
  sendMessage: (conversationId: string, content: string): Promise<{ message: any }> =>
    apiRequest(
      api.post(API_ROUTES.MESSAGES.CONVERSATION(conversationId), { content })
    ),
  
  // Envoyer un message direct
  sendDirectMessage: (userId: string, content: string): Promise<{ message: any }> =>
    apiRequest(
      api.post(API_ROUTES.MESSAGES.DIRECT(userId), { content })
    ),
};

// Notifications
export const notificationApi = {
  // Récupérer les notifications
  getNotifications: (): Promise<{ notifications: any[] }> =>
    apiRequest(api.get(API_ROUTES.NOTIFICATIONS.BASE)),
  
  // Récupérer le nombre de notifications non lues
  getUnreadCount: (): Promise<{ count: number }> =>
    apiRequest(api.get(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT)),
  
  // Marquer une notification comme lue
  markAsRead: (notificationId: string): Promise<{ message: string }> =>
    apiRequest(api.patch(API_ROUTES.NOTIFICATIONS.MARK_AS_READ(notificationId))),
  
  // Marquer toutes les notifications comme lues
  markAllAsRead: (): Promise<{ message: string }> =>
    apiRequest(api.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ)),
};

// Téléversement de fichiers
export const uploadApi = {
  // Téléverser une image
  uploadImage: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest(
      api.post(API_ROUTES.UPLOAD.IMAGE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  },
  
  // Téléverser une vidéo
  uploadVideo: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest(
      api.post(API_ROUTES.UPLOAD.VIDEO, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  },
  
  // Téléverser un fichier
  uploadFile: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest(
      api.post(API_ROUTES.UPLOAD.FILE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  },
};

export default api;
