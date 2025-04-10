"use client";
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'pt' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="language-switcher flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-opacity-80"
    >
      <Globe size={16} className="text-primary" />
      <span className="text-sm font-medium text-primary uppercase">
        {language === 'en' ? 'EN' : 'PT'}
      </span>
    </button>
  );
}
