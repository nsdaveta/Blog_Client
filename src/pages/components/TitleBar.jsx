import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc';
import './titlebar.css';

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [appWindow, setAppWindow] = React.useState(null);

  React.useEffect(() => {
    if (window.__TAURI_INTERNALS__) {
      const win = getCurrentWindow();
      setAppWindow(win);
      
      const updateMaximized = async () => {
        const maximized = await win.isMaximized();
        setIsMaximized(maximized);
        if (maximized) {
          document.body.classList.add('maximized');
        } else {
          document.body.classList.remove('maximized');
        }
      };
      
      updateMaximized();
      const unlisten = win.onResized(() => {
        updateMaximized();
      });

      return () => {
        unlisten.then(u => u());
      };
    }
  }, []);

  const handleMinimize = () => appWindow?.minimize();
  const handleMaximize = async () => {
    if (appWindow) {
      await appWindow.toggleMaximize();
      setIsMaximized(await appWindow.isMaximized());
    }
  };
  const handleClose = () => appWindow?.close();

  return (
    <div data-tauri-drag-region className="titlebar">
      <div className="titlebar-title">
        <img src="/favicon.svg" alt="app-icon" className="titlebar-icon" />
        <span>Blogify</span>
      </div>
      <div className="titlebar-controls">
        <div className="titlebar-button" onClick={handleMinimize}>
          <VscChromeMinimize />
        </div>
        <div className="titlebar-button" onClick={handleMaximize}>
          {isMaximized ? <VscChromeRestore /> : <VscChromeMaximize />}
        </div>
        <div className="titlebar-button titlebar-button-close" onClick={handleClose}>
          <VscChromeClose />
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
