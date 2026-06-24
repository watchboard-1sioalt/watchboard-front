import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/Toast/Toast.jsx'
import { UserProvider } from './contexts/UserContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <ToastProvider position="bottom-right">
        <App />
      </ToastProvider>
    </UserProvider>
  </BrowserRouter>,
)
