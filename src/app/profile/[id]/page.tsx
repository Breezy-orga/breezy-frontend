import { Header, Follows } from '@/components/LayoutParts'
import AppSidebar from '@/components/AppSidebar'
import UserProfile from '@/components/UserProfile'

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <UserProfile userId={params.id} />
    </div>
  )
}
