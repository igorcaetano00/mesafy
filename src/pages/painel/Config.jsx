import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase, soDigitos } from '../../lib/supabase'

export default function Config() {
  const { rest, setRest } = useAuth()
  const [f, setF] = useState({ ...rest })
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF({ ...f, [k]: v })

  async function foto(file, campo) {
    const path = `${rest.id}/${campo}-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('fotos').upload(path, file, { upsert: true })
    if (error) return alert(error.message)
    set(campo, supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl)
  }
  async function salvar(e) {
    e.preventDefault()
    const wa = soDigitos(f.whatsapp)
    const payload = { nome: f.nome, subtitulo: f.subtitulo, descricao: f.descricao, cidade: f.cidade, uf: f.uf, cor: f.cor, whatsapp: wa.startsWith('55') ? wa : '55' + wa, whatsapp_exibicao: f.whatsapp_exibicao, capa_url: f.capa_url, logo_url: f.logo_url, aberto: f.aberto }
    const { data, error } = await supabase.from('restaurantes').update(payload).eq('id', rest.id).select().single()
    if (error) return setMsg(error.message)
    setRest(data); setMsg('Salvo.'); setTimeout(() => setMsg(''), 1500)
  }

  return (
    <div className="page">
      <h1>Configurações</h1>
      <p className="sub">Dados que aparecem no cardápio e o WhatsApp que recebe os pedidos.</p>
      <form className="grid g2" onSubmit={salvar}>
        <div className="card grid">
          <label className="f">Nome<input id="c-nome" value={f.nome} onChange={e => set('nome', e.target.value)} required /></label>
          <label className="f">Tipo (subtítulo)<input id="c-sub" value={f.subtitulo || ''} onChange={e => set('subtitulo', e.target.value)} /></label>
          <label className="f">Frase de apresentação<textarea id="c-desc" value={f.descricao || ''} onChange={e => set('descricao', e.target.value)} rows={2} /></label>
          <div className="grid" style={{ gridTemplateColumns: '1fr 80px' }}>
            <label className="f">Cidade<input id="c-cid" value={f.cidade || ''} onChange={e => set('cidade', e.target.value)} /></label>
            <label className="f">UF<input id="c-uf" value={f.uf || ''} maxLength={2} onChange={e => set('uf', e.target.value.toUpperCase())} /></label>
          </div>
          <label className="f">WhatsApp (só dígitos, com DDI)<input id="c-wa" value={f.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></label>
          <label className="f">WhatsApp como aparece<input id="c-wax" value={f.whatsapp_exibicao || ''} onChange={e => set('whatsapp_exibicao', e.target.value)} placeholder="27 99767-9086" /></label>
        </div>
        <div className="card grid" style={{ alignContent: 'start' }}>
          <label className="f">Cor principal<input id="c-cor" type="color" value={f.cor || '#3dff8a'} onChange={e => set('cor', e.target.value)} style={{ height: 44, padding: 4 }} /></label>
          <label className="f">Foto de capa
            {f.capa_url && <img src={f.capa_url} alt="" style={{ height: 100, width: 'auto', borderRadius: 4 }} />}
            <input id="c-capa" type="file" accept="image/*" onChange={e => e.target.files[0] && foto(e.target.files[0], 'capa_url')} /></label>
          <label className="rowx" style={{ fontSize: 15 }}><input type="checkbox" style={{ width: 'auto' }} checked={f.aberto !== false} onChange={e => set('aberto', e.target.checked)} /> Aberto para pedidos agora</label>
          <p className="hint">Desmarque ao fechar a casa: o cardápio continua visível, mas sem o botão de pedir.</p>
          <div className="card" style={{ background: 'var(--panel)' }}>
            <div className="kpi"><div className="l">Plano</div><div className="v" style={{ fontSize: 24 }}>{rest.plano} · <span className={'pill ' + (rest.status === 'ativo' ? 'on' : 'warn')}>{rest.status}</span></div></div>
          </div>
          {msg && <p className="msg ok">{msg}</p>}
          <button className="btn" style={{ padding: 14 }}>Salvar</button>
        </div>
      </form>
    </div>
  )
}
