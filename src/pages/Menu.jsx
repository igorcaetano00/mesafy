import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, carregarCardapio, fmt, ls, soDigitos } from '../lib/supabase'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-')

function Preco({ v }) { return <div className="p"><i>R$</i>{Number(v).toFixed(2).replace('.', ',')}</div> }

function Qtd({ q, onChange, nome }) {
  return (
    <div className="add">
      {q > 0 && <>
        <button className="qb minus" type="button" aria-label={`Tirar um ${nome}`} onClick={() => onChange(q - 1)}>&minus;</button>
        <span className="qn">{q}</span>
      </>}
      <button className="qb plus" type="button" aria-label={`Adicionar ${nome}`} onClick={() => onChange(q + 1)}>+</button>
    </div>
  )
}

export default function Menu({ slug: slugProp }) {
  const { slug: slugRoute } = useParams()
  const slug = slugProp || slugRoute
  const [data, setData] = useState(undefined)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState(() => ls.get('cart:' + slug) || {})
  const [open, setOpen] = useState(false)
  const [ativa, setAtiva] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { carregarCardapio(slug).then(setData) }, [slug])
  useEffect(() => { ls.set('cart:' + slug, cart) }, [cart, slug])
  useEffect(() => {
    if (!data) return
    document.title = data.restaurante.nome + ' | Cardápio'
    document.documentElement.style.setProperty('--neon', data.restaurante.cor || '#3dff8a')
  }, [data])

  // aba ativa acompanha a rolagem
  useEffect(() => {
    if (!data) return
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) setAtiva(e.target.id) }), { rootMargin: '-120px 0px -70% 0px' })
    document.querySelectorAll('section.cat').forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [data, q])

  const count = useMemo(() => Object.values(cart).reduce((a, c) => a + c.qtd, 0), [cart])
  const total = useMemo(() => Object.values(cart).reduce((a, c) => a + c.qtd * c.preco, 0), [cart])

  if (data === undefined) return <div className="center"><p className="muted">Carregando cardápio…</p></div>
  if (data === null) return <div className="center"><div className="box"><h1>Cardápio <em>não encontrado</em></h1><p className="muted">Confira o link ou o QR Code.</p></div></div>

  const { restaurante: r, categorias } = data
  const t = norm(q)
  const cats = categorias.map(c => ({ ...c, itens: c.itens.filter(i => !t || norm(i.nome + ' ' + (i.descricao || '')).includes(t)) })).filter(c => c.itens.length)

  const setQtd = (i, qtd) => setCart(prev => {
    const n = { ...prev }
    if (qtd <= 0) delete n[i.id]; else n[i.id] = { id: i.id, nome: i.nome, preco: Number(i.preco), qtd }
    return n
  })

  const fechado = r.aberto === false
  const palavras = r.nome.split(' ')
  const ultima = palavras.length > 1 ? palavras.pop() : null

  return (
    <>
      {fechado && <div className="fechado">Estamos fechados agora. Você pode olhar o cardápio, mas não enviar pedidos.</div>}
      <header className={'hero' + (r.capa_url ? ' has-img' : '')}>
        {r.capa_url && <img src={r.capa_url} alt="" />}
        <div className="wrap">
          {r.subtitulo && <span className="badge">{r.subtitulo}</span>}
          <h1>{palavras.join(' ')}{ultima && <span>{ultima}</span>}</h1>
          {r.descricao && <p>{r.descricao}</p>}
          <div className="meta">
            {r.cidade && <div>{r.cidade} <b>{r.uf}</b></div>}
            <div>WhatsApp <b>{r.whatsapp_exibicao || r.whatsapp}</b></div>
          </div>
        </div>
      </header>

      <div className="bar"><div className="wrap">
        <label className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input id="busca" type="search" placeholder="Buscar no cardápio (ex.: bacon, camarão)" value={q} onChange={e => setQ(e.target.value)} autoComplete="off" />
        </label>
        <nav className="tabs">
          {cats.map(c => <a key={c.id} href={'#' + slugify(c.nome)} className={ativa === slugify(c.nome) ? 'on' : ''}>{c.nome}</a>)}
        </nav>
      </div></div>

      <main className={'menu' + (count ? ' has-cart' : '')}><div className="wrap">
        {cats.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Nada com esse nome por aqui. Tenta outro ingrediente.</p>}
        {cats.map(c => {
          const w = c.nome.split(' '); const last = w.length > 1 ? w.pop() : null
          return (
            <section className="cat" id={slugify(c.nome)} key={c.id}>
              <div className={'sec-head' + (c.imagem_url && !t ? '' : ' plain')}>
                {c.imagem_url && !t && <img src={c.imagem_url} alt="" loading="lazy" />}
                <div className="t"><h2>{w.join(' ')} {last && <em>{last}</em>}</h2>{c.subtitulo && <p>{c.subtitulo}</p>}</div>
              </div>
              <div className="items">
                {c.itens.map(i => {
                  const qtd = cart[i.id]?.qtd || 0
                  return (
                    <article key={i.id} className={'item' + (i.destaque ? ' hl' : '') + (qtd ? ' in' : '') + (i.esgotado ? ' off' : '')}>
                      <h3>{i.nome}{i.destaque && <small>{i.destaque}</small>}{i.esgotado && <small>Esgotado</small>}</h3>
                      {i.descricao && <p className="d">{i.descricao}</p>}
                      <Preco v={i.preco} />
                      {!i.esgotado && !fechado && <Qtd q={qtd} nome={i.nome} onChange={v => setQtd(i, v)} />}
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div></main>

      <footer className="menu"><div className="wrap">
        <div className="cta">
          <div className="ph">{r.whatsapp_exibicao || r.whatsapp}</div>
          <a className="btn" href={'https://wa.me/' + soDigitos(r.whatsapp)} target="_blank" rel="noopener">Chamar no WhatsApp</a>
        </div>
        <small>{r.nome}{r.subtitulo ? ', ' + r.subtitulo : ''}. Preços em reais, sujeitos a alteração sem aviso.</small>
        <div className="powered">Feito com Mesafy · cardápio digital com pedido pelo WhatsApp</div>
      </div></footer>

      {count > 0 && (
        <button className="cartbar" type="button" onClick={() => setOpen(true)}>
          <div className="in"><span><i className="cnt">{count}</i>Ver pedido</span><b>{fmt(total)}</b></div>
        </button>
      )}
      {open && <Checkout r={r} cart={cart} setQtd={(id, qtd) => setQtd({ id, nome: cart[id].nome, preco: cart[id].preco }, qtd)} total={total} onClose={() => setOpen(false)} onDone={(n) => { setCart({}); setOpen(false); setToast(`Pedido #${n} enviado. Confirme no WhatsApp.`); setTimeout(() => setToast(''), 5000) }} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

function Checkout({ r, cart, setQtd, total, onClose, onDone }) {
  const saved = ls.get('cliente') || {}
  const [f, setF] = useState({ nome: saved.nome || '', mesa: '', celular: saved.celular || '', obs: '' })
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false)
  const nomeRef = useRef()
  useEffect(() => { nomeRef.current?.focus() }, [])
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])

  const maskCel = (v) => { v = v.replace(/\D/g, '').slice(0, 11); if (v.length > 7) return v.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '$1 $2-$3'); if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})$/, '$1 $2'); return v }
  const itens = Object.values(cart)

  async function enviar(e) {
    e.preventDefault(); setMsg(''); setOk(false)
    const nome = f.nome.trim(), mesa = f.mesa.trim(), cel = soDigitos(f.celular)
    if (!nome) return setMsg('Informe seu nome.')
    if (!mesa) return setMsg('Informe o número da mesa.')
    if (cel.length < 10) return setMsg('Informe um celular com DDD.')
    if (!itens.length) return setMsg('Seu pedido está vazio.')
    setBusy(true)
    ls.set('cliente', { nome, celular: f.celular })
    const linhas = itens.map(c => ({ id: c.id, nome: c.nome, qtd: c.qtd, preco: c.preco, subtotal: +(c.qtd * c.preco).toFixed(2) }))
    const { data: numero, error } = await supabase.rpc('criar_pedido', { p: {
      restaurante_id: r.id, tipo: 'mesa', nome, celular: cel, mesa, itens: linhas, subtotal: total, taxa_entrega: 0, total, obs: f.obs.trim() || null,
    } }); const ped = { numero }
    setBusy(false)
    if (error) { setMsg('Não consegui registrar o pedido. Tente de novo ou chame no WhatsApp.'); return }
    const txt = [`*PEDIDO #${ped.numero} - ${r.nome.toUpperCase()}*`, '', `*Nome:* ${nome}`, `*Mesa:* ${mesa}`, `*Celular:* ${f.celular}`, '', '*Itens:*',
      ...linhas.map(l => `${l.qtd}x ${l.nome} .... ${fmt(l.subtotal)}`), '', `*TOTAL: ${fmt(total)}*`]
    if (f.obs.trim()) txt.push('', `*Obs:* ${f.obs.trim()}`)
    txt.push('', '_Enviado pelo cardápio digital_')
    const url = 'https://wa.me/' + soDigitos(r.whatsapp) + '?text=' + encodeURIComponent(txt.join('\n'))
    const w = window.open(url, '_blank', 'noopener'); if (!w) window.location.href = url
    setOk(true); setMsg('Pedido registrado. Confirme o envio no WhatsApp.')
    setTimeout(() => onDone(ped.numero), 1200)
  }

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="top"><h2>Seu <em>pedido</em></h2><button className="x" type="button" aria-label="Fechar" onClick={onClose}>&times;</button></div>
        {itens.map(c => (
          <div className="ln" key={c.id}>
            <span className="nm">{c.nome}</span>
            <Qtd q={c.qtd} nome={c.nome} onChange={v => setQtd(c.id, v)} />
            <span className="sb">{fmt(c.qtd * c.preco)}</span>
          </div>
        ))}
        <div className="tot"><span>Total</span><b>{fmt(total)}</b></div>
        <form className="fm" onSubmit={enviar} noValidate>
          <label className="f">Nome<input ref={nomeRef} id="f-nome" value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} placeholder="Como te chamamos?" autoComplete="name" /></label>
          <div className="two">
            <label className="f">Mesa<input id="f-mesa" value={f.mesa} onChange={e => setF({ ...f, mesa: e.target.value })} inputMode="numeric" placeholder="Ex.: 7" /></label>
            <label className="f">Celular<input id="f-cel" value={f.celular} onChange={e => setF({ ...f, celular: maskCel(e.target.value) })} inputMode="tel" placeholder="27 9xxxx-xxxx" autoComplete="tel" /></label>
          </div>
          <label className="f">Observações<textarea id="f-obs" value={f.obs} onChange={e => setF({ ...f, obs: e.target.value })} placeholder="Ex.: picanha com aipim, sem cebola" /></label>
          <p className="hint">Escolhas como batata ou aipim, cheddar ou catupiry e ponto da carne vão aqui.</p>
          <p className={'msg' + (ok ? ' ok' : '')}>{msg}</p>
          <button className="btn" type="submit" disabled={busy} style={{ padding: 14, fontSize: 16 }}>{busy ? 'Registrando…' : 'Enviar pedido no WhatsApp'}</button>
          <p className="hint">O WhatsApp abre com o pedido pronto. É só confirmar o envio.</p>
        </form>
      </div>
    </div>
  )
}
