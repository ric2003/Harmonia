'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode, useContext } from 'react';
import { dark } from '@clerk/themes';
import { ThemeContext } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ptPT, enGB } from '@clerk/localizations';

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export default function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const { theme } = useContext(ThemeContext);
  const { language } = useLanguage();
  
  // Debug logging
  console.log('ClerkProvider language:', language, typeof language);
  
  // Map your app's language to Clerk's localization
  const getClerkLocalization = () => {
    console.log('Matching language:', language);
    switch (language) {
      case 'pt':
        return ptPT;
      case 'en':
        return enGB;
      default:
        return enGB;
    }
  };

  return (
    <ClerkProvider 
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined
      }}
      localization={getClerkLocalization()}
    >
      {children}  
    </ClerkProvider>
  );
} 