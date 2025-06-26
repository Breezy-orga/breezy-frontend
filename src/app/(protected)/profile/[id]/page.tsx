'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppSidebar from '@/components/AppSidebar';
import UserProfile from '../../../../components/UserProfile';

export default function ProtectedPublicProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 max-w-4xl mx-auto py-6 px-4 w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
              <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Profil public</h1>
              <UserProfile userId={userId} />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
