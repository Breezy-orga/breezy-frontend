'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MdThumbUp, MdShare, MdLink, MdRepeat, 
  MdChatBubbleOutline, MdComment, MdPersonAdd, MdSend, 
  MdHome,
  MdMail,
  MdNotifications,
  MdPerson
} from 'react-icons/md';
import { FaRegSmile } from 'react-icons/fa';
import PostForm from '@/components/PostForm';
import PostList from '@/components/PostList';
import { useTranslation } from 'react-i18next';
import 'flag-icons/css/flag-icons.min.css';
import { Post as PostType } from '@/types/models'


interface Story {
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface User {
  name: string;
  username: string;
  avatar: string;
  isPremium: boolean;
  isOnline: boolean;
  level: number;
}

interface Poll {
  question: string;
  options: string[];
  votes: number[];
}

interface Post {
  id: number;
  user?: User | null;
  date: string;
  content: string;
  image: string | null;
  reactions: {
    like: number;
    bravo: number;
    haha: number;
    sad: number;
  };
  comments: number;
  poll: Poll | null;
}

interface Trend {
  tag: string;
  count: number;
}

const fakeStories = [
  { username: 'alice', avatar: '/pp1.jpg', isOnline: true },
  { username: 'bob', avatar: '/pp2.jpg', isOnline: false },
  { username: 'carla', avatar: '/pp3.jpg', isOnline: true },
  { username: 'david', avatar: '/pp4.jpg', isOnline: false },
  { username: 'emma', avatar: '/pp5.jpg', isOnline: true },
];

const fakePosts = [
  {
    id: 1,
    user: {
      name: 'Alice Dupont',
      username: 'alice',
      avatar: '/pp1.jpg',
      isPremium: true,
      isOnline: true,
      level: 5,
    },
    date: 'il y a 2h',
    content: 'Premier post sur Breezy ! Hâte de partager avec vous tous. #bienvenue',
    image: '/pp4.jpg',
    reactions: { like: 12, bravo: 3, haha: 1, sad: 0 },
    comments: 2,
    poll: null,
  },
  {
    id: 2,
    user: {
      name: 'Bob Martin',
      username: 'bob',
      avatar: '/pp2.jpg',
      isPremium: false,
      isOnline: false,
      level: 2,
    },
    date: 'il y a 1h',
    content: "Quelqu'un a des recommandations de séries à regarder ?",
    image: null,
    reactions: { like: 2, bravo: 0, haha: 2, sad: 1 },
    comments: 1,
    poll: {
      question: 'Séries préférées ?',
      options: ['Dark', 'Stranger Things', 'The Office', 'Autre'],
      votes: [2, 1, 0, 1],
    },
  },
];

const fakeFollows = [
  { username: 'alice', avatar: '/pp1.jpg' },
  { username: 'bob', avatar: '/pp2.jpg' },
  { username: 'carla', avatar: '/pp3.jpg' },
];

const fakeTrends = [
  { tag: '#bienvenue', count: 12 },
  { tag: '#séries', count: 8 },
  { tag: '#breezy', count: 5 },
  { tag: '#dev', count: 3 },
];

function Stories() {
  return (
    <div className="flex gap-5 mb-8 overflow-x-auto pb-2">
      {fakeStories.map((story, i) => (
        <div key={story.username} className="flex flex-col items-center group cursor-pointer relative">
          <div className={`rounded-full border-4 ${story.isOnline ? 'border-green-400' : 'border-gray-200 dark:border-gray-700'} p-1 transition-all duration-200 group-hover:scale-105`}>
            <Image src={story.avatar} alt={story.username} width={60} height={60} className="rounded-full object-cover" />
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 mt-2">@{story.username}</span>
          {story.isOnline && <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></span>}
        </div>
      ))}
    </div>
  );
}

function Poll({ poll }: { poll: Poll }) {
  const total = poll.votes.reduce((a: number, b: number) => a + b, 0);
  return (
    <div className="mt-3">
      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{poll.question}</div>
      {poll.options.map((opt: string, i: number) => (
        <div key={i} className="mb-2 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/50 h-1 flex-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 dark:bg-blue-400 h-full" style={{ width: `${total ? (poll.votes[i] / total * 100) : 0}%` }} />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{poll.votes[i]} vote{poll.votes[i] > 1 ? 's' : ''}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Post({ post }: { post: Post }) {
  const [reactions, setReactions] = useState(post.reactions);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { t } = useTranslation();
  const handleReact = (type: keyof typeof reactions) => {
    setReactions(r => ({ ...r, [type]: r[type] + 1 }));
  };

  return (
    <div className="bg-white bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 border-gray-100 animate-fade-in relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src={post.user?.avatar || '/default-avatar.png'} alt={t('profile.profile_picture')} width={40} height={40} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            {post.user?.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></span>}
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-1">
              {post.user?.username || t('profile.unknown_user')}
              {post.user?.isPremium && <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-pink-400 text-xs text-white rounded-full font-bold">{t('profile.premium')}</span>}
            </span>
            <span className="text-gray-500 ml-2">@{post.user?.username || t('profile.unknown_username')}</span>
            <span className="text-gray-400 ml-2 text-sm">{post.date}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition" title="Suivre">
            <MdPersonAdd className="text-xl" />
          </button>
          <div className="relative">
            <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded transition" title="Partager" onClick={() => setShowShare(v => !v)}>
              <MdShare className="text-xl" />
            </button>
            {showShare && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 animate-fade-in">
                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-gray-200 transition flex items-center gap-2"><MdLink className="text-xl" /> {t('post.copy_link')}</button>
                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-gray-200 transition flex items-center gap-2"><MdShare className="text-xl" /> {t('post.share_on_x')}</button>
                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-gray-200 transition flex items-center gap-2"><MdSend className="text-xl" /> {t('post.send_message')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-gray-900 mb-4 whitespace-pre-line text-base">
        {post.content.split(' ').map((word, i) => word.startsWith('#') ? (
          <button key={i} className="text-blue-500 cursor-pointer hover:underline inline" onClick={() => setFilterTag(word)}>{word} </button>
        ) : word + ' ')}
      </div>
      {post.image && <Image src={post.image} alt="media" width={400} height={200} className="rounded-xl mb-3 object-cover max-h-60 w-full" />}
      {post.poll && <Poll poll={post.poll} />}
      <div className="flex gap-2">
        <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition group" onClick={() => handleReact('like')}>
          <MdThumbUp className="text-xl group-active:scale-125 transition-transform" /> {reactions.like}
        </button>
        <button className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition group">
          <MdRepeat className="text-xl group-active:scale-125 transition-transform" />
        </button>
        <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition group" onClick={() => setShowComment(v => !v)}>
          <MdChatBubbleOutline className="text-xl" /> {post.comments}
        </button>
        <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition group" onClick={() => setShowShare(v => !v)}>
          <MdShare className="text-xl" />
        </button>
      </div>
      {showComment && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative animate-fade-in">
          <Image src="/pp1.jpg" alt="Moi" width={32} height={32} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          <textarea value={comment} onChange={e => setComment(e.target.value)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[40px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-900" placeholder={t('post.add_comment')} />
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:opacity-90 transition text-base">{t('post.send')}</button>
        </div>
      )}
      {filterTag && (
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">({t('post.filtering_on_tag', { tag: filterTag })}— {t('post.visual_demo')})</div>
      )}
    </div>
  );
}


function Follows() {
  const { t } = useTranslation();
  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('rightbar.trends')}</h2>
        <div className="flex flex-col gap-3">
          {fakeTrends.map(tend => (
            <div key={tend.tag} className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">{tend.tag}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{tend.count} {t('rightbar.posts')}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('rightbar.suggested_friends')}</h2>
        <div className="flex flex-col gap-4">
          {fakeStories.slice(2).map(f => (
            <div key={f.username} className="flex items-center gap-3">
              <Image src={f.avatar} alt={t('rightbar.profile_picture')} width={32} height={32} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <span className="text-gray-900 font-medium">@{f.username}</span>
              <button className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition">{t('rightbar.follow')}</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<PostType[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation();
  useEffect(() => {
    fetch(`/api/posts/feed`)
      .then(res => res.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

  const handlePostCreated = (newPost: PostType) => {
    console.log(newPost)
    // Ajouter le nouveau post en tête de liste
    setPosts(prev => [newPost, ...prev])
  }

  // URL de l'API en fonction de l'onglet actif
  const getFetchUrl = () => {
    if (activeTab === 'following') {
      return `/api/posts/feed?following=true`;
    } else {
      return `/api/posts/feed`;
    }
  };

return (
  <div className="w-full font-sans text-gray-900 dark:text-white">
    <PostForm onPostCreated={handlePostCreated} />
    {/* Onglets Pour Toi / Abonnement */}
    <div className="flex border-b border-gray-200 dark:border-gray-700 mt-6 mb-4">
      <button 
        onClick={() => setActiveTab('all')}
        className={`px-4 py-3 font-medium text-sm relative ${activeTab === 'all' 
          ? 'text-blue-600 dark:text-blue-400 font-semibold' 
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
      >
        {t('feed.for_you')}
        {activeTab === 'all' && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
        )}
      </button>
      <button 
        onClick={() => setActiveTab('following')}
        className={`px-4 py-3 font-medium text-sm relative ${activeTab === 'following' 
          ? 'text-blue-600 dark:text-blue-400 font-semibold' 
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
      >
        {t('feed.following')}
        {activeTab === 'following' && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
        )}
      </button>
    </div>
    
    <div className="mt-4">
      <PostList
        initialPosts={posts}
        fetchUrl={getFetchUrl()}
      />
    </div>
  </div>
);

}

