'use client'
import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function setThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000`;
}

function getThemeCookie(): Theme | null {
  const match = document.cookie.match(/(?:^|; )theme=(light|dark)/);
  return match ? (match[1] as Theme) : null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const cookieTheme = getThemeCookie();
    if (cookieTheme) setTheme(cookieTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setThemeCookie(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}