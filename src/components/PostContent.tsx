import React, { useState } from 'react';

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
  className?: string;
}

export default function PostContent({ content, media = [], className = '' }: Props) {
  const [lightbox, setLightbox] = useState<Media | null>(null);

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

  return (
    <div className={className}>
      {content && <p className="mb-2 whitespace-pre-wrap">{content}</p>}
      {renderMedia()}

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
