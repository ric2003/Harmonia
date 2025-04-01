"use client"
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PageTitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType>({
  pageTitle: 'Water Wise',
  setPageTitle: () => {},
});

interface PageTitleProviderProps {
  children: ReactNode;
}

export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [pageTitle, setPageTitle] = useState<string>('Water Wise');

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export const usePageTitle = () => useContext(PageTitleContext);
