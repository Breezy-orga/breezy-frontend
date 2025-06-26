export interface User {
  _id: string;
  username: string;
  email: string;
  pseudonym?: string;  // Pseudonyme modifiable qui s'affiche à la place du username
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
}