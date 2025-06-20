/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées pour le thème sombre
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#1a2233', // Nouvelle teinte intermédiaire
          900: '#111827',
          950: '#0d131f', // Plus sombre pour les arrière-plans
        },
        primary: {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
      },
      backgroundColor: {
        dark: 'var(--color-bg-dark)',
        'dark-card': 'var(--color-bg-card-dark)',
      },
      textColor: {
        dark: 'var(--color-text-dark)',
        'dark-muted': 'var(--color-text-muted-dark)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
