'use client'
import { Header, Follows } from '@/components/LayoutParts'
import AppSidebar from '@/components/AppSidebar'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage({params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <UserProfile />
    </div>
  )
}
