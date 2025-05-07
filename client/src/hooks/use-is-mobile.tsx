import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '../utils/constants';

export function useIsMobile(): boolean {
  // Default to false for SSR
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Function to check if viewport width is less than the mobile breakpoint
    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for window resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIsMobile);
      
      // Cleanup event listener on component unmount
      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }
  }, []);
  
  return isMobile;
}