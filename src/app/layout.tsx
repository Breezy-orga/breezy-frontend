import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import Script from 'next/script'
import '../i18n';
import 'flag-icons/css/flag-icons.min.css';



const inter = Inter({ subsets: ['latin'] })

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // Script exécuté avant même que React ne charge
          try {
            // Supprimer toute préférence thème existante
            localStorage.removeItem('theme');
            // Définir explicitement le thème clair
            localStorage.setItem('theme', 'light');
            // S'assurer que la classe 'dark' n'est pas sur l'élément HTML
            document.documentElement.classList.remove('dark');
            // Ajouter la classe 'light' explicitement
            document.documentElement.classList.add('light');
          } catch (e) {
            console.error('Erreur lors de l\'initialisation du thème:', e);
          }
        ` }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="absolute top-4 right-4">
            
          </div>
          <main>
            {children}
          </main>
        </ThemeProvider>

      </body>
    </html>
  )
} 