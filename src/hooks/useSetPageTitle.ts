"use client"
import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';

export function useSetPageTitle(title: string) {
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {setPageTitle(title)}, [setPageTitle, title]);
}