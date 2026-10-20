import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import UpdateBanner from './components/UpdateBanner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UpdateBanner />
    <App />
  </StrictMode>,
)
