import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import Resumo from './Resumo'
import Cardapio from './Cardapio'
import Pedidos from './Pedidos'
import QR from './QR'
import Config from './Config'
import Onboarding from './Onboarding'
import Importar from './Importar'

function Shell() {
  const { session, rest, user } = useAuth()
  if (session === undefined || (session && rest === undefined)) return <div className="center"><p className="muted">Carregando…</p></div>
  if (!session) return <Navigate to="/login" />
  if (!rest) return <Onboarding />
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">{rest.nome.split(' ')[0]} <em>painel</em></div>
        <nav className="nav">
          <NavLink to="/painel" end>Resumo</NavLink>
          <NavLink to="/painel/pedidos">Pedidos</NavLink>
          <NavLink to="/painel/cardapio">Cardápio</NavLink>
          <NavLink to="/painel/qr">QR Code</NavLink>
          <NavLink to="/painel/config">Configurações</NavLink>
          <Link to={'/' + rest.slug} target="_blank">Ver cardápio ↗</Link>
          <a href="#" onClick={e => { e.preventDefault(); supabase.auth.signOut() }} title={user.email}>Sair</a>
        </nav>
      </header>
      <Routes>
        <Route index element={<Resumo />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="cardapio" element={<Cardapio />} />
        <Route path="importar" element={<Importar />} />
        <Route path="qr" element={<QR />} />
        <Route path="config" element={<Config />} />
        <Route path="*" element={<Navigate to="/painel" />} />
      </Routes>
    </div>
  )
}

export default function Painel() { return <AuthProvider><Shell /></AuthProvider> }
