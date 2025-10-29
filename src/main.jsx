import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './Context/AuthContext.jsx';
import { ThemeProvider } from './Context/ThemeContext.jsx';
import { Buffer } from "buffer";
import ErrorBoundary from './ErrorBoundary';
import './index.css'


window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
        <App />
        </ ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)