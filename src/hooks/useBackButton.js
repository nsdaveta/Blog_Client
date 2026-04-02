import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';

export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only add back button handler on Android/Mobile
    const backButtonHandler = App.addListener('backButton', () => {
      const currentPath = location.pathname;

      // If on home page, exit the app
      if (currentPath === '/' || currentPath === '') {
        App.exitApp();
      } else {
        // Otherwise, go back to previous page
        navigate(-1);
      }
    });

    // Cleanup listener on unmount
    return () => {
      backButtonHandler.remove();
    };
  }, [navigate, location.pathname]);
};
