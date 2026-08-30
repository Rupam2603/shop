import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { StoreSettingsProvider } from './contexts/StoreSettingsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <StoreSettingsProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </StoreSettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
)