"use client";
import React from 'react';
import Image from 'next/image';

// Composant simplifié de suggestions à suivre
export function Follows() {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/suggestions')
        setSuggestions((res.data as SuggestedUser[]).map(u => ({
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture || '/default-avatar.png',
          isFollowing: !!u.isFollowing,
          role: u.role || 'user',
        })))
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleFollowToggle = async (userId: string) => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      // Si on vient de suivre, on retire la suggestion
      setSuggestions(prev =>
        prev.filter(user => user._id !== userId)
      );
    } catch (error) {
      console.error('Erreur lors du (un)follow :', error);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 min-h-screen px-6 py-8 gap-10">
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Suggestions d'amis</h2>

        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500">Aucune suggestion disponible.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestions.map(user => (
              <div key={user._id} className="flex items-center gap-3">
                <Image
                  src={user.profilePicture || '/default-avatar.png'}
                  alt="Photo profil"
                  width={32}
                  height={32}
                  className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
                <Link
                  href={`/profile/${user._id}`}
                  className="text-gray-900 dark:text-white font-medium hover:underline"
                >
                  @{user.username}
                </Link>
                <button
                  onClick={() => handleFollowToggle(user._id)}
                  className={`ml-auto px-3 py-1 rounded-lg text-xs font-semibold transition truncate max-w-[80px] ${
                    user.isFollowing
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                  }`}
                >
                  Suivre
                </button>
              </div>
            </div>
            <button className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full transition">Suivre</button>
          </div>
        ))}
      </div>
    </div>
  );
}