// Entry point for the React application
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Get the root element from HTML and create React root
const rootElement = document.getElementById('root');
const reactRoot = ReactDOM.createRoot(rootElement);

// Render the main App component
reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
