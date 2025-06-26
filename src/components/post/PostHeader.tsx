import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { User } from '@/types/models';

interface PostHeaderProps {
  author: User;
  createdAt: Date;
  location?: string;
}

export default function PostHeader({ author, createdAt, location }: PostHeaderProps) {
  return (
    <div className="flex items-center space-x-3 p-4">
      <Link href={`/(protected)/profile/${author._id}`}>
        <div className="relative h-10 w-10 rounded-full overflow-hidden">
          <Image
            src={author.profilePicture || '/default-avatar.svg'}
            alt={author.username}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <div className="flex-1">
        <Link href={`/(protected)/profile/${author._id}`}>
          <h3 className="font-semibold hover:underline">{author.username}</h3>
        </Link>
        <div className="flex items-center text-sm text-gray-500">
          <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          {location && (
            <>
              <span className="mx-1">•</span>
              <span>{location}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 