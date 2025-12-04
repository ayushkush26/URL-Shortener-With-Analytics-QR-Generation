import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import UrlShortenerForm from "./UrlShortenerForm";

function App() {
  return (
    // 🧠 LAYOUT STRATEGY: 
    // We use a full-screen flex container to center our tool.
    // This is "Container/Presentation" separation.
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      
      {/* The Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">
          🚀 Linkify Pro
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          The Professional URL Shortener
        </p>
      </header>

      {/* 🧠 THE COMPONENT MOUNT */}
      <main className="w-full max-w-lg">
        <UrlShortenerForm />
      </main>

      {/* The Footer */}
      <footer className="mt-12 text-gray-400 text-sm">
        System Architecture Level 5 • MERN Stack
      </footer>
    </div>
  );
}

export default App;