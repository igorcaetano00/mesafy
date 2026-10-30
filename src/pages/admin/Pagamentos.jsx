import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { brl, csv, data, METODOS } from '../../lib/comercial'

const mesAtual = () => new Date().toISOString().slice(0, 7)

export default function Pagamentos() {
  const [mes, setMes] = useState(mesAtual())
  const [pags, setPags] = useState(null)

  useEffect(() => {
    setPags(null)
    const [y, m] = mes.split('-').map(Number)
    const ini = `${mes}-01`
    const fim = new Date(y, m, 1).toISOString().slice(0, 10)
    supabase.from('pagamentos').select('*, restaurantes(nome)').gte('pago_em', ini).lt('pago_em', fim).order('pago_em', { ascending: false })
      .then(({ data: d }) => setPags(d || []))
  }, [mes])

  const resumo = useMemo(() => {
    const ok = (pags || []).filter(p => p.status === 'pago')
    const porMetodo = {}
    ok.forEach(p => { porMetodo[p.metodo] = (porMetodo[p.metodo] || 0) + Number(p.valor) })
    return { total: ok.reduce((s, p) => s + Number(p.valor), 0), qtd: ok.length, porMetodo, estornos: (pags || []).filter(p => p.status === 'estornado').length }
  }, [pags])

  function exportar() {
    csv(`mesafy-pagamentos-${mes}.csv`, (pags || []).map(p => ({
      data: p.pago_em, cliente: p.restaurantes?.nome, valor: String(p.valor).replace('.', ','), forma: METODOS[p.metodo],
      status: p.status, referencia: p.referencia, periodo_desde: p.referente_a, obs: p.obs,
    })))
  }

  return (
    <div className="page">
      <div className="rowx" style={{ justifyContent: 'space-between' }}>
        <div><h1>Pagamentos</h1><p className="sub">Recebimentos registrados por mês. Registre novos pela ficha do cliente.</p></div>
        <div className="rowx">
          <input type="month" value={mes} onChange={e => setMes(e.target.value || mesAtual())} aria-label="Mês" />
          <button className="btn ghost" onClick={exportar} disabled={!pags?.length}>Exportar CSV</button>
        </div>
      </div>

      <div className="grid g4">
        <div className="card kpi adm-hi"><div className="l">Recebido</div><div className="v">{brl(resumo.total)}</div><div className="s muted small">{resumo.qtd} pagamentos</div></div>
        {Object.entries(resumo.porMetodo).map(([k, v]) => (
          <div className="card kpi" key={k}><div className="l">{METODOS[k]}</div><div className="v adm-v">{brl(v)}</div></div>
        ))}
        {resumo.estornos > 0 && <div className="card kpi adm-bad"><div className="l">Estornos</div><div className="v adm-v">{resumo.estornos}</div></div>}
      </div>

      <div className="card adm-tblwrap" style={{ marginTop: 12 }}>
        {pags === null ? <p className="muted">Carregando…</p> : (
          <table className="tbl">
            <thead><tr><th>Data</th><th>Cliente</th><th>Forma</th><th>Referência</th><th className="num">Valor</th></tr></thead>
            <tbody>
              {pags.map(p => (
                <tr key={p.id} className={p.status === 'estornado' ? 'adm-off' : ''}>
                  <td>{data(p.pago_em)}</td>
                  <td><Link to={`/admin/clientes/${p.restaurante_id}`} className="adm-nome">{p.restaurantes?.nome || '-'}</Link></td>
                  <td>{METODOS[p.metodo]}{p.status === 'estornado' && <span className="pill bad" style={{ marginLeft: 6 }}>Estornado</span>}</td>
                  <td className="muted">{p.referencia || '-'}</td>
                  <td className="num">{brl(p.valor)}</td>
                </tr>
              ))}
              {!pags.length && <tr><td colSpan={5} className="muted">Nenhum pagamento neste mês.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
