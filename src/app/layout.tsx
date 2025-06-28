import './globals.css'
import { ThemeProvider } from '@/components/ThemeProviderWrapper';
import { LanguageProvider } from '@/components/LanguageProvider';
import { NotificationProvider } from '../contexts/NotificationContext';
import { UserProvider } from '../contexts/UserContext';
import I18nProvider from '@/components/I18nProvider';
import MainLayout from '@/components/MainLayout'
import { CurrentUserProvider } from '@/context/CurrentUserContext'
import Script from 'next/script'
import 'flag-icons/css/flag-icons.min.css';



export const metadata = {
  title: 'Breezy',
  description: 'A breath of fresh share',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <UserProvider>
              <NotificationProvider>
                <MainLayout>
                  {children}
                </MainLayout>
              </NotificationProvider>
            </UserProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}