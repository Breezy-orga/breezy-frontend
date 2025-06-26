'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/axios';
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next';
export default function FollowingList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchFollowing = async () => {
      const res = await api.get('/api/users/me/following')
      setUsers(res.data)
    }
    fetchFollowing()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{t("following.title")}</h2>
      {users.map((user: any) => (
        <div key={user._id} className="flex items-center gap-3 mb-3">
          <Image src={user.profilePicture || '/default-avatar.png'} alt="Avatar" width={32} height={32} className="rounded-full" />
          <Link href={`/profile/${user._id}`} className="text-gray-900 dark:text-gray-100">@{user.username}</Link>
        </div>
      ))}
    </div>
  )
}
