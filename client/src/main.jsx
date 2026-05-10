import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { loadSavedTheme } from './utils/theme.js'

// Apply persisted theme before first render
loadSavedTheme();

// Apply persisted font size
const savedFontSize = localStorage.getItem('ls-fontsize');
if (savedFontSize) {
  document.documentElement.style.setProperty('--chat-font-size', `${savedFontSize}px`);
}

// Apply compact mode
if (localStorage.getItem('ls-compact') === 'true') {
  document.documentElement.dataset.compact = 'true';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
