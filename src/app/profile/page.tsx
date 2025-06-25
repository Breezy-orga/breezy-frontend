'use client'
import { Header, Follows } from '@/components/LayoutParts'
import AppSidebar from '@/components/AppSidebar'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage({params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>
          <UserProfile userId={params.id} />
        </main>
        <Follows />
      </div>
    </div>
  )
}
