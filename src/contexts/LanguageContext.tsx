"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '@/i18n/i18n';

const isClient = typeof window !== 'undefined';

type Language = 'en' | 'pt';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {},
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    if (isClient) {
      const savedLanguage = localStorage.getItem('i18nextLng');
      return (savedLanguage?.substring(0, 2) as Language) || 'en';
    }
    return 'en';
  });

  const changeLanguage = (lang: Language) => {
    if (isClient) {
      i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
    }
  };

  useEffect(() => {
    if (isClient) {
      const currentLanguage = i18n.language?.substring(0, 2) as Language;
      setLanguage(currentLanguage || 'en');
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
