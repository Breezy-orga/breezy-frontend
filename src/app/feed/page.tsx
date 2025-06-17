"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MdAddCircle, MdEdit, MdAutoAwesome, MdPoll, MdEvent, 
  MdNotifications, MdPerson, MdSettings, MdLightMode, 
  MdDarkMode, MdLogout, MdPersonAdd, MdShare, MdLink, 
  MdSend, MdThumbUp, MdEmojiEvents, MdSentimentVerySatisfied, 
  MdSentimentDissatisfied, MdChatBubbleOutline, MdImage, 
  MdGif, MdExpandMore, MdHome, MdMail, MdRepeat, 
} from 'react-icons/md';
import { FaRegSmile } from 'react-icons/fa';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import PostForm from '@/components/PostForm';
import PostList from '@/components/PostList';

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

<<<<<<< Updated upstream
function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const notifCount = 3;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Image src="/logo_breezy.png" alt="Breezy logo" width={36} height={36} />
        <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight">Breezy</span>
      </div>
      <div className="flex-1 flex justify-center">
        <input type="text" placeholder="Rechercher..." className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
      </div>
      <div className="flex items-center gap-4 relative">
        {/* Bouton Créer */}
        <div className="relative">
          <button onClick={() => setCreateMenuOpen(v => !v)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold shadow hover:opacity-90 transition text-base flex items-center gap-2">
            <MdAddCircle className="text-xl" /> Créer
          </button>
          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-40 animate-fade-in">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-2"><MdEdit className="text-xl" /> Nouveau post</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-2"><MdAutoAwesome className="text-xl" /> Story</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-2"><MdPoll className="text-xl" /> Sondage</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-2"><MdEvent className="text-xl" /> Événement</button>
            </div>
          )}
        </div>
        {/* Notifications (garder juste le bouton) */}
        <button onClick={() => setNotifOpen(v => !v)} className="relative text-gray-600 hover:text-blue-700 transition">
          <MdNotifications className="text-3xl" />
          {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{notifCount}</span>}
        </button>
        {/* Menu utilisateur */}
        <div className="relative">
          <button onClick={() => setUserMenuOpen(v => !v)} className="flex items-center gap-2 focus:outline-none">
            <Image src="/pp1.jpg" alt="Mon profil" width={36} height={36} className="rounded-full border border-gray-200" />
            <MdExpandMore className="text-gray-500" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-40 animate-fade-in">
              <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdPerson className="text-xl" /> Mon profil</Link>
              <Link href="/settings" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdSettings className="text-xl" /> Paramètres</Link>
              <div className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2 cursor-pointer" onClick={() => {
                toggleTheme();
                setUserMenuOpen(false);
              }}>
                <ThemeToggle />
                <span className="ml-2">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
              </div>
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdLogout className="text-xl" /> Déconnexion</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

=======
>>>>>>> Stashed changes
function Stories() {
  return (
    <div className="flex gap-5 mb-8 overflow-x-auto pb-2">
      {fakeStories.map((story, i) => (
        <div key={story.username} className="flex flex-col items-center group cursor-pointer relative">
          <div className={`rounded-full border-4 ${story.isOnline ? 'border-green-400' : 'border-gray-200 border-gray-200'} p-1 transition-all duration-200 group-hover:scale-105`}>
            <Image src={story.avatar} alt={story.username} width={60} height={60} className="rounded-full object-cover" />
          </div>
          <span className="text-xs text-gray-700 text-gray-700 mt-2">@{story.username}</span>
          {story.isOnline && <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white border-white"></span>}
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

  const handleReact = (type: keyof typeof reactions) => {
    setReactions(r => ({ ...r, [type]: r[type] + 1 }));
  };

  return (
    <div className="bg-white bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 border-gray-100 animate-fade-in relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src={post.user?.avatar || '/default-avatar.png'} alt="Photo profil" width={40} height={40} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            {post.user?.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></span>}
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-1">
              {post.user?.username || 'Utilisateur inconnu'}
              {post.user?.isPremium && <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-pink-400 text-xs text-white rounded-full font-bold">Premium</span>}
            </span>
            <span className="text-gray-500 ml-2">@{post.user?.username || 'utilisateur'}</span>
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
                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-gray-200 transition flex items-center gap-2"><MdLink className="text-xl" /> Copier le lien</button>
                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-gray-200 transition flex items-center gap-2"><MdShare className="text-xl" /> Partager sur X</button>
                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-gray-200 transition flex items-center gap-2"><MdSend className="text-xl" /> Envoyer en message</button>
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
          <textarea value={comment} onChange={e => setComment(e.target.value)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[40px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-900" placeholder="Ajouter un commentaire..." />
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:opacity-90 transition text-base">Envoyer</button>
        </div>
      )}
      {filterTag && (
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">(Filtrage sur le tag <b>{filterTag}</b> — démo visuelle)</div>
      )}
    </div>
  );
}

function Follows() {
  return (
<<<<<<< Updated upstream
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Tendances pour vous</h2>
=======
    <aside className="hidden xl:flex flex-col w-72 bg-white border-l border-gray-100 min-h-screen px-6 py-8 gap-10">
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900">Comptes suivis</h2>
        <div className="flex flex-col gap-5">
          {fakeFollows.map(f => (
            <div key={f.username} className="flex items-center gap-3">
              <Image src={f.avatar} alt="Photo profil" width={36} height={36} className="rounded-full object-cover border border-gray-200" />
              <span className="text-gray-900 font-medium">@{f.username}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Tendances</h2>
>>>>>>> Stashed changes
        <div className="flex flex-col gap-3">
          {fakeTrends.map(t => (
            <div key={t.tag} className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">{t.tag}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.count} posts</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Suggestions d&apos;amis</h2>
        <div className="flex flex-col gap-4">
          {fakeStories.slice(2).map(f => (
            <div key={f.username} className="flex items-center gap-3">
              <Image src={f.avatar} alt="Photo profil" width={32} height={32} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <span className="text-gray-900 font-medium">@{f.username}</span>
              <button className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition">Suivre</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Sidebar() {
  const [active, setActive] = useState('feed');
  const navItems = [
    { key: 'feed', label: "Page d'accueil", icon: MdHome, href: '/feed' },
    { key: 'profile', label: 'Profil', icon: MdPerson, href: '/profile' },
    { key: 'notifications', label: 'Notifications', icon: MdNotifications, href: '/notifications' },
    { key: 'messages', label: 'Messages', icon: MdMail, href: '/messages' },
  ];
  return (
    <aside className="hidden md:flex flex-col w-60 bg-white bg-white border-r border-gray-100 border-gray-100 min-h-screen px-6 py-8 gap-8">
      <nav className="flex flex-col gap-2 text-base font-semibold">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-150 group
              ${active === item.key ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow font-bold scale-[1.04]' : 'text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50'}
            `}
          >
            <item.icon className={`text-xl transition-all duration-150 ${active === item.key ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-700 dark:group-hover:text-blue-300'}`} />
            <span>{item.label}</span>
            {item.key === 'notifications' && <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">3</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default function FeedPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  // Utiliser le thème pour forcer le rendu quand il change
  const { theme } = useTheme();
  const handlePostCreated = () => setRefreshKey((prev) => prev + 1);

  return (
<<<<<<< Updated upstream
    <div 
      key={`feed-${theme}`} // Forcer le rendu quand le thème change 
      className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100"
    >
      <Header />
=======
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
>>>>>>> Stashed changes
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 max-w-2xl mx-auto py-10 px-4">
          <PostForm onPostCreated={handlePostCreated} />
          <div className="mt-8" key={`post-list-container-${refreshKey}-${theme}`}>
            {/* On utilise un div parent avec key pour forcer le rafraîchissement plutôt que de passer key directement à PostList */}
            <PostList
<<<<<<< Updated upstream
=======
              key={refreshKey}
>>>>>>> Stashed changes
              fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/posts/feed`}
            />
          </div>
        </main>
        <Follows />
      </div>
    </div>
  );
}

// Animation utilitaire
// Ajoute dans globals.css :
// @keyframes fade-in { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none;} }
// .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.39,.58,.57,1) both; } 