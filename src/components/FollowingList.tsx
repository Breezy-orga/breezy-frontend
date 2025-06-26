import { useEffect, useState } from 'react'
import api from '@/lib/axios';
import Image from 'next/image'
import Link from 'next/link'

export default function FollowingList() {
  const [users, setUsers] = useState([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchFollowers = async () => {
      // Récupérer l'utilisateur connecté
      const meRes = await api.get('/users/me')
      setCurrentUserId(meRes.data._id)
      // Puis ses followers
      const res = await api.get(`/users/${meRes.data._id}/following`)
      setUsers(res.data)
    }
    fetchFollowers()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Abonnements</h2>
      {users.map((user: any) => (
        <div key={user._id} className="flex items-center gap-3 mb-3">
          <Image src={user.profilePicture || '/default-avatar.png'} alt="Avatar" width={32} height={32} className="rounded-full" />
          <Link href={`/profile/${user._id}`} className="text-gray-900 dark:text-gray-100">@{user.username}</Link>
        </div>
      ))}
    </div>
  )
}
