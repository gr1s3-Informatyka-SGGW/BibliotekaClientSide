import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Login/index.css'
import Login from './Login/Login.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Login />
  </StrictMode>,
)
