import React, { useState } from 'react';
import Link from 'next/link';

export interface Media {
  url: string;
  base64?: string;
  contentType?: string;
  alt?: string;
  type: 'image' | 'video';
}

interface Props {
  content: string;
  media?: Media[];
  tags?: string[];
  className?: string;
}

export default function PostContent({ content, media = [], tags = [], className = '' }: Props) {
  const [lightbox, setLightbox] = useState<Media | null>(null);

  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Link
            key={index}
            href={`/profile/username/${username}`}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderMedia = () => {
    if (!media.length) return null;
    return (
      <div className={media.length > 1 ? 'grid grid-cols-2 gap-2' : ''}>
        {media.map((m, i) => {
          const src = m.base64
            ? `data:${m.contentType ?? ''};base64,${m.base64}`
            : m.url;
          const isVideo = m.contentType?.startsWith('video/') ?? false;

          if (isVideo) {
            return (
              <video
                key={i}
                src={src}
                controls
                className="w-full max-h-[500px] object-cover rounded-md"
              />
            );
          }

          return (
            <img
              key={i}
              src={src}
              alt={m.alt || ''}
              className="w-full h-auto max-h-[500px] object-cover rounded-md cursor-pointer"
              onClick={() => setLightbox(m)}
            />
          );
        })}
      </div>
    );
  };

  const renderTags = () => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map((tag, index) => (
          <Link
            key={index}
            href={`/search?tag=${encodeURIComponent(tag)}`}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            #{tag}
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {content && (
        <div className="mb-3 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
          {renderContentWithMentions(content)}
        </div>
      )}
      {renderMedia()}
      {renderTags()}

      {/* Lightbox uniquement pour les images */}
      {lightbox && !(lightbox.contentType?.startsWith('video/') ?? true) && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.base64
              ? `data:${lightbox.contentType ?? ''};base64,${lightbox.base64}`
              : lightbox.url}
            alt={lightbox.alt || ''}
            className="max-h-[90vh] max-w-[90vw] rounded-md"
          />
        </div>
      )}
    </div>
  );
}