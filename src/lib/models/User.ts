export interface User {
  _id: string;
  username: string;
  email: string;
  name?: string;
  role: 'user' | 'moderator' | 'admin';
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
}