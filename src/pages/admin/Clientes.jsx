import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAdmin } from './Admin'
import { supabase, soDigitos } from '../../lib/supabase'
import { alertas, brl, csv, data, diasDesde, PLANOS, PRECO_ANO, PRECO_MES, STATUS, hoje } from '../../lib/comercial'

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function Clientes() {
  const { clientes, recarregar, avisar } = useAdmin()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [novo, setNovo] = useState(false)
  const filtro = sp.get('status') || 'todos'

  const lista = useMemo(() => clientes.filter(c =>
    (filtro === 'todos' || c.status === filtro) &&
    (!q || [c.nome, c.cidade, c.contato_nome, c.dono_email, c.slug].join(' ').toLowerCase().includes(q.toLowerCase()))
  ), [clientes, filtro, q])

  function exportar() {
    csv(`mesafy-clientes-${hoje()}.csv`, lista.map(c => ({
      cliente: c.nome, cidade: c.cidade, uf: c.uf, status: STATUS[c.status]?.rotulo, plano: PLANOS[c.plano],
      valor: c.valor_mensal, mrr: c.mrr, vencimento: c.proximo_vencimento, contato: c.contato_nome,
      celular: c.contato_celular || c.whatsapp, email: c.contato_email || c.dono_email, origem: c.origem,
      pedidos_30d: c.pedidos_30d, vendas_30d: c.faturamento_30d, total_pago: c.total_pago, criado_em: c.criado_em?.slice(0, 10),
    })))
  }

  return (
    <div className="page">
      <div className="rowx" style={{ justifyContent: 'space-between' }}>
        <div><h1>Clientes</h1><p className="sub">{lista.length} de {clientes.length}</p></div>
        <div className="rowx">
          <button className="btn ghost" onClick={exportar} disabled={!lista.length}>Exportar CSV</button>
          <button className="btn" onClick={() => setNovo(true)}>+ Novo cliente</button>
        </div>
      </div>

      <div className="adm-filtros">
        <input type="search" placeholder="Buscar por nome, cidade, contato, e-mail" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cliente" />
        <div className="rowx">
          {['todos', 'trial', 'ativo', 'inadimplente', 'suspenso', 'cancelado'].map(st => (
            <button key={st} className={'chip' + (filtro === st ? ' on' : '')} onClick={() => setSp(st === 'todos' ? {} : { status: st })}>
              {st === 'todos' ? 'Todos' : STATUS[st].rotulo} <small>{st === 'todos' ? clientes.length : clientes.filter(c => c.status === st).length}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card adm-tblwrap">
        <table className="tbl adm-tbl">
          <thead><tr>
            <th>Cliente</th><th>Plano</th><th>Status</th><th>Vencimento</th><th className="num">Pedidos 30d</th><th className="num">Vendas 30d</th><th>Último pedido</th><th>Atenção</th>
          </tr></thead>
          <tbody>
            {lista.map(c => {
              const a = alertas(c); const d = diasDesde(c.ultimo_pedido)
              return (
                <tr key={c.id}>
                  <td><Link to={`/admin/clientes/${c.id}`} className="adm-nome">{c.nome}</Link><div className="muted small">{[c.cidade, c.uf].filter(Boolean).join('/')}{c.contato_nome ? ` · ${c.contato_nome}` : ''}</div></td>
                  <td>{PLANOS[c.plano]}<div className="muted small">{c.valor_mensal != null ? brl(c.valor_mensal) : '-'}</div></td>
                  <td><span className={'pill ' + (STATUS[c.status]?.cls || '')}>{STATUS[c.status]?.rotulo}</span></td>
                  <td>{data(c.proximo_vencimento)}{c.dias_para_vencer != null && ['ativo', 'inadimplente'].includes(c.status) && <div className={'small ' + (c.dias_para_vencer < 0 ? 'adm-txtbad' : 'muted')}>{c.dias_para_vencer < 0 ? `${-c.dias_para_vencer}d atrasado` : `em ${c.dias_para_vencer}d`}</div>}</td>
                  <td className="num">{c.pedidos_30d}</td>
                  <td className="num">{brl(c.faturamento_30d)}</td>
                  <td>{d === null ? <span className="muted">Nunca</span> : d === 0 ? 'Hoje' : `${d}d atrás`}</td>
                  <td>{a.length ? <span className={'pill ' + (a.some(x => x.nivel === 'bad') ? 'bad' : 'warn')} title={a.map(x => x.txt).join(' · ')}>{a.length}</span> : <span className="muted">-</span>}</td>
                </tr>
              )
            })}
            {!lista.length && <tr><td colSpan={8} className="muted">Nenhum cliente neste filtro.</td></tr>}
          </tbody>
        </table>
      </div>

      {novo && <NovoCliente fechar={() => setNovo(false)} ok={async (id) => { await recarregar(); avisar('Cliente criado'); setNovo(false); return id }} />}
    </div>
  )
}

function NovoCliente({ fechar, ok }) {
  const nav = useNavigate()
  const [f, setF] = useState({ nome: '', slug: '', whatsapp: '', cidade: '', uf: 'ES', plano: 'mensal', valor_mensal: PRECO_MES, status: 'trial', contato_nome: '', contato_celular: '', contato_email: '', origem: '', proximo_vencimento: '' })
  const [slugTocado, setSlugTocado] = useState(false)
  const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false)
  const up = (k, v) => setF(x => {
    const n = { ...x, [k]: v }
    if (k === 'nome' && !slugTocado) n.slug = slugify(v)
    if (k === 'plano') n.valor_mensal = v === 'anual' ? PRECO_ANO : v === 'piloto' ? 0 : PRECO_MES
    return n
  })

  async function salvar(e) {
    e.preventDefault(); setErro(''); setSalvando(true)
    const wpp = soDigitos(f.whatsapp)
    const payload = {
      ...f, slug: slugify(f.slug), whatsapp: wpp.startsWith('55') ? wpp : '55' + wpp,
      whatsapp_exibicao: f.whatsapp, valor_mensal: Number(String(f.valor_mensal).replace(',', '.')) || 0,
      contato_celular: soDigitos(f.contato_celular) || null, proximo_vencimento: f.proximo_vencimento || null,
    }
    const { data: r, error } = await supabase.from('restaurantes').insert(payload).select('id').single()
    setSalvando(false)
    if (error) return setErro(error.code === '23505' ? 'Esse endereço (slug) já está em uso. Escolha outro.' : error.message)
    await ok(r.id); nav(`/admin/clientes/${r.id}`)
  }

  return (
    <div className="modal" onClick={e => e.target === e.currentTarget && fechar()}>
      <form className="box adm-box" onSubmit={salvar}>
        <h2>Novo cliente</h2>
        <div className="grid g2">
          <label className="f">Nome do estabelecimento<input value={f.nome} onChange={e => up('nome', e.target.value)} required autoFocus /></label>
          <label className="f">Endereço do cardápio<input value={f.slug} onChange={e => { setSlugTocado(true); up('slug', e.target.value) }} required /><small className="muted">mesafy-app.netlify.app/{slugify(f.slug) || '...'}</small></label>
          <label className="f">WhatsApp que recebe pedidos<input value={f.whatsapp} onChange={e => up('whatsapp', e.target.value)} inputMode="tel" placeholder="27 99999-9999" required /></label>
          <div className="grid" style={{ gridTemplateColumns: '1fr 70px' }}>
            <label className="f">Cidade<input value={f.cidade} onChange={e => up('cidade', e.target.value)} /></label>
            <label className="f">UF<input value={f.uf} maxLength={2} onChange={e => up('uf', e.target.value.toUpperCase())} /></label>
          </div>
          <label className="f">Plano<select value={f.plano} onChange={e => up('plano', e.target.value)}>{Object.entries(PLANOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="f">{f.plano === 'anual' ? 'Valor do ano (R$)' : 'Valor mensal (R$)'}<input value={f.valor_mensal} onChange={e => up('valor_mensal', e.target.value)} inputMode="decimal" /></label>
          <label className="f">Status inicial<select value={f.status} onChange={e => up('status', e.target.value)}><option value="trial">Teste</option><option value="ativo">Ativo</option></select></label>
          <label className="f">Primeiro vencimento<input type="date" value={f.proximo_vencimento} onChange={e => up('proximo_vencimento', e.target.value)} /></label>
          <label className="f">Nome do responsável<input value={f.contato_nome} onChange={e => up('contato_nome', e.target.value)} /></label>
          <label className="f">Celular do responsável<input value={f.contato_celular} onChange={e => up('contato_celular', e.target.value)} inputMode="tel" /></label>
          <label className="f">E-mail do responsável<input type="email" value={f.contato_email} onChange={e => up('contato_email', e.target.value)} /></label>
          <label className="f">Como chegou<input value={f.origem} onChange={e => up('origem', e.target.value)} placeholder="Indicação, Instagram, visita..." /></label>
        </div>
        {erro && <p className="adm-txtbad" style={{ margin: 0 }}>{erro}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={fechar}>Cancelar</button>
          <button className="btn" disabled={salvando}>{salvando ? 'Criando…' : 'Criar cliente'}</button>
        </div>
      </form>
    </div>
  )
}
