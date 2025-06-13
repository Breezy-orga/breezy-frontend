import { Header, Sidebar, Follows } from '@/components/LayoutParts'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
          <UserProfile />
        </main>
        <Follows />
      </div>
    </div>
  )
}
