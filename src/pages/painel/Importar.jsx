import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

const MAX = 4 * 1024 * 1024

// Reduz foto grande antes de enviar (limite do servidor ~4 MB)
async function reduzir(file) {
  if (!file.type.startsWith('image/')) return file
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  if (s === 1 && file.size < 1024 * 1024) return file
  const c = document.createElement('canvas'); c.width = bmp.width * s; c.height = bmp.height * s
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85))
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
}
const paraBase64 = (f) => new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.onerror = err; r.readAsDataURL(f) })

export default function Importar() {
  const { rest } = useAuth()
  const nav = useNavigate()
  const input = useRef()
  const [fase, setFase] = useState('envio')       // envio | lendo | revisao | salvando
  const [erro, setErro] = useState('')
  const [cats, setCats] = useState([])

  async function enviar(file) {
    if (!file) return
    setErro('')
    try {
      file = await reduzir(file)
      if (file.size > MAX) return setErro('Arquivo maior que 4 MB. Envie uma foto menor ou um PDF mais leve.')
      setFase('lendo')
      const { data: { session } } = await supabase.auth.getSession()
      let corpo
      if (/\.docx$/i.test(file.name)) {
        // Word: extrai o texto aqui no navegador e manda só o texto
        const mammoth = (await import('mammoth/mammoth.browser.js')).default
        const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
        if (!value.trim()) throw new Error('Não encontrei texto nesse arquivo do Word.')
        corpo = { nome: file.name, texto: value }
      } else {
        corpo = { nome: file.name, tipo: file.type, dados: await paraBase64(file) }
      }
      const r = await fetch('/api/ler-cardapio', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(corpo),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error((j.erro || 'Falha na leitura.') + (j.detalhe ? ` (${j.detalhe})` : ''))
      setCats(j.categorias.map(c => ({ ...c, itens: c.itens.map(i => ({ ...i, preco: String(i.preco).replace('.', ',') })) })))
      setFase('revisao')
    } catch (e) { setErro(e.message); setFase('envio') }
  }

  const upCat = (ci, patch) => setCats(cs => cs.map((c, i) => i === ci ? { ...c, ...patch } : c))
  const upItem = (ci, ii, patch) => setCats(cs => cs.map((c, i) => i !== ci ? c : { ...c, itens: c.itens.map((x, j) => j === ii ? { ...x, ...patch } : x) }))
  const delItem = (ci, ii) => setCats(cs => cs.map((c, i) => i !== ci ? c : { ...c, itens: c.itens.filter((_, j) => j !== ii) }))
  const delCat = (ci) => setCats(cs => cs.filter((_, i) => i !== ci))
  const total = cats.reduce((s, c) => s + c.itens.length, 0)

  async function publicar() {
    setFase('salvando'); setErro('')
    try {
      const { data: ex } = await supabase.from('categorias').select('ordem').eq('restaurante_id', rest.id).order('ordem', { ascending: false }).limit(1)
      let base = (ex?.[0]?.ordem || 0)
      for (const c of cats.filter(c => c.nome.trim() && c.itens.length)) {
        base += 1
        const { data: nova, error } = await supabase.from('categorias')
          .insert({ restaurante_id: rest.id, nome: c.nome.trim(), subtitulo: c.subtitulo?.trim() || null, ordem: base, ativa: true }).select('id').single()
        if (error) throw error
        const linhas = c.itens.filter(i => i.nome.trim()).map((i, n) => ({
          restaurante_id: rest.id, categoria_id: nova.id, nome: i.nome.trim(), descricao: i.descricao?.trim() || null,
          preco: Number(String(i.preco).replace(/\./g, '').replace(',', '.')) || 0, ordem: n + 1, ativo: true, esgotado: false,
        }))
        const { error: e2 } = await supabase.from('itens').insert(linhas)
        if (e2) throw e2
      }
      nav('/painel/cardapio')
    } catch (e) { setErro(e.message); setFase('revisao') }
  }

  return (
    <div className="page">
      <h1>Importar cardápio</h1>
      <p className="sub">Envie o cardápio em PDF, foto ou Word. A leitura é automática e você confere tudo antes de publicar.</p>
      {erro && <div className="card" style={{ borderColor: 'var(--red, #ff5a5a)', color: '#ff9b9b' }}>{erro}</div>}

      {(fase === 'envio' || fase === 'lendo') && (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          {fase === 'lendo' ? (
            <p style={{ margin: 0 }}>Lendo o cardápio… isso leva de 10 a 40 segundos.</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>PDF, JPG, PNG ou Word (.docx). Até 4 MB.</p>
              <input ref={input} id="imp-arq" type="file" accept=".pdf,.docx,image/jpeg,image/png,image/webp" hidden onChange={e => enviar(e.target.files[0])} />
              <button className="btn" onClick={() => input.current.click()}>Escolher arquivo</button>
              <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Os itens entram em novas categorias. O que você já tem no cardápio não é apagado.</p>
            </>
          )}
        </div>
      )}

      {(fase === 'revisao' || fase === 'salvando') && (
        <>
          <p className="muted">Encontramos <b>{total}</b> itens em <b>{cats.length}</b> categorias. Corrija o que precisar e publique.</p>
          {cats.map((c, ci) => (
            <div key={ci}>
              <div className="cathead">
                <input value={c.nome} onChange={e => upCat(ci, { nome: e.target.value })} aria-label="Nome da categoria" style={{ maxWidth: 320 }} />
                <button className="iconb" onClick={() => delCat(ci)} title="Remover categoria">🗑</button>
              </div>
              <div className="card">
                {c.itens.map((i, ii) => (
                  <div className="ed" key={ii} style={{ gridTemplateColumns: '1fr 110px auto', display: 'grid', gap: 8, alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <input value={i.nome} onChange={e => upItem(ci, ii, { nome: e.target.value })} aria-label="Nome do item" />
                      <input value={i.descricao || ''} onChange={e => upItem(ci, ii, { descricao: e.target.value })} placeholder="Descrição" aria-label="Descrição" />
                    </div>
                    <input value={i.preco} onChange={e => upItem(ci, ii, { preco: e.target.value })} inputMode="decimal" aria-label="Preço" />
                    <button className="iconb" onClick={() => delItem(ci, ii)} title="Remover item">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rowx" style={{ marginTop: 16 }}>
            <button className="btn" disabled={fase === 'salvando' || !total} onClick={publicar}>{fase === 'salvando' ? 'Publicando…' : `Publicar ${total} itens`}</button>
            <button className="btn ghost" disabled={fase === 'salvando'} onClick={() => { setCats([]); setFase('envio') }}>Enviar outro arquivo</button>
          </div>
        </>
      )}
    </div>
  )
}
