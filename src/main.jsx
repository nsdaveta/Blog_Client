import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { UserContextProvider } from './pages/components/UserContext/usercontext'
import { DialogProvider } from './pages/components/Dialog/DialogContext'
import Navbar from './pages/components/navbar.jsx'

createRoot(document.getElementById('root')).render(
    <DialogProvider>
        <UserContextProvider>
            <HashRouter>
                <Navbar />
                <App />
            </HashRouter>
        </UserContextProvider>
    </DialogProvider>
)
