// Normalize API_BASE_URL: remove trailing slash and do not append '/api' if already present
function normalizeBaseUrl(url: string | undefined, fallback: string) {
  if (!url) return fallback;
  // Remove trailing slash
  let clean = url.replace(/\/$/, '');
  return clean;
}

const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL, '/api');
const BACKEND_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL, 'http://localhost:5000/api');

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  },
  USERS: {
    PROFILE: (id: string) => `${API_BASE_URL}/users/${id}`,
    FOLLOWERS: (id: string) => `${API_BASE_URL}/users/followers/${id}`,
    FOLLOWING: (id: string) => `${API_BASE_URL}/users/following/${id}`,
  },
  POSTS: {
    FEED: (following = false) => `${API_BASE_URL}/posts/feed${following ? '?following=true' : ''}`,
    USER: (userId: string) => `${API_BASE_URL}/posts/user/${userId}`,
  },
};

export const BACKEND_ROUTES = {
  AUTH: {
    LOGIN: `${BACKEND_URL}/auth/login`,
    // Add other backend routes as needed
  },
};
