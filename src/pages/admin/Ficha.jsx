import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdmin } from './Admin'
import { supabase, soDigitos } from '../../lib/supabase'
import { alertas, brl, data, diasDesde, hoje, LINK_ANUAL, LINK_MENSAL, METODOS, msgCobranca, PLANOS, SITE, STATUS, zap } from '../../lib/comercial'

export default function Ficha() {
  const { id } = useParams()
  const nav = useNavigate()
  const { clientes, recarregar, avisar } = useAdmin()
  const c = clientes.find(x => x.id === id)
  const [pags, setPags] = useState([])
  const [notas, setNotas] = useState([])
  const [f, setF] = useState(null)

  async function carregarExtras() {
    const [p, n] = await Promise.all([
      supabase.from('pagamentos').select('*').eq('restaurante_id', id).order('pago_em', { ascending: false }),
      supabase.from('admin_notas').select('*').eq('restaurante_id', id).order('criado_em', { ascending: false }),
    ])
    setPags(p.data || []); setNotas(n.data || [])
  }
  useEffect(() => { carregarExtras() }, [id])
  useEffect(() => {
    if (c) setF({
      nome: c.nome, slug: c.slug, whatsapp: c.whatsapp, cidade: c.cidade || '', uf: c.uf || '', plano: c.plano,
      valor_mensal: c.valor_mensal == null ? '' : String(c.valor_mensal).replace('.', ','), proximo_vencimento: c.proximo_vencimento || '', contato_nome: c.contato_nome || '',
      contato_celular: c.contato_celular || '', contato_email: c.contato_email || '', origem: c.origem || '',
    })
  }, [c?.id, clientes])

  if (!c) return <div className="page"><p className="muted">Cliente não encontrado. <Link to="/admin/clientes">Voltar</Link></p></div>
  const a = alertas(c)
  const celular = c.contato_celular || c.whatsapp

  async function mudarStatus(status) {
    const extra = status === 'cancelado' ? { cancelado_em: new Date().toISOString() } : {}
    const { error } = await supabase.from('restaurantes').update({ status, ...extra }).eq('id', id)
    if (error) return alert(error.message)
    await recarregar(); avisar(`Status: ${STATUS[status].rotulo}`)
  }

  async function salvarDados(e) {
    e.preventDefault()
    const wpp = soDigitos(f.whatsapp)
    const { error } = await supabase.from('restaurantes').update({
      ...f, whatsapp: wpp.startsWith('55') ? wpp : '55' + wpp,
      valor_mensal: f.valor_mensal === '' ? null : Number(String(f.valor_mensal).replace(',', '.')),
      proximo_vencimento: f.proximo_vencimento || null, contato_celular: soDigitos(f.contato_celular) || null,
    }).eq('id', id)
    if (error) return alert(error.code === '23505' ? 'Esse endereço (slug) já está em uso.' : error.message)
    await recarregar(); avisar('Dados salvos')
  }

  async function excluir() {
    const conf = prompt(`Excluir ${c.nome} apaga cardápio, pedidos, clientes e pagamentos dele. Não dá para desfazer.\n\nDigite o endereço "${c.slug}" para confirmar:`)
    if (conf !== c.slug) return
    const { error } = await supabase.from('restaurantes').delete().eq('id', id)
    if (error) return alert(error.message)
    await recarregar(); avisar('Cliente excluído'); nav('/admin/clientes')
  }

  return (
    <div className="page">
      <Link to="/admin/clientes" className="muted small">← Clientes</Link>
      <div className="adm-head">
        <div>
          <h1>{c.nome}</h1>
          <div className="rowx">
            <span className={'pill ' + (STATUS[c.status]?.cls || '')}>{STATUS[c.status]?.rotulo}</span>
            <span className="pill">{PLANOS[c.plano]}{c.valor_mensal != null ? ` · ${brl(c.valor_mensal)}` : ''}</span>
            <span className="muted small">Cliente desde {data(c.criado_em)}</span>
          </div>
        </div>
        <div className="rowx">
          <a className="btn ghost" href={`/${c.slug}`} target="_blank" rel="noopener">Ver cardápio</a>
          {celular && <a className="btn ghost" href={zap(celular, `Olá, ${(c.contato_nome || '').split(' ')[0] || 'tudo bem'}! Aqui é o Igor, da FOODPORN.`)} target="_blank" rel="noopener">WhatsApp</a>}
          {celular && c.plano !== 'piloto' && <a className="btn" href={zap(celular, msgCobranca(c))} target="_blank" rel="noopener">Enviar cobrança</a>}
        </div>
      </div>

      {a.length > 0 && <div className="rowx" style={{ margin: '4px 0 16px' }}>{a.map((x, i) => <span key={i} className={'pill ' + x.nivel}>{x.txt}</span>)}</div>}

      <div className="grid g4">
        <Mini l="Pedidos 30 dias" v={c.pedidos_30d} />
        <Mini l="Vendas 30 dias" v={brl(c.faturamento_30d)} />
        <Mini l="Itens no cardápio" v={c.itens} s={`${c.categorias} categorias`} />
        <Mini l="Último pedido" v={c.ultimo_pedido ? (diasDesde(c.ultimo_pedido) === 0 ? 'Hoje' : `${diasDesde(c.ultimo_pedido)}d atrás`) : 'Nunca'} />
        <Mini l="Próximo vencimento" v={data(c.proximo_vencimento)} s={c.dias_para_vencer != null ? (c.dias_para_vencer < 0 ? `${-c.dias_para_vencer} dias em atraso` : `em ${c.dias_para_vencer} dias`) : ''} />
        <Mini l="Total pago" v={brl(c.total_pago)} s={c.ultimo_pagamento ? `Último em ${data(c.ultimo_pagamento)}` : 'Nenhum pagamento'} />
      </div>

      <div className="adm-2col">
        <div className="grid" style={{ alignContent: 'start' }}>
          <Pagamento c={c} pags={pags} depois={async () => { await Promise.all([recarregar(), carregarExtras()]) }} avisar={avisar} />
          <Notas id={id} notas={notas} depois={carregarExtras} />
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Acesso c={c} depois={recarregar} avisar={avisar} />

          {f && (
            <form className="card grid" onSubmit={salvarDados}>
              <h2 className="adm-h">Dados do cliente</h2>
              <div className="grid g2">
                <label className="f">Nome<input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} required /></label>
                <label className="f">Endereço (slug)<input value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} required /></label>
                <label className="f">WhatsApp de pedidos<input value={f.whatsapp} onChange={e => setF({ ...f, whatsapp: e.target.value })} required /></label>
                <div className="grid" style={{ gridTemplateColumns: '1fr 70px' }}>
                  <label className="f">Cidade<input value={f.cidade} onChange={e => setF({ ...f, cidade: e.target.value })} /></label>
                  <label className="f">UF<input value={f.uf} maxLength={2} onChange={e => setF({ ...f, uf: e.target.value.toUpperCase() })} /></label>
                </div>
                <label className="f">Plano<select value={f.plano} onChange={e => setF({ ...f, plano: e.target.value })}>{Object.entries(PLANOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label className="f">{f.plano === 'anual' ? 'Valor do ano (R$)' : 'Valor mensal (R$)'}<input value={f.valor_mensal} onChange={e => setF({ ...f, valor_mensal: e.target.value })} inputMode="decimal" /></label>
                <label className="f">Próximo vencimento<input type="date" value={f.proximo_vencimento} onChange={e => setF({ ...f, proximo_vencimento: e.target.value })} /></label>
                <label className="f">Como chegou<input value={f.origem} onChange={e => setF({ ...f, origem: e.target.value })} /></label>
                <label className="f">Responsável<input value={f.contato_nome} onChange={e => setF({ ...f, contato_nome: e.target.value })} /></label>
                <label className="f">Celular do responsável<input value={f.contato_celular} onChange={e => setF({ ...f, contato_celular: e.target.value })} inputMode="tel" /></label>
                <label className="f">E-mail do responsável<input type="email" value={f.contato_email} onChange={e => setF({ ...f, contato_email: e.target.value })} /></label>
              </div>
              <div className="actions"><button className="btn">Salvar dados</button></div>
            </form>
          )}

          <section className="card grid">
            <h2 className="adm-h">Status da conta</h2>
            <p className="muted small" style={{ margin: 0 }}>Suspenso ou cancelado tira o cardápio do ar. Em atraso mantém o cardápio funcionando.</p>
            <div className="rowx">
              {c.status !== 'ativo' && <button className="btn" onClick={() => mudarStatus('ativo')}>Ativar</button>}
              {c.status !== 'trial' && c.status !== 'ativo' && <button className="btn ghost" onClick={() => mudarStatus('trial')}>Voltar para teste</button>}
              {c.status !== 'suspenso' && c.status !== 'cancelado' && <button className="btn ghost" onClick={() => confirm(`Suspender ${c.nome}? O cardápio sai do ar.`) && mudarStatus('suspenso')}>Suspender</button>}
              {c.status !== 'cancelado' && <button className="btn ghost" onClick={() => confirm(`Marcar ${c.nome} como cancelado? O cardápio sai do ar.`) && mudarStatus('cancelado')}>Cancelar assinatura</button>}
            </div>
            <div className="adm-links small">
              <span className="muted">Links de pagamento:</span>
              <button type="button" className="linkbtn" onClick={() => { navigator.clipboard?.writeText(LINK_MENSAL); avisar('Link mensal copiado') }}>copiar mensal</button>
              <button type="button" className="linkbtn" onClick={() => { navigator.clipboard?.writeText(LINK_ANUAL); avisar('Link anual copiado') }}>copiar anual</button>
              <button type="button" className="linkbtn" onClick={() => { navigator.clipboard?.writeText(`${SITE}/${c.slug}`); avisar('Link do cardápio copiado') }}>copiar link do cardápio</button>
            </div>
          </section>

          <section className="card grid adm-danger">
            <h2 className="adm-h">Excluir cliente</h2>
            <p className="muted small" style={{ margin: 0 }}>Apaga o restaurante e todo o histórico. Prefira "Cancelar assinatura" para manter os dados.</p>
            <div><button className="btn danger" onClick={excluir}>Excluir definitivamente</button></div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Mini({ l, v, s }) {
  return <div className="card kpi"><div className="l">{l}</div><div className="v adm-v">{v}</div>{s && <div className="s muted small">{s}</div>}</div>
}

function Pagamento({ c, pags, depois, avisar }) {
  const [aberto, setAberto] = useState(false)
  const [p, setP] = useState({ valor: c.valor_mensal || '', pago_em: hoje(), metodo: 'pix', referencia: '', obs: '' })
  const [salvando, setSalvando] = useState(false)

  async function registrar(e) {
    e.preventDefault(); setSalvando(true)
    const { data: novo, error } = await supabase.rpc('admin_registrar_pagamento', {
      rid: c.id, p_valor: Number(String(p.valor).replace(',', '.')), p_pago_em: p.pago_em,
      p_metodo: p.metodo, p_referencia: p.referencia || null, p_obs: p.obs || null,
    })
    setSalvando(false)
    if (error) return alert(error.message)
    setAberto(false); await depois(); avisar(`Pagamento registrado. Próximo vencimento: ${data(novo)}`)
  }
  async function estornar(pg) {
    if (!confirm(`Marcar o pagamento de ${brl(pg.valor)} (${data(pg.pago_em)}) como estornado? O vencimento não é alterado.`)) return
    await supabase.from('pagamentos').update({ status: 'estornado' }).eq('id', pg.id); await depois(); avisar('Pagamento estornado')
  }

  return (
    <section className="card grid">
      <div className="rowx" style={{ justifyContent: 'space-between' }}>
        <h2 className="adm-h">Pagamentos</h2>
        {!aberto && <button className="btn" onClick={() => setAberto(true)}>Registrar pagamento</button>}
      </div>
      {aberto && (
        <form className="grid adm-inset" onSubmit={registrar}>
          <div className="grid g2">
            <label className="f">Valor (R$)<input value={p.valor} onChange={e => setP({ ...p, valor: e.target.value })} inputMode="decimal" required autoFocus /></label>
            <label className="f">Data do pagamento<input type="date" value={p.pago_em} onChange={e => setP({ ...p, pago_em: e.target.value })} required /></label>
            <label className="f">Forma<select value={p.metodo} onChange={e => setP({ ...p, metodo: e.target.value })}>{Object.entries(METODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="f">Referência<input value={p.referencia} onChange={e => setP({ ...p, referencia: e.target.value })} placeholder="Nº da cobrança no Asaas, recibo" /></label>
          </div>
          <label className="f">Observação<input value={p.obs} onChange={e => setP({ ...p, obs: e.target.value })} /></label>
          <p className="muted small" style={{ margin: 0 }}>Ao registrar, o vencimento avança {c.plano === 'anual' ? '1 ano' : '1 mês'} e a conta volta para Ativo, se estiver em atraso.</p>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setAberto(false)}>Cancelar</button>
            <button className="btn" disabled={salvando}>{salvando ? 'Salvando…' : 'Registrar'}</button>
          </div>
        </form>
      )}
      {!pags.length && !aberto && <p className="muted small" style={{ margin: 0 }}>Nenhum pagamento registrado.</p>}
      {pags.length > 0 && (
        <table className="tbl">
          <thead><tr><th>Data</th><th>Forma</th><th className="num">Valor</th><th></th></tr></thead>
          <tbody>{pags.map(pg => (
            <tr key={pg.id} className={pg.status === 'estornado' ? 'adm-off' : ''}>
              <td>{data(pg.pago_em)}{pg.referencia && <div className="muted small">{pg.referencia}</div>}</td>
              <td>{METODOS[pg.metodo]}{pg.status === 'estornado' && <span className="pill bad" style={{ marginLeft: 6 }}>Estornado</span>}</td>
              <td className="num">{brl(pg.valor)}</td>
              <td className="num">{pg.status === 'pago' && <button className="linkbtn small" onClick={() => estornar(pg)}>estornar</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </section>
  )
}

function Notas({ id, notas, depois }) {
  const [txt, setTxt] = useState('')
  async function add(e) {
    e.preventDefault(); if (!txt.trim()) return
    const { error } = await supabase.from('admin_notas').insert({ restaurante_id: id, texto: txt.trim() })
    if (error) return alert(error.message)
    setTxt(''); depois()
  }
  async function apagar(n) { if (confirm('Apagar esta nota?')) { await supabase.from('admin_notas').delete().eq('id', n.id); depois() } }
  return (
    <section className="card grid">
      <h2 className="adm-h">Histórico de atendimento</h2>
      <form className="grid" onSubmit={add}>
        <textarea rows={2} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Ex.: Liguei, combinou pagar dia 10. Pediu foto nova do X-Bacon." aria-label="Nova nota" />
        <div className="actions"><button className="btn ghost" disabled={!txt.trim()}>Adicionar nota</button></div>
      </form>
      {notas.map(n => (
        <div key={n.id} className="adm-nota">
          <div className="muted small">{new Date(n.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}<button className="linkbtn small" onClick={() => apagar(n)} style={{ marginLeft: 8 }}>apagar</button></div>
          <div>{n.texto}</div>
        </div>
      ))}
    </section>
  )
}

function Acesso({ c, depois, avisar }) {
  const [email, setEmail] = useState(c.contato_email || '')
  const [erro, setErro] = useState('')
  async function vincular(e) {
    e.preventDefault(); setErro('')
    const { error } = await supabase.rpc('admin_vincular_dono', { rid: c.id, p_email: email })
    if (error) return setErro(error.message)
    await depois(); avisar('Dono vinculado')
  }
  return (
    <section className="card grid">
      <h2 className="adm-h">Acesso do dono</h2>
      {c.dono_email
        ? <p style={{ margin: 0 }}>Painel vinculado a <b>{c.dono_email}</b>.</p>
        : <p className="muted small" style={{ margin: 0 }}>Ninguém vinculado. O dono cria a conta em {SITE}/login e você vincula pelo e-mail dele aqui.</p>}
      <form className="rowx" onSubmit={vincular}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@do-dono.com" required style={{ flex: 1, minWidth: 200 }} aria-label="E-mail do dono" />
        <button className="btn ghost">{c.dono_email ? 'Trocar dono' : 'Vincular'}</button>
      </form>
      {erro && <p className="adm-txtbad small" style={{ margin: 0 }}>{erro}</p>}
    </section>
  )
}
