'use client'
import AuthForm from '@/components/AuthForm'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next';
import '../../i18n';



export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-r from-blue-50 via-white to-white text-gray-900">
      <div className="flex flex-1">
        {/* Colonne gauche : logo + slogan avec halo */}
        <div className="hidden md:flex flex-col justify-center items-center flex-1 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-100 opacity-60 blur-2xl z-0" />
          <div className="relative z-10 flex flex-col items-center">
            <Image src="/logo_breezy.png" alt="Breezy logo" width={180} height={180} priority className="mb-6 drop-shadow-2xl" />
            <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Breezy</h1>
            <p className="text-xl text-gray-500 font-medium text-center max-w-xs">A breath of fresh share</p>
          </div>
        </div>
        {/* Colonne droite : AuthForm */}
        <div className="flex flex-col justify-center items-center flex-1 py-12 px-4 sm:px-8 relative">
          <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border-l-8 border-blue-200">
            <AuthForm mode="login" />
          </div>
          {/* Lien inscription */}
          <div className="w-full max-w-md text-center mt-6">
            <span className="text-gray-500">{t('login.no_account')}</span>
            <Link href="/register" className="text-blue-600 hover:underline font-medium">{t('login.signup')}</Link>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <Link href="/about" className="hover:text-gray-700 transition-colors">{t('footer.about')}</Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">{t('footer.terms')}</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">{t('footer.privacy')}</Link>
          <Link href="/contact" className="hover:text-gray-700 transition-colors">{t('footer.contact')}</Link>
          <span>© {new Date().getFullYear()} Breezy</span>
        </div>
      </footer>
    </div>
  )
}