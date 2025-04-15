"use client";
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher flex items-center justify-center gap-1 p-2 rounded-md bg-secondary hover:bg-opacity-80"
    >
      {theme === 'light' ? (
          <Sun size={16} absoluteStrokeWidth className="text-primary" />
      ) : (
          <Moon size={16} absoluteStrokeWidth className="text-primary" />
      )}
    </button>
  );
} 
