import './globals.css'
import { ThemeProvider } from '@/components/ThemeProviderWrapper';
import { NotificationProvider } from '../contexts/NotificationContext';
import MainLayout from '@/components/MainLayout'
import Script from 'next/script'
import '../i18n';
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}