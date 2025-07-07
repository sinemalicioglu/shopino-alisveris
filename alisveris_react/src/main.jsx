// src/main.jsx (veya main.tsx veya index.js)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css'; // veya CSS dosyanızın adı neyse

// BrowserRouter'ı buraya import ediyoruz
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* App bileşenini BrowserRouter ile sarmalıyoruz */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);