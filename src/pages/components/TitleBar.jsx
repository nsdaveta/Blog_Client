import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc';
import './titlebar.css';

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = React.useState(false);
  const appWindow = getCurrentWindow();

  React.useEffect(() => {
    const updateMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };
    
    // Initial check
    updateMaximized();

    // Listen for resize events to update the icon
    const unlisten = appWindow.onResized(() => {
      updateMaximized();
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [appWindow]);

  return (
    <div className="titlebar">
      <div data-tauri-drag-region className="titlebar-drag-region"></div>
      
      <div className="titlebar-title">
        <img src="/favicon.svg" alt="app-icon" className="titlebar-icon" />
      </div>

      <div className="titlebar-controls">
        <div id="minimize" className="titlebar-button" onClick={() => appWindow.minimize()}>
          <VscChromeMinimize />
        </div>
        
        <div 
          id="maximize"
          className="titlebar-button maximize-button" 
          onClick={() => appWindow.toggleMaximize()}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <VscChromeRestore /> : <VscChromeMaximize />}
        </div>

        <div id="close" className="titlebar-button close-button" onClick={() => appWindow.close()}>
          <VscChromeClose />
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
