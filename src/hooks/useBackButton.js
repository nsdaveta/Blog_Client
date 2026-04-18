import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { listen } from '@tauri-apps/api/event';

export const useBackButton = () => {
    const location = useLocation();
    const lastPressTime = useRef(0);
    const locationRef = useRef(location.pathname);

    useEffect(() => {
        locationRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        const handleBackButton = () => {
            const currentPath = locationRef.current;
            const rootPaths = ['/'];

            if (rootPaths.includes(currentPath)) {
                const currentTime = Date.now();
                if (currentTime - lastPressTime.current < 2000) {
                    if (window.__TAURI__) {
                        window.close();
                    }
                } else {
                    lastPressTime.current = currentTime;
                    toast.info('Press back again to exit', {
                        position: 'bottom-center',
                        autoClose: 2000,
                        hideProgressBar: true,
                    });
                }
            } else {
                window.history.back();
            }
        };

        let unlistenTauri;
        const setupTauriListener = async () => {
            try {
                unlistenTauri = await listen('tauri://back-button', handleBackButton);
            } catch (err) {
                console.error('Failed to listen for back button', err);
            }
        };
        setupTauriListener();

        return () => {
            if (unlistenTauri) unlistenTauri();
        };
    }, []);
};
