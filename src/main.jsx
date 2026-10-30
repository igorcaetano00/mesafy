import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { slugDoHost } from './lib/supabase'
import Menu from './pages/Menu'
import Home from './pages/Home'
import Login from './pages/Login'
import Painel from './pages/painel/Painel'
import Admin from './pages/admin/Admin'
import './styles/base.css'

const sub = slugDoHost()

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {sub ? (
          <Route path="/*" element={<Menu slug={sub} />} />
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/painel/*" element={<Painel />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/:slug" element={<Menu />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
