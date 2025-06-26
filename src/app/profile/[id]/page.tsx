import UserProfile from '@/components/UserProfile'

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <UserProfile userId={params.id} />
    </div>
  )
}
