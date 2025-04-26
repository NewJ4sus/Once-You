import "core-js/stable";
import "regenerator-runtime/runtime";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import './assets/css/index.css'
import './assets/css/zero.style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
