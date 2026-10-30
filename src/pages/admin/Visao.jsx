import { Link } from 'react-router-dom'
import { useAdmin } from './Admin'
import { alertas, brl, brl0, msgCobranca, zap, STATUS } from '../../lib/comercial'

export default function Visao() {
  const { clientes, receita } = useAdmin()
  const pagantes = clientes.filter(c => ['ativo', 'inadimplente'].includes(c.status) && c.plano !== 'piloto')
  const mrr = clientes.reduce((s, c) => s + Number(c.mrr || 0), 0)
  const conta = (st) => clientes.filter(c => c.status === st).length
  const mesAtual = receita[receita.length - 1]
  const mesAnterior = receita[receita.length - 2]
  const pedidos30 = clientes.reduce((s, c) => s + (c.pedidos_30d || 0), 0)
  const gmv30 = clientes.reduce((s, c) => s + Number(c.faturamento_30d || 0), 0)
  const aReceber7 = clientes
    .filter(c => c.status === 'ativo' && c.plano !== 'piloto' && c.dias_para_vencer != null && c.dias_para_vencer >= 0 && c.dias_para_vencer <= 7)
    .reduce((s, c) => s + Number(c.valor_mensal || 0), 0)
  const atrasado = clientes.filter(c => c.status === 'inadimplente').reduce((s, c) => s + Number(c.valor_mensal || 0), 0)

  const lista = clientes.map(c => ({ c, a: alertas(c) })).filter(x => x.a.length)
    .sort((x, y) => (y.a.some(a => a.nivel === 'bad') - x.a.some(a => a.nivel === 'bad')))
  const maxRec = Math.max(1, ...receita.map(r => Number(r.recebido)))
  const variacao = mesAnterior && Number(mesAnterior.recebido) > 0
    ? Math.round((Number(mesAtual.recebido) / Number(mesAnterior.recebido) - 1) * 100) : null

  return (
    <div className="page">
      <h1>Visão geral</h1>
      <p className="sub">{clientes.length} clientes cadastrados. Status de atraso atualizado agora.</p>

      <div className="grid g4">
        <Kpi l="Receita recorrente (MRR)" v={brl0(mrr)} s={`${brl0(mrr * 12)} por ano`} destaque />
        <Kpi l="Clientes pagantes" v={pagantes.length} s={`Ticket médio ${brl0(pagantes.length ? mrr / pagantes.length : 0)}`} />
        <Kpi l="Recebido no mês" v={brl0(mesAtual?.recebido)} s={variacao === null ? `${mesAtual?.qtd || 0} pagamentos` : `${variacao >= 0 ? '+' : ''}${variacao}% vs mês anterior`} />
        <Kpi l="A receber em 7 dias" v={brl0(aReceber7)} s={atrasado ? `${brl0(atrasado)} em atraso` : 'Nada em atraso'} alerta={atrasado > 0} />
      </div>

      <div className="grid g4" style={{ marginTop: 12 }}>
        {['trial', 'ativo', 'inadimplente', 'suspenso', 'cancelado'].map(st => (
          <Link key={st} to={`/admin/clientes?status=${st}`} className="card adm-st">
            <span className={'pill ' + STATUS[st].cls}>{STATUS[st].rotulo}</span><b>{conta(st)}</b>
          </Link>
        ))}
        <div className="card adm-st"><span className="pill">Pedidos 30 dias</span><b>{pedidos30}</b><small className="muted">{brl0(gmv30)} vendidos pelos clientes</small></div>
      </div>

      <div className="adm-2col">
        <section className="card">
          <h2 className="adm-h">Precisa de atenção</h2>
          {!lista.length && <p className="muted">Tudo em dia.</p>}
          {lista.map(({ c, a }) => (
            <div className="adm-alert" key={c.id}>
              <div>
                <Link to={`/admin/clientes/${c.id}`} className="adm-nome">{c.nome}</Link>
                <div className="rowx" style={{ marginTop: 4 }}>{a.map((x, i) => <span key={i} className={'pill ' + x.nivel}>{x.txt}</span>)}</div>
              </div>
              {a.some(x => /atraso|Vence|Venceu/.test(x.txt)) && (c.contato_celular || c.whatsapp) && (
                <a className="btn ghost sm" href={zap(c.contato_celular || c.whatsapp, msgCobranca(c))} target="_blank" rel="noopener">Cobrar</a>
              )}
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="adm-h">Recebido por mês</h2>
          <div className="adm-bars" role="img" aria-label="Receita recebida nos últimos 12 meses">
            {receita.map(r => {
              const d = new Date(r.mes + 'T12:00:00')
              return (
                <div className="adm-bar" key={r.mes} title={`${d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}: ${brl(r.recebido)}`}>
                  <span className="v">{Number(r.recebido) ? brl0(r.recebido).replace('R$ ', '') : ''}</span>
                  <i style={{ height: `${(Number(r.recebido) / maxRec) * 100}%` }} />
                  <span className="m">{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function Kpi({ l, v, s, destaque, alerta }) {
  return (
    <div className={'card kpi' + (destaque ? ' adm-hi' : '') + (alerta ? ' adm-bad' : '')}>
      <div className="l">{l}</div><div className="v">{v}</div>{s && <div className="s muted">{s}</div>}
    </div>
  )
}
