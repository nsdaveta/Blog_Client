import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { UserContextProvider } from './pages/components/UserContext/usercontext'
import { DialogProvider } from './pages/components/Dialog/DialogContext'
import Dialog from './pages/components/Dialog/Dialog'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <DialogProvider>
            <UserContextProvider>
                <HashRouter>
                    <App />
                    <Dialog />
                </HashRouter>
            </UserContextProvider>
        </DialogProvider>
    </StrictMode>
)
