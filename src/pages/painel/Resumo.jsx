import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase, fmt } from '../../lib/supabase'

export default function Resumo() {
  const { rest } = useAuth()
  const [hoje, setHoje] = useState({ pedidos: 0, fat: 0 })
  const [mes, setMes] = useState({ pedidos: 0, fat: 0 })
  const [top, setTop] = useState([]); const [cli, setCli] = useState(0)

  useEffect(() => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0)
    const m0 = new Date(d0.getFullYear(), d0.getMonth(), 1)
    supabase.from('pedidos').select('total,criado_em').eq('restaurante_id', rest.id).neq('status', 'cancelado').gte('criado_em', m0.toISOString()).then(({ data }) => {
      const l = data || []
      const h = l.filter(p => new Date(p.criado_em) >= d0)
      setHoje({ pedidos: h.length, fat: h.reduce((a, p) => a + Number(p.total), 0) })
      setMes({ pedidos: l.length, fat: l.reduce((a, p) => a + Number(p.total), 0) })
    })
    supabase.rpc('mais_vendidos', { rid: rest.id }).then(({ data }) => setTop((data || []).slice(0, 8)))
    supabase.from('clientes').select('celular', { count: 'exact', head: true }).eq('restaurante_id', rest.id).then(({ count }) => setCli(count || 0))
  }, [rest.id])

  return (
    <div className="page">
      <h1>{rest.nome}</h1>
      <p className="sub">Resumo de hoje e do mês.</p>
      <div className="grid g4">
        <div className="card kpi"><div className="l">Pedidos hoje</div><div className="v">{hoje.pedidos}</div></div>
        <div className="card kpi"><div className="l">Faturamento hoje</div><div className="v">{fmt(hoje.fat)}</div></div>
        <div className="card kpi"><div className="l">Pedidos no mês</div><div className="v">{mes.pedidos}</div></div>
        <div className="card kpi"><div className="l">Faturamento no mês</div><div className="v">{fmt(mes.fat)}</div></div>
        <div className="card kpi"><div className="l">Ticket médio (mês)</div><div className="v">{fmt(mes.pedidos ? mes.fat / mes.pedidos : 0)}</div></div>
        <div className="card kpi"><div className="l">Clientes cadastrados</div><div className="v">{cli}</div></div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="kpi"><div className="l">Mais vendidos (30 dias)</div></div>
        <table className="tbl" style={{ marginTop: 8 }}>
          <thead><tr><th>Item</th><th className="num">Qtd</th><th className="num">Receita</th></tr></thead>
          <tbody>{top.map(t => <tr key={t.nome}><td>{t.nome}</td><td className="num">{t.qtd}</td><td className="num">{fmt(t.receita)}</td></tr>)}
            {!top.length && <tr><td colSpan={3} className="muted">Ainda sem pedidos no período.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  )
}
