import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState('entrar')
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)

  async function go(e) {
    e.preventDefault(); setMsg(''); setBusy(true)
    const fn = mode === 'entrar' ? supabase.auth.signInWithPassword({ email, password: senha }) : supabase.auth.signUp({ email, password: senha })
    const { error } = await fn
    setBusy(false)
    if (error) return setMsg(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    if (mode === 'criar') return setMsg('Conta criada. Se o Supabase exigir confirmação, confira seu e-mail. Depois entre.')
    nav('/painel')
  }

  return (
    <div className="center"><form className="box" onSubmit={go}>
      <h1>Painel do <em>restaurante</em></h1>
      <p className="muted" style={{ margin: 0 }}>{mode === 'entrar' ? 'Entre para gerenciar seu cardápio e pedidos.' : 'Crie sua conta para começar.'}</p>
      <label className="f">E-mail<input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label className="f">Senha<input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} minLength={6} required /></label>
      {msg && <p className="msg">{msg}</p>}
      <button className="btn" disabled={busy} style={{ padding: 14 }}>{mode === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
      <button type="button" className="btn ghost" onClick={() => setMode(mode === 'entrar' ? 'criar' : 'entrar')}>{mode === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho conta'}</button>
    </form></div>
  )
}
