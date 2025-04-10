"use client"
import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useTranslation } from 'react-i18next';
import { TOptions } from 'i18next';

/**
 * Hook to set a translated page title
 * @param titleKey The translation key for the page title
 * @param options Optional parameters to pass to the translation function
 */
export function useTranslatedPageTitle(titleKey: string, options?: TOptions) {
  const { setPageTitle } = usePageTitle();
  const { t } = useTranslation();
  
  useEffect(() => {
    const translatedTitle = t(titleKey, options);
    setPageTitle(translatedTitle);
  }, [setPageTitle, t, titleKey, options]);
}
