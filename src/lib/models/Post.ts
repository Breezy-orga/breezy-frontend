export interface Comment {
  author: string;
  content: string;
  createdAt: string;
}

export interface Post {
  author: string;
  content: string;
  images: string[];
  likes: string[];
  comments: Comment[];
  tags: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}