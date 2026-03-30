import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserContextProvider } from './pages/components/UserContext/usercontext'
import Navbar from './pages/components/navbar.jsx'

createRoot(document.getElementById('root')).render(
    <UserContextProvider>
        <BrowserRouter>
            <Navbar/>
            <App/>
        </BrowserRouter>
    </UserContextProvider>
)
