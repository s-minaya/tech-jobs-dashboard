import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import './index.css'
import App from './App.jsx'

// BrowserRouter envuelve toda la app (fase 016) — vive aquí, no dentro de
// App.jsx, porque es infraestructura de arranque, igual que StrictMode.
// La landing (gateada por sessionStorage en App.jsx) sigue fuera del árbol
// de <Routes> — BrowserRouter no la afecta, solo habilita el router para
// las 5 rutas del dashboard.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
