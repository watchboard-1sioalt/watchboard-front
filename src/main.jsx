import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/Toast/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider position="bottom-right">
      <App />
    </ToastProvider>
  </BrowserRouter>,
)
