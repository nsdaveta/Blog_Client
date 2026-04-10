import React, { useEffect, useState } from 'react';
import { useDialog } from './DialogContext';
import './Dialog.css';

const Dialog = () => {
    const { dialogConfig } = useDialog();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (dialogConfig) {
            setIsVisible(true);
            setIsClosing(false);
        } else {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsClosing(false);
            }, 300); // Match CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [dialogConfig]);

    if (!isVisible && !isClosing) return null;

    const { title, message, kind, onConfirm, onCancel } = dialogConfig || {};

    return (
        <div className={`dialog-overlay ${isClosing ? 'fade-out' : 'fade-in'}`}>
            <div className={`dialog-container ${isClosing ? 'scale-down' : 'scale-up'} kind-${kind}`}>
                <div className="dialog-header">
                    <h3>{title}</h3>
                </div>
                <div className="dialog-body">
                    <p>{message}</p>
                </div>
                <div className="dialog-footer">
                    <button className="btn btn-outline btn-sm" onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className={`btn btn-sm ${kind === 'warning' || kind === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dialog;
