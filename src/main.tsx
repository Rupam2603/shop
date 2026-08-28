import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xvc2UtbWFybGluLTQzMy5jbGVyay5hY2NvdW50cy5kZXYk'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </ClerkProvider>
  </React.StrictMode>,
)