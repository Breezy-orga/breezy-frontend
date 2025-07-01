'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MdImage, MdClose, MdTag } from 'react-icons/md'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'
import { Post as PostType } from '@/types/models'

interface PostFormProps {
  onPostCreated?: (newPost: PostType) => void
  parentPostId?: string
  placeholder?: string
}

export default function PostForm({ onPostCreated, parentPostId, placeholder = "Quoi de neuf ?" }: PostFormProps) {
  const [content, setContent] = useState('')
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video')[]>([])
  const [mediaData, setMediaData] = useState<{
    filename: string;
    base64: string;
    contentType: string;
  }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  // Mentions
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{_id: string; username: string; profilePicture?: string}>>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include'
        })
        if (response.ok) {
          setUser(await response.json())
        }
      } catch {
        console.error('Échec récupération utilisateur')
      }
    }
    fetchUser()
  }, [])

  // Mention auto-suggest
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setMentionSuggestions([])
        return;
      }
      try {
        const apiUrl = `/api/users/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(apiUrl, { credentials: 'include' });
        if (response.ok) {
          setMentionSuggestions(await response.json());
        } else {
          setMentionSuggestions([]);
        }
      } catch {
        setMentionSuggestions([]);
      }
    }, 300),
    []
  );
  
  // Gère le changement de texte + détection mentions
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // position du curseur
    if (textareaRef.current) setCursorPosition(textareaRef.current.selectionStart);

    // Détection mention
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const contentBeforeCursor = newContent.substring(0, cursorPos);
    const match = contentBeforeCursor.match(/@([\w.-]*)$/);
    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      setSelectedSuggestionIndex(0);
      debouncedSearch(query);
    } else {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
    }
  };

  // Gestion navigation suggestions avec le clavier
  useEffect(() => {
    if (!showMentionSuggestions) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mentionSuggestions.length === 0) return;
      if (e.key === 'ArrowDown') {
        setSelectedSuggestionIndex((prev) => (prev + 1) % mentionSuggestions.length);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelectedSuggestionIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (mentionSuggestions[selectedSuggestionIndex]) {
          insertMention(mentionSuggestions[selectedSuggestionIndex].username);
          e.preventDefault();
        }
      } else if (e.key === 'Escape') {
        setShowMentionSuggestions(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMentionSuggestions, mentionSuggestions, selectedSuggestionIndex, content]);

  // Insère la mention dans le champ texte à la position du curseur
  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    if (lastAtPos === -1) return;
    const newContent =
      content.substring(0, lastAtPos) +
      `@${username} ` +
      content.substring(cursorPos);
    setContent(newContent);
    setShowMentionSuggestions(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtPos + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Upload média
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (mediaData.length >= 4) {
      alert('Maximum 4 médias par publication')
      return
    }
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Result = reader.result as string
        const base64Data = base64Result.split(',')[1]
        const filename = `${Date.now()}-${uuidv4().substring(0, 8)}`
        setMediaPreviews([...mediaPreviews, base64Result])
        setMediaTypes([...mediaTypes, isVideo ? 'video' : 'image'])
        setMediaData([...mediaData, {
          filename,
          base64: base64Data,
          contentType: file.type
        }])
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = (index: number) => {
    const newPreviews = [...mediaPreviews]
    const newData = [...mediaData]
    const newTypes = [...mediaTypes]
    newPreviews.splice(index, 1)
    newData.splice(index, 1)
    newTypes.splice(index, 1)
    setMediaPreviews(newPreviews)
    setMediaData(newData)
    setMediaTypes(newTypes)
    if (newData.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()])
      setTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !mediaData.length) || isSubmitting) return

    setIsSubmitting(true)
    let newPost
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          parentPost: parentPostId,
          media: mediaData,
          tags: tags.length > 0 ? tags : undefined
        })
      })
      if (!response.ok) throw new Error('Erreur lors de la publication')
      newPost = await response.json()
    } catch (error) {
      alert('Erreur lors de la création')
    }
    try {
      setContent('')
      setMediaPreviews([])
      setMediaData([])
      setMediaTypes([])
      setTags([])
      setShowTagInput(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (onPostCreated && newPost) {
        onPostCreated(newPost)
      }
    } catch (error) {
      alert('Une erreur est survenue lors de la publication')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-800">
      <div className="flex gap-3">
        <Image
          src={user?.username === 'daemon' ? '/me.jpg' : (user?.profilePicture || '/default-avatar.svg')}
          alt="Votre avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder={placeholder}
              maxLength={280}
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
            {showMentionSuggestions && (
              <div 
                ref={suggestionListRef}
                className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {mentionSuggestions.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    Recherche d'utilisateurs...
                  </div>
                ) : (
                  mentionSuggestions.map((user, index) => (
                    <div 
                      key={user._id}
                      onClick={() => insertMention(user.username)}
                      className={`flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                        <Image 
                          src={user.profilePicture || '/default-avatar.svg'} 
                          alt={user.username}
                          width={32} 
                          height={32} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">@{user.username}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <div className="relative aspect-square">
                    {mediaTypes[index] === 'video' ? (
                      <div className="w-full h-full rounded-lg overflow-hidden relative">
                        <video 
                          src={preview}
                          className="w-full h-full object-contain"
                          controls
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            setTimeout(() => {
                              try {
                                video.currentTime = Math.min(1, video.duration / 4);
                              } catch {}
                            }, 100);
                          }}
                          poster={preview}
                        />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md flex items-center gap-1">
                          <span className="text-white font-bold">▶</span> Vidéo
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-contain rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 text-white rounded-full p-1"
                    >
                      <MdClose />
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-1 text-sm text-gray-500">
                {mediaPreviews.length}/4 médias
              </div>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  #{tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center text-blue-800"
                  >
                    <MdClose className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {showTagInput && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ajouter un tag (sans #)"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setShowTagInput(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="mt-4 flex justify-between">
            <div className="flex space-x-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-500 hover:text-blue-600">
                <MdImage className="text-xl" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="text-blue-500 hover:text-blue-600"
              >
                <MdTag className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {content.length}/280
              </span>
              <button
                type="submit"
                disabled={(!content.trim() && mediaData.length === 0) || isSubmitting}
                className="
                  px-4 py-2 
                  bg-blue-500 hover:bg-blue-600 
                  dark:bg-blue-500 dark:hover:bg-blue-600
                  text-white rounded-full font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-colors
                "
              >
                {isSubmitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
