import { Types } from 'mongoose';

export interface User {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  profilePicture: string;
  bio: string;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface Post {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  images: string[];
  likes: Types.ObjectId[];
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