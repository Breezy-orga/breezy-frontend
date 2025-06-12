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

export interface Post {
  _id: string;
  author: string;
  content: string;
  images: string[];
  likes: string[];
  comments: Comment[];
  tags: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
} 