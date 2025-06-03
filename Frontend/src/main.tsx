import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Auth0Provider } from './auth/Auth0Provider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Auth0Provider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
)
