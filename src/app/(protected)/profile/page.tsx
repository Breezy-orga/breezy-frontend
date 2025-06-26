'use client';

import AppSidebar from '@/components/AppSidebar';
import UserProfile from '@/components/UserProfile';

export default function ProtectedProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 py-10 px-6 w-full">
          <div className="w-full max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
            <UserProfile userId="self" />
          </div>
        </main>
      </div>
    </div>
  );
}
