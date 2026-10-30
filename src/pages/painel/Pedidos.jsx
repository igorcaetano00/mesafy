import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase, fmt } from '../../lib/supabase'

const COLS = [['novo', 'Novos'], ['preparo', 'Em preparo'], ['pronto', 'Prontos'], ['entregue', 'Entregues hoje']]
const hora = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = .15
    o.start(); o.frequency.setValueAtTime(1175, ctx.currentTime + .15); o.stop(ctx.currentTime + .35)
  } catch {}
}

export default function Pedidos() {
  const { rest } = useAuth()
  const [peds, setPeds] = useState([])
  const [som, setSom] = useState(true)
  const somRef = useRef(som); somRef.current = som

  async function carregar() {
    const inicio = new Date(); inicio.setHours(0, 0, 0, 0)
    const { data } = await supabase.from('pedidos').select('*').eq('restaurante_id', rest.id)
      .or(`status.in.(novo,preparo,pronto),criado_em.gte.${inicio.toISOString()}`).order('criado_em', { ascending: false })
    setPeds(data || [])
  }

  useEffect(() => {
    carregar()
    const ch = supabase.channel('pedidos:' + rest.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos', filter: `restaurante_id=eq.${rest.id}` }, (p) => { setPeds(prev => [p.new, ...prev]); if (somRef.current) beep() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `restaurante_id=eq.${rest.id}` }, (p) => setPeds(prev => prev.map(x => x.id === p.new.id ? p.new : x)))
      .subscribe()
    const iv = setInterval(carregar, 60000) // segurança caso o realtime caia
    return () => { supabase.removeChannel(ch); clearInterval(iv) }
  }, [rest.id])

  async function mudar(p, status) {
    setPeds(prev => prev.map(x => x.id === p.id ? { ...x, status } : x))
    await supabase.from('pedidos').update({ status }).eq('id', p.id)
  }

  return (
    <div className="page">
      <div className="rowx" style={{ justifyContent: 'space-between' }}>
        <div><h1>Pedidos</h1><p className="sub">Atualiza sozinho quando chega pedido. Deixe esta tela aberta no balcão ou na cozinha.</p></div>
        <label className="rowx" style={{ fontSize: 14 }}><input type="checkbox" id="som" checked={som} onChange={e => setSom(e.target.checked)} style={{ width: 'auto' }} /> Som ao chegar</label>
      </div>
      <div className="kanban">
        {COLS.map(([st, label]) => {
          const lista = peds.filter(p => p.status === st)
          return (
            <div className={'col ' + st} key={st}>
              <h3>{label} <span>{lista.length}</span></h3>
              {lista.map(p => (
                <article className={'ped ' + p.status} key={p.id}>
                  <div className="h"><b>#{p.numero}</b><span>{p.tipo === 'mesa' ? 'Mesa ' + p.mesa : p.tipo} · {hora(p.criado_em)}</span></div>
                  <div style={{ fontFamily: 'var(--cond)', fontWeight: 700, textTransform: 'uppercase', fontSize: 14 }}>{p.nome} <span className="muted" style={{ fontWeight: 400 }}>· {p.celular.replace(/^(\d{2})(\d{5})(\d{4})$/, '$1 $2-$3')}</span></div>
                  <ul>{p.itens.map((i, k) => <li key={k}>{i.qtd}x {i.nome}</li>)}</ul>
                  {p.obs && <div className="obs">Obs: {p.obs}</div>}
                  <div className="t"><span>Total</span><span>{fmt(p.total)}</span></div>
                  <div className="btns">
                    {st === 'novo' && <><button className="btn" onClick={() => mudar(p, 'preparo')}>Aceitar</button><button className="btn ghost" onClick={() => mudar(p, 'cancelado')}>Cancelar</button></>}
                    {st === 'preparo' && <button className="btn" onClick={() => mudar(p, 'pronto')}>Pronto</button>}
                    {st === 'pronto' && <button className="btn" onClick={() => mudar(p, 'entregue')}>Entregue</button>}
                    {st === 'entregue' && <a className="btn ghost" href={'https://wa.me/55' + p.celular} target="_blank" rel="noopener">WhatsApp do cliente</a>}
                  </div>
                </article>
              ))}
              {!lista.length && <p className="muted" style={{ padding: 12, fontSize: 13 }}>Nenhum.</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
