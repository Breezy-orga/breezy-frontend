'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MdImage, MdClose, MdTag } from 'react-icons/md'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'
import { useTranslation } from 'react-i18next'

import { Post as PostType } from '@/types/models'

interface PostFormProps {
  onPostCreated?: (newPost: PostType) => void
  parentPostId?: string
  placeholder?: string
}

export default function PostForm({ onPostCreated, parentPostId, placeholder  }: PostFormProps) {
  const { t } = useTranslation()
  const effectivePlaceholder = placeholder || t("post.placeholder");

  const [content, setContent] = useState('')
  // Tableaux pour gérer plusieurs médias (max 4)
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video')[]>([]) // Nouveau état pour suivre le type de média
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
  
  // États pour la suggestion de mentions
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{_id: string; username: string; profilePicture?: string}>>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0) // Index de la suggestion sélectionnée avec clavier
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionListRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // ✅ Proxy passe par Next.js → Express → authMiddleware
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
  
  // Fonction pour déboucer la recherche d'utilisateurs (réduit le nombre d'appels API)
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        console.log('Query trop courte, minimum 2 caractères');
        return;
      }
      
      try {
        console.log('Appel API pour recherche utilisateurs:', query);
        const apiUrl = `api/users/search?query=${encodeURIComponent(query)}`;
        console.log('URL API:', apiUrl);
        
        const response = await fetch(
          apiUrl,
          {
            credentials: 'include'
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('Résultats de recherche:', data.length, 'utilisateurs trouvés');
          setMentionSuggestions(data);
        } else {
          console.error('Erreur API:', response.status, response.statusText);
          setMentionSuggestions([]);
        }
      } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        setMentionSuggestions([]);
      }
    }, 300),
    []
  );
  
  // Gère le changement de texte et détecte les mentions
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Sauvegarde la position du curseur
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
    
    // Détecte si on est en train de saisir une mention
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const contentBeforeCursor = newContent.substring(0, cursorPos);
    // Débogage: afficher dans la console pour vérifier
    console.log('Curseur:', cursorPos, 'Texte avant curseur:', contentBeforeCursor);
    
    const match = contentBeforeCursor.match(/@([\w.-]*)$/); // Trouve le dernier @mot avant le curseur
    console.log('Détection de mentions:', match ? `Trouvé "${match[0]}"` : 'Aucune correspondance');
    
    if (match) {
      const query = match[1]; // Le texte après @ mais avant le curseur
      console.log('Recherche utilisateurs pour:', query);
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      setSelectedSuggestionIndex(0); // Réinitialise la sélection quand la requête change
      debouncedSearch(query);
    } else {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
    }
  };
  
  // Insère une mention dans le content à la position du curseur
  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    
    // Trouve le dernier @ dans le texte avant le curseur
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    if (lastAtPos === -1) return;
    
    // Remplace le texte depuis @ jusqu'au curseur par la mention
    const newContent = 
      content.substring(0, lastAtPos) + 
      `@${username} ` + 
      content.substring(cursorPos);
    
    setContent(newContent);
    setShowMentionSuggestions(false);
    
    // Focus le textarea après avoir inséré la mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtPos + username.length + 2; // +2 pour @ et l'espace
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    // Vérifier si le nombre maximum de médias a été atteint
    if (mediaData.length >= 4) {
      alert('Maximum 4 médias par publication')
      return
    }
    
    if (file) {
      // Déterminer si c'est une image ou une vidéo
      const isVideo = file.type.startsWith('video/');
      
      const reader = new FileReader()
      reader.onloadend = () => {
        // Récupère la partie base64 sans le préfixe "data:image/jpeg;base64," ou "data:video/mp4;base64,"
        const base64Result = reader.result as string
        const base64Data = base64Result.split(',')[1]
        
        // Générer un nom de fichier unique
        const filename = `${Date.now()}-${uuidv4().substring(0, 8)}`
        
        // Stocker le media et sa prévisualisation
        setMediaPreviews([...mediaPreviews, base64Result]) // Conserve le format complet pour l'affichage
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
    // Supprimer un média spécifique par son index
    const newPreviews = [...mediaPreviews]
    const newData = [...mediaData]
    const newTypes = [...mediaTypes]
    newPreviews.splice(index, 1)
    newData.splice(index, 1)
    newTypes.splice(index, 1)
    setMediaPreviews(newPreviews)
    setMediaData(newData)
    setMediaTypes(newTypes)
    
    // Réinitialiser le champ de fichier si plus de médias
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
    if ((!content.trim() && !mediaData) || isSubmitting) return

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
      if (!response.ok) {
        throw new Error('Erreur lors de la publication')
      }
      newPost = await response.json()
    }catch (error) {
      alert('erreur lors de la création')}
    try{
      setContent('')
      setMediaPreviews([])
      setMediaData([])
      setMediaTypes([]) // Réinitialiser les types de média
      setTags([])
      setShowTagInput(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (onPostCreated) {
        onPostCreated(newPost)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert(t('post.error_publish'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-4 mb-6 border border-gray-100">
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
              placeholder={effectivePlaceholder}
              maxLength={280}
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
            
            {/* Dropdown de suggestions de mentions - Augmenter z-index et afficher même sans résultats */}
            {showMentionSuggestions && (
              <div 
                ref={suggestionListRef}
                className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {mentionSuggestions.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    {t("post.searching_users")}
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
                            // Générer une miniature à partir de la première frame
                            const video = e.currentTarget;
                            
                            // Attendre un peu pour être sûr que la vidéo est chargée
                            setTimeout(() => {
                              try {
                                // Définir la position sur 1 seconde ou au début si la vidéo est plus courte
                                video.currentTime = Math.min(1, video.duration / 4);
                              } catch (err) {
                                console.error('Erreur lors de la définition du currentTime:', err);
                              }
                            }, 100);
                          }}
                          poster={preview} // Utiliser le preview comme fallback
                        />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md flex items-center gap-1">
                          <span className="text-white font-bold">▶</span> {t("post.video")}
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
              {/* Indicateur du nombre de médias */}
              <div className="mt-1 text-sm text-gray-500">
                {mediaPreviews.length}/4 {t("post.media_count")}
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
                placeholder={t("post.add_tag_placeholder")}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                {t("post.add_tag")}
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
                className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? t('post.submitting') : t('post.publish')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}