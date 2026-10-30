import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

const ADMINS = ['igor.mkt.vs@gmail.com'] // espelha is_admin() no banco

function Lista() {
  const { session, user } = useAuth()
  const [rs, setRs] = useState([])
  async function carregar() { const { data } = await supabase.from('restaurantes').select('*').order('criado_em', { ascending: false }); setRs(data || []) }
  useEffect(() => { if (session) carregar() }, [session])
  if (session === undefined) return null
  if (!session) return <Navigate to="/login" />
  if (!ADMINS.includes(user.email)) return <div className="center"><p>Acesso restrito.</p></div>
  async function status(r, s) { await supabase.from('restaurantes').update({ status: s }).eq('id', r.id); carregar() }
  const ativos = rs.filter(r => r.status === 'ativo')
  return (
    <div className="page">
      <h1>Mesafy · Admin</h1>
      <p className="sub">{rs.length} restaurantes · {ativos.length} ativos</p>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Restaurante</th><th>Slug</th><th>Plano</th><th>Status</th><th>Criado</th><th></th></tr></thead>
          <tbody>{rs.map(r => (
            <tr key={r.id}>
              <td>{r.nome}<br /><span className="muted" style={{ fontSize: 12 }}>{r.cidade}/{r.uf} · {r.whatsapp_exibicao}</span></td>
              <td><a href={'/' + r.slug} target="_blank">/{r.slug}</a></td>
              <td>{r.plano}</td>
              <td><span className={'pill ' + (r.status === 'ativo' ? 'on' : r.status === 'suspenso' ? 'bad' : 'warn')}>{r.status}</span></td>
              <td className="muted">{new Date(r.criado_em).toLocaleDateString('pt-BR')}</td>
              <td className="rowx">
                {r.status !== 'ativo' && <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => status(r, 'ativo')}>Ativar</button>}
                {r.status !== 'suspenso' && <button className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => status(r, 'suspenso')}>Suspender</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
export default function Admin() { return <AuthProvider><Lista /></AuthProvider> }
