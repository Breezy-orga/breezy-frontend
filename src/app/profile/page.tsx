import { Header, Follows } from '@/components/LayoutParts'
import AppSidebar from '@/components/AppSidebar'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 w-full">
        <AppSidebar className="hidden md:flex" />
        <main className="flex-1 w-full max-w-full md:max-w-2xl mx-auto py-4 px-2 sm:py-10 sm:px-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mon profil</h1>
          <UserProfile />
        </main>
        <Follows />
      </div>
    </div>
  )
}
