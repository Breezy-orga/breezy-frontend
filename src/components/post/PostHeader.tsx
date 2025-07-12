import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { formatRelativeDate } from '@/i18n/formatRelativeDate';
import { User } from '@/types/models';

interface PostHeaderProps {
  author: User;
  createdAt: Date;
  location?: string;
}

export default function PostHeader({ author, createdAt, location }: PostHeaderProps) {
  const { t } = useTranslation();
  
  const displayName = author.name || author.username;
  
  return (
    <div className="flex items-center space-x-3 p-4">
      <Link href={`/profile/${author._id}`}>
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
        <Link href={`/profile/${author._id}`}>
          <div className="flex items-center gap-2 hover:underline">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </h3>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              @{author.username}
            </span>
          </div>
        </Link>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{formatRelativeDate(createdAt.toISOString(), t)}</span>
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