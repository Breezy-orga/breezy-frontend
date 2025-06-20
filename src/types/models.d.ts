export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface Media {
  filename: string;
  base64: string;
  contentType: string;
  alt?: string;
}

export interface Post {
  _id: string;
  author: string;
  content: string;
  images: string[];
  likes: string[];
  comments: Comment[];
  commentsCount?: number; // Nombre total de commentaires (y compris sous-commentaires)
  tags: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  media?: Media[];
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
} 