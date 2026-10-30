import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from './Admin'
import { brl, brl0, csv, data, diasDesde, hoje } from '../../lib/comercial'

const fone = (n) => {
  const d = String(n || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : n
}
const wa = (n) => { let d = String(n || '').replace(/\D/g, ''); if (!d.startsWith('55')) d = '55' + d; return `https://wa.me/${d}` }

const SEGMENTOS = {
  todos: { rotulo: 'Todos', f: () => true },
  ativos: { rotulo: 'Ativos (30 dias)', f: c => diasDesde(c.ultimo_pedido) <= 30 },
  novos: { rotulo: 'Novos (30 dias)', f: c => diasDesde(c.primeiro_pedido) <= 30 },
  recorrentes: { rotulo: 'Recorrentes (2+ pedidos)', f: c => c.total_pedidos >= 2 },
  sumidos: { rotulo: 'Sumidos (60+ dias)', f: c => diasDesde(c.ultimo_pedido) > 60 },
}
const ORDENS = {
  recente: { rotulo: 'Pedido mais recente', f: (a, b) => new Date(b.ultimo_pedido) - new Date(a.ultimo_pedido) },
  gasto: { rotulo: 'Quem mais gastou', f: (a, b) => b.total_gasto - a.total_gasto },
  pedidos: { rotulo: 'Mais pedidos', f: (a, b) => b.total_pedidos - a.total_pedidos },
  nome: { rotulo: 'Nome', f: (a, b) => (a.nome || '').localeCompare(b.nome || '') },
}
const POR_PAGINA = 50

export default function Consumidores() {
  const { clientes: restaurantes } = useAdmin()
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [q, setQ] = useState('')
  const [rest, setRest] = useState('todos')
  const [seg, setSeg] = useState('todos')
  const [ordem, setOrdem] = useState('recente')
  const [pag, setPag] = useState(1)

  useEffect(() => {
    (async () => {
      const todos = []
      for (let de = 0; ; de += 1000) {
        const { data: d, error } = await supabase.from('clientes').select('*').order('ultimo_pedido', { ascending: false }).range(de, de + 999)
        if (error) { setErro(error.message); return }
        todos.push(...d)
        if (d.length < 1000) break
      }
      setLista(todos)
    })()
  }, [])

  const nomeRest = useMemo(() => Object.fromEntries(restaurantes.map(r => [r.id, r.nome])), [restaurantes])

  const filtrada = useMemo(() => {
    if (!lista) return []
    const t = q.trim().toLowerCase(), dig = q.replace(/\D/g, '')
    return lista
      .filter(c => rest === 'todos' || c.restaurante_id === rest)
      .filter(SEGMENTOS[seg].f)
      .filter(c => !t || (c.nome || '').toLowerCase().includes(t) || (dig && c.celular.includes(dig)))
      .sort(ORDENS[ordem].f)
  }, [lista, q, rest, seg, ordem])
  useEffect(() => setPag(1), [q, rest, seg, ordem])

  const kpi = useMemo(() => {
    const base = (lista || []).filter(c => rest === 'todos' || c.restaurante_id === rest)
    const pedidos = base.reduce((s, c) => s + c.total_pedidos, 0)
    const gasto = base.reduce((s, c) => s + Number(c.total_gasto), 0)
    return {
      cadastros: base.length,
      pessoas: new Set(base.map(c => c.celular)).size,
      novos: base.filter(SEGMENTOS.novos.f).length,
      recorrentes: base.filter(SEGMENTOS.recorrentes.f).length,
      ticket: pedidos ? gasto / pedidos : 0, gasto,
    }
  }, [lista, rest])

  function exportar() {
    csv(`foodporn-consumidores-${hoje()}.csv`, filtrada.map(c => ({
      nome: c.nome, celular: c.celular, whatsapp: wa(c.celular), restaurante: nomeRest[c.restaurante_id],
      pedidos: c.total_pedidos, total_gasto: String(c.total_gasto).replace('.', ','),
      ticket_medio: (c.total_gasto / Math.max(1, c.total_pedidos)).toFixed(2).replace('.', ','),
      primeiro_pedido: c.primeiro_pedido?.slice(0, 10), ultimo_pedido: c.ultimo_pedido?.slice(0, 10),
    })))
  }

  if (erro) return <div className="page"><div className="card adm-erro">{erro}</div></div>
  const visiveis = filtrada.slice(0, pag * POR_PAGINA)

  return (
    <div className="page">
      <div className="rowx" style={{ justifyContent: 'space-between' }}>
        <div><h1>Consumidores</h1><p className="sub">Todas as pessoas que já fizeram pedido pelo FOODPORN Menu, em todos os restaurantes.</p></div>
        <button className="btn" onClick={exportar} disabled={!filtrada.length}>Exportar {filtrada.length || ''} em CSV</button>
      </div>

      <div className="grid g4">
        <div className="card kpi adm-hi"><div className="l">Pessoas únicas</div><div className="v">{lista ? kpi.pessoas : '…'}</div><div className="s muted small">{kpi.cadastros} cadastros por restaurante</div></div>
        <div className="card kpi"><div className="l">Novos em 30 dias</div><div className="v">{lista ? kpi.novos : '…'}</div></div>
        <div className="card kpi"><div className="l">Recorrentes</div><div className="v">{lista ? kpi.recorrentes : '…'}</div><div className="s muted small">{kpi.cadastros ? Math.round(kpi.recorrentes / kpi.cadastros * 100) : 0}% voltaram a pedir</div></div>
        <div className="card kpi"><div className="l">Ticket médio</div><div className="v">{brl0(kpi.ticket)}</div><div className="s muted small">{brl0(kpi.gasto)} no total</div></div>
      </div>

      <div className="adm-filtros" style={{ marginTop: 12 }}>
        <div className="adm-filtrolinha">
          <input type="search" placeholder="Buscar por nome ou celular" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar consumidor" />
          <select value={rest} onChange={e => setRest(e.target.value)} aria-label="Restaurante">
            <option value="todos">Todos os restaurantes</option>
            {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          <select value={ordem} onChange={e => setOrdem(e.target.value)} aria-label="Ordenar">
            {Object.entries(ORDENS).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
          </select>
        </div>
        <div className="rowx">
          {Object.entries(SEGMENTOS).map(([k, v]) => (
            <button key={k} className={'chip' + (seg === k ? ' on' : '')} onClick={() => setSeg(k)}>{v.rotulo}</button>
          ))}
        </div>
      </div>

      <div className="card adm-tblwrap">
        {lista === null ? <p className="muted" style={{ padding: 14 }}>Carregando…</p> : (
          <table className="tbl adm-tbl">
            <thead><tr><th>Nome</th><th>Celular</th><th>Restaurante</th><th className="num">Pedidos</th><th className="num">Total gasto</th><th className="num">Ticket</th><th>Primeiro</th><th>Último</th><th></th></tr></thead>
            <tbody>
              {visiveis.map(c => {
                const d = diasDesde(c.ultimo_pedido)
                return (
                  <tr key={c.restaurante_id + c.celular}>
                    <td><b>{c.nome || '-'}</b></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fone(c.celular)}</td>
                    <td><Link to={`/admin/clientes/${c.restaurante_id}`} className="adm-nome" style={{ fontWeight: 400 }}>{nomeRest[c.restaurante_id] || '-'}</Link></td>
                    <td className="num">{c.total_pedidos}</td>
                    <td className="num">{brl(c.total_gasto)}</td>
                    <td className="num">{brl(c.total_gasto / Math.max(1, c.total_pedidos))}</td>
                    <td>{data(c.primeiro_pedido)}</td>
                    <td>{d === 0 ? 'Hoje' : d === 1 ? 'Ontem' : `${d}d atrás`}</td>
                    <td><a className="btn ghost sm" href={wa(c.celular)} target="_blank" rel="noopener">WhatsApp</a></td>
                  </tr>
                )
              })}
              {!filtrada.length && <tr><td colSpan={9} className="muted">{lista.length ? 'Nenhum consumidor neste filtro.' : 'Ainda não há pedidos. Os consumidores aparecem aqui assim que fizerem o primeiro pedido.'}</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {visiveis.length < filtrada.length && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn ghost" onClick={() => setPag(p => p + 1)}>Mostrar mais ({filtrada.length - visiveis.length} restantes)</button>
        </div>
      )}
      <p className="muted small" style={{ marginTop: 16 }}>
        Os dados são do restaurante onde o pedido foi feito. Use para suporte e relatórios do cliente. Para campanhas da própria FOODPORN, é preciso consentimento do consumidor (LGPD).
      </p>
    </div>
  )
}
