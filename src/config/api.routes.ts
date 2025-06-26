/**
 * Centralized API routes configuration
 * This file contains all the API routes used in the application
 */

export const API_ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  
  // User routes
  USERS: {
    ME: '/users/me',
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    FOLLOWERS: (userId: string) => `/users/${userId}/followers`,
    FOLLOWING: (userId: string) => `/users/${userId}/following`,
    // Route unique pour suivre/ne plus suivre un utilisateur (toggle)
    // Utilise la méthode POST et retourne { following: boolean }
    SEARCH: '/users/search',
  },
  
  // Post routes
  POSTS: {
    BASE: '/posts',
    BY_ID: (id: string) => `/posts/${id}`,
    USER: (userId: string) => `/posts/user/${userId}`,
    LIKE: (postId: string) => `/posts/${postId}/like`,
    UNLIKE: (postId: string) => `/posts/${postId}/unlike`,
    COMMENTS: (postId: string) => `/posts/${postId}/comments`,
  },
  
  // Comment routes
  COMMENTS: {
    BY_ID: (id: string) => `/comments/${id}`,
    LIKE: (commentId: string) => `/comments/${commentId}/like`,
    UNLIKE: (commentId: string) => `/comments/${commentId}/unlike`,
  },
  
  // Message routes
  MESSAGES: {
    BASE: '/messages',
    CONVERSATION: (conversationId: string) => `/messages/${conversationId}`,
    DIRECT: (userId: string) => `/messages/direct/${userId}`,
  },
  
  // Notification routes
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
  
  // Upload routes
  UPLOAD: {
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    FILE: '/upload/file',
  },
} as const;

export type ApiRoute = typeof API_ROUTES;

/**
 * Helper function to get the full API URL
 * @param path The API path (e.g., API_ROUTES.AUTH.LOGIN)
 * @returns Full URL including the API base URL
 */
export const getApiUrl = (path: string): string => {
  // In browser, use relative path (handled by Next.js proxy)
  if (typeof window !== 'undefined') {
    return path;
  }
  
  // On server, use full URL if NEXT_PUBLIC_API_URL is set
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
};
