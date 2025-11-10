import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './Context/AuthContext.jsx';
import { ThemeProvider } from './Context/ThemeContext.jsx';
import { Buffer } from "buffer";
import ErrorBoundary from './ErrorBoundary';
import { GameProvider } from "./Context/GameContext";
import { SocketProvider } from "./Context/SocketContext";
import { SolanaProvider } from "./Context/SolanaContext";
import { ArenaProvider } from "./Context/ArenaContext";
import { AudioProvider } from "./Context/AudioContext";
import './index.css'


window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <SolanaProvider>
            <SocketProvider>
              <GameProvider>
                <ArenaProvider>
                  <AudioProvider>
                    <App />
                  </AudioProvider>
                </ArenaProvider>
              </GameProvider>
            </SocketProvider>
          </SolanaProvider>
        </ ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)