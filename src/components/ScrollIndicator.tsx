"use client";

import { useEffect, useState, useRef, useContext } from 'react';
import { SidebarHeaderContext } from '@/contexts/SidebarHeaderContext';

interface ScrollIndicatorProps {
  targetId: string;
  text: string;
}

export default function ScrollIndicator({ targetId, text }: ScrollIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const hideIndicator = (): void => {
      setIsVisible(false);
    };

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Run on initial load
    checkMobile();

    // Add resize event listener to detect mobile/desktop changes
    window.addEventListener('resize', checkMobile, { passive: true });
    
    // Add scroll event listener to window
    window.addEventListener('scroll', hideIndicator, { passive: true });
    
    // Also add touchstart event to hide on mobile devices
    window.addEventListener('touchstart', hideIndicator, { passive: true });
    
    // Add wheel event to detect mouse wheel movement
    window.addEventListener('wheel', hideIndicator, { passive: true });

    // Auto-hide after 4 seconds
    const autoHideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', hideIndicator);
      window.removeEventListener('touchstart', hideIndicator);
      window.removeEventListener('wheel', hideIndicator);
      clearTimeout(autoHideTimer);
    };
  }, []);

  const handleClick = () => {
    setIsVisible(false);
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sidebar width is 225px when open
  const sidebarWidth = sidebarOpen ? 225 : 0;
  // Mobile should always use 100% width
  const position = isMobile ? { left: 0, width: '100%' } : { left: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)` };

  return (
    <div
      ref={indicatorRef}
      className="fixed bottom-4 z-50"
      style={{ 
        ...position,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'left 0.3s ease, width 0.3s ease, opacity 0.8s ease',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
      }}
      onClick={handleClick}
    >
      <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-md text-primary mb-4 flex items-center gap-1 animate-bounce cursor-pointer">
        <span className="text-sm font-medium">{text}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
}