export interface User {
  _id: string;
  username: string;
  displayName?: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
}