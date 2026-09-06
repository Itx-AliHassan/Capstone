import { createContext, useContext, useEffect, useMemo, useState } from 'react'
const ThemeContext = createContext(null)
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('wm-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('wm-theme', theme)
  }, [theme])
  const value = useMemo(() => ({ theme, setTheme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
export const useTheme = () => useContext(ThemeContext)
