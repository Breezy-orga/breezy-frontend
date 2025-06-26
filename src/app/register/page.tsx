'use client';

import Image from 'next/image';
import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-50 via-white to-white text-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-1">
        {/* Left column: logo + slogan with halo */}
        <div className="hidden md:flex flex-col justify-center items-center flex-1 relative p-8">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-100 dark:bg-blue-900/30 opacity-60 dark:opacity-20 blur-3xl z-0" />
          <div className="relative z-10 flex flex-col items-center">
            <Image 
              src="/logo_breezy.png" 
              alt="Breezy logo" 
              width={200}
              height={200}
              priority 
              className="mb-8 drop-shadow-2xl"
            />
            <h1 className="text-5xl font-extrabold text-blue-700 dark:text-blue-400 mb-4">Breezy</h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300 font-medium">
              A breath of fresh share
            </p>
          </div>
        </div>
        
        {/* Right column: Signup Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-l-4 border-blue-200 dark:border-blue-700">
            <SignupForm />
            
            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                >
                 {t("register.signin")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 px-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Breezy • 
          <Link href="/about" className="hover:text-gray-700 transition-colors">{t("footer.about")}</Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">{t("footer.terms")}</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">{t("footer.privacy")}</Link>
          <Link href="/contact" className="hover:text-gray-700 transition-colors">{t("footer.contact")}</Link>
         
        </div>
      </footer>
    </div>
  );
}