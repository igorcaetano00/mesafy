import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import Visao from './Visao'
import Clientes from './Clientes'
import Ficha from './Ficha'
import Pagamentos from './Pagamentos'
import Consumidores from './Consumidores'
import '../../styles/admin.css'

const ADMINS = ['igorantcaetano@gmail.com'] // espelha is_admin() no banco

// Dados compartilhados entre as telas do admin
const Ctx = createContext(null)
export const useAdmin = () => useContext(Ctx)

function Shell() {
  const { session, user } = useAuth()
  const [clientes, setClientes] = useState(null)
  const [receita, setReceita] = useState([])
  const [erro, setErro] = useState('')
  const [toast, setToast] = useState('')

  const recarregar = useCallback(async () => {
    const [c, r] = await Promise.all([supabase.rpc('admin_clientes'), supabase.rpc('admin_receita_mensal')])
    if (c.error) { setErro(c.error.message); return }
    setClientes(c.data || []); setReceita(r.data || [])
  }, [])
  const avisar = useCallback((t) => { setToast(t); setTimeout(() => setToast(''), 2200) }, [])

  useEffect(() => {
    if (!session || !ADMINS.includes(user?.email)) return
    supabase.rpc('admin_atualizar_status').then(recarregar)
  }, [session, user, recarregar])

  if (session === undefined) return <div className="center"><p className="muted">Carregando…</p></div>
  if (!session) return <Navigate to="/login" />
  if (!ADMINS.includes(user.email)) return <div className="center"><p>Acesso restrito.</p></div>

  return (
    <Ctx.Provider value={{ clientes, receita, recarregar, avisar }}>
      <div className="app adm">
        <header className="topbar">
          <div className="brand">Garçom <em>Online</em> <span className="adm-tag">admin</span></div>
          <nav className="nav">
            <NavLink to="/admin" end>Visão geral</NavLink>
            <NavLink to="/admin/clientes">Clientes</NavLink>
            <NavLink to="/admin/pagamentos">Pagamentos</NavLink>
            <NavLink to="/admin/consumidores">Consumidores</NavLink>
            <a href="/" target="_blank" rel="noopener">Site ↗</a>
            <a href="#" onClick={e => { e.preventDefault(); supabase.auth.signOut() }} title={user.email}>Sair</a>
          </nav>
        </header>
        {erro && <div className="page"><div className="card adm-erro">{erro}</div></div>}
        {!erro && clientes === null && <div className="page"><p className="muted">Carregando dados…</p></div>}
        {!erro && clientes !== null && (
          <Routes>
            <Route index element={<Visao />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<Ficha />} />
            <Route path="pagamentos" element={<Pagamentos />} />
            <Route path="consumidores" element={<Consumidores />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </Ctx.Provider>
  )
}

export default function Admin() { return <AuthProvider><Shell /></AuthProvider> }
