import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc';
import './titlebar.css';

const TitleBar = () => {
  return (
    <div className="titlebar">
      <div data-tauri-drag-region className="titlebar-drag-region"></div>
      <div className="titlebar-title">
        <img src="/favicon.svg" alt="app-icon" className="titlebar-icon" />
        <span>Blogify</span>
      </div>
    </div>
  );
};

export default TitleBar;
