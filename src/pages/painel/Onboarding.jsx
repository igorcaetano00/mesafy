import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase, soDigitos } from '../../lib/supabase'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function Onboarding() {
  const { user, setRest } = useAuth()
  const [f, setF] = useState({ nome: '', subtitulo: '', whatsapp: '', cidade: '', uf: 'ES', cor: '#3dff8a' })
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const slug = slugify(f.nome)

  async function criar(e) {
    e.preventDefault(); setMsg('')
    const wa = soDigitos(f.whatsapp)
    if (!f.nome.trim()) return setMsg('Informe o nome do restaurante.')
    if (wa.length < 10) return setMsg('Informe o WhatsApp com DDD.')
    setBusy(true)
    const { data, error } = await supabase.from('restaurantes').insert({
      slug, nome: f.nome.trim(), subtitulo: f.subtitulo.trim() || null, whatsapp: wa.startsWith('55') ? wa : '55' + wa,
      whatsapp_exibicao: f.whatsapp, cidade: f.cidade.trim() || null, uf: f.uf, cor: f.cor, owner_id: user.id, status: 'trial',
    }).select().single()
    setBusy(false)
    if (error) return setMsg(error.code === '23505' ? 'Já existe um restaurante com esse nome. Ajuste o nome.' : error.message)
    await supabase.from('categorias').insert({ restaurante_id: data.id, nome: 'Lanches', ordem: 1 })
    setRest(data)
  }

  return (
    <div className="center"><form className="box" onSubmit={criar}>
      <h1>Vamos criar seu <em>cardápio</em></h1>
      <p className="muted" style={{ margin: 0 }}>Leva 1 minuto. Você completa o resto no painel.</p>
      <label className="f">Nome do restaurante<input id="o-nome" value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} required /></label>
      {slug && <p className="hint">Endereço do cardápio: <b>/{slug}</b></p>}
      <label className="f">Tipo (ex.: Lanchonete e Petiscaria)<input id="o-sub" value={f.subtitulo} onChange={e => setF({ ...f, subtitulo: e.target.value })} /></label>
      <label className="f">WhatsApp que recebe os pedidos<input id="o-wa" value={f.whatsapp} onChange={e => setF({ ...f, whatsapp: e.target.value })} placeholder="27 99999-9999" inputMode="tel" required /></label>
      <div className="fm two" style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
        <label className="f">Cidade<input id="o-cid" value={f.cidade} onChange={e => setF({ ...f, cidade: e.target.value })} /></label>
        <label className="f">UF<input id="o-uf" value={f.uf} maxLength={2} onChange={e => setF({ ...f, uf: e.target.value.toUpperCase() })} /></label>
      </div>
      <label className="f">Cor principal<input id="o-cor" type="color" value={f.cor} onChange={e => setF({ ...f, cor: e.target.value })} style={{ height: 44, padding: 4 }} /></label>
      {msg && <p className="msg">{msg}</p>}
      <button className="btn" disabled={busy} style={{ padding: 14 }}>{busy ? 'Criando…' : 'Criar meu cardápio'}</button>
    </form></div>
  )
}
