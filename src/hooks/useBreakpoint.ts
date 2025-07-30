
import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(() => {
    // Initialize with actual screen size if available (client-side)
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      let breakpoint: Breakpoint = 'xs';
      Object.entries(breakpoints).forEach(([key, value]) => {
        if (width >= value) {
          breakpoint = key as Breakpoint;
        }
      });
      return breakpoint;
    }
    return 'lg'; // SSR fallback
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let breakpoint: Breakpoint = 'xs';
      
      Object.entries(breakpoints).forEach(([key, value]) => {
        if (width >= value) {
          breakpoint = key as Breakpoint;
        }
      });
      
      setCurrentBreakpoint(breakpoint);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const isAbove = (breakpoint: Breakpoint) => {
    return breakpoints[currentBreakpoint] >= breakpoints[breakpoint];
  };

  const isBelow = (breakpoint: Breakpoint) => {
    return breakpoints[currentBreakpoint] < breakpoints[breakpoint];
  };

  return {
    current: currentBreakpoint,
    isAbove,
    isBelow,
    isMobile: isBelow('md'),
    isTablet: currentBreakpoint === 'md' || currentBreakpoint === 'lg',
    isDesktop: isAbove('lg'),
  };
}
