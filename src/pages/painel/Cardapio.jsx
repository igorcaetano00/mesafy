import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase, fmt } from '../../lib/supabase'

export default function Cardapio() {
  const { rest } = useAuth()
  const [cats, setCats] = useState([]); const [itens, setItens] = useState([])
  const [edit, setEdit] = useState(null)      // {tipo:'item'|'cat', data}
  const [toast, setToast] = useState('')

  async function carregar() {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from('categorias').select('*').eq('restaurante_id', rest.id).order('ordem'),
      supabase.from('itens').select('*').eq('restaurante_id', rest.id).order('ordem'),
    ])
    setCats(c || []); setItens(i || [])
  }
  useEffect(() => { carregar() }, [rest.id])
  const ok = (t) => { setToast(t); setTimeout(() => setToast(''), 1800) }

  async function salvar(e) {
    e.preventDefault()
    const { tipo, data } = edit
    const tbl = tipo === 'item' ? 'itens' : 'categorias'
    const payload = { ...data, restaurante_id: rest.id }
    if (tipo === 'item') payload.preco = Number(String(payload.preco).replace(',', '.')) || 0
    delete payload.id
    const q = data.id ? supabase.from(tbl).update(payload).eq('id', data.id) : supabase.from(tbl).insert(payload)
    const { error } = await q
    if (error) return alert(error.message)
    setEdit(null); carregar(); ok('Salvo')
  }
  async function toggle(i, campo) { await supabase.from('itens').update({ [campo]: !i[campo] }).eq('id', i.id); carregar() }
  async function apagar(tbl, id) { if (!confirm('Apagar?')) return; await supabase.from(tbl).delete().eq('id', id); carregar(); ok('Apagado') }
  async function mover(tbl, lista, idx, dir) {
    const a = lista[idx], b = lista[idx + dir]; if (!b) return
    await Promise.all([supabase.from(tbl).update({ ordem: b.ordem }).eq('id', a.id), supabase.from(tbl).update({ ordem: a.ordem }).eq('id', b.id)])
    carregar()
  }
  async function foto(file, cb) {
    const path = `${rest.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
    const { error } = await supabase.storage.from('fotos').upload(path, file, { upsert: true })
    if (error) return alert(error.message)
    cb(supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl)
  }

  return (
    <div className="page">
      <div className="rowx" style={{ justifyContent: 'space-between' }}>
        <div><h1>Cardápio</h1><p className="sub">Altere preços, marque esgotado, reorganize. Muda na hora para o cliente.</p></div>
        <button className="btn" onClick={() => setEdit({ tipo: 'cat', data: { nome: '', subtitulo: '', ordem: cats.length + 1, ativa: true } })}>+ Categoria</button>
      </div>

      {cats.map((c, ci) => {
        const lista = itens.filter(i => i.categoria_id === c.id)
        return (
          <div key={c.id}>
            <div className="cathead">
              <h2>{c.nome} {!c.ativa && <span className="pill bad">Oculta</span>}</h2>
              <div className="rowx">
                <button className="iconb" onClick={() => mover('categorias', cats, ci, -1)} title="Subir">↑</button>
                <button className="iconb" onClick={() => mover('categorias', cats, ci, 1)} title="Descer">↓</button>
                <button className="iconb" onClick={() => setEdit({ tipo: 'cat', data: c })} title="Editar">✎</button>
                <button className="btn ghost" onClick={() => setEdit({ tipo: 'item', data: { categoria_id: c.id, nome: '', descricao: '', preco: '', ordem: lista.length + 1, ativo: true, esgotado: false } })}>+ Item</button>
              </div>
            </div>
            <div className="card">
              {lista.map((i, ii) => (
                <div className={'ed' + (i.esgotado || !i.ativo ? ' off' : '')} key={i.id}>
                  <div>
                    <div className="n">{i.nome} <span className="muted" style={{ fontFamily: 'var(--display)', fontSize: 18, marginLeft: 8 }}>{fmt(i.preco)}</span>
                      {i.destaque && <span className="pill warn" style={{ marginLeft: 8 }}>{i.destaque}</span>}
                      {i.esgotado && <span className="pill bad" style={{ marginLeft: 8 }}>Esgotado</span>}
                      {!i.ativo && <span className="pill" style={{ marginLeft: 8 }}>Oculto</span>}
                    </div>
                    {i.descricao && <div className="d">{i.descricao}</div>}
                  </div>
                  <div className="rowx">
                    <button className="iconb" onClick={() => mover('itens', lista, ii, -1)} title="Subir">↑</button>
                    <button className="iconb" onClick={() => mover('itens', lista, ii, 1)} title="Descer">↓</button>
                    <button className={'btn ghost'} onClick={() => toggle(i, 'esgotado')} style={{ padding: '6px 10px', fontSize: 12 }}>{i.esgotado ? 'Voltou' : 'Esgotou'}</button>
                    <button className="iconb" onClick={() => setEdit({ tipo: 'item', data: i })} title="Editar">✎</button>
                    <button className="iconb" onClick={() => apagar('itens', i.id)} title="Apagar">🗑</button>
                  </div>
                </div>
              ))}
              {!lista.length && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Sem itens. Clique em "+ Item".</p>}
            </div>
          </div>
        )
      })}
      {!cats.length && <p className="muted">Comece criando uma categoria (ex.: Lanches, Porções, Bebidas).</p>}

      {edit && (
        <div className="modal" onClick={e => e.target === e.currentTarget && setEdit(null)}>
          <form className="box" onSubmit={salvar}>
            <h2>{edit.data.id ? 'Editar' : 'Novo'} {edit.tipo === 'item' ? 'item' : 'categoria'}</h2>
            <label className="f">Nome<input id="e-nome" value={edit.data.nome} onChange={e => setEdit({ ...edit, data: { ...edit.data, nome: e.target.value } })} required autoFocus /></label>
            {edit.tipo === 'cat' ? (
              <>
                <label className="f">Subtítulo<input id="e-sub" value={edit.data.subtitulo || ''} onChange={e => setEdit({ ...edit, data: { ...edit.data, subtitulo: e.target.value } })} /></label>
                <label className="f">Imagem de capa da categoria
                  {edit.data.imagem_url && <img src={edit.data.imagem_url} alt="" style={{ height: 80, width: 'auto', borderRadius: 4 }} />}
                  <input id="e-img" type="file" accept="image/*" onChange={e => e.target.files[0] && foto(e.target.files[0], u => setEdit({ ...edit, data: { ...edit.data, imagem_url: u } }))} /></label>
                <label className="rowx" style={{ fontSize: 14 }}><input type="checkbox" style={{ width: 'auto' }} checked={edit.data.ativa} onChange={e => setEdit({ ...edit, data: { ...edit.data, ativa: e.target.checked } })} /> Visível no cardápio</label>
              </>
            ) : (
              <>
                <label className="f">Descrição<textarea id="e-desc" value={edit.data.descricao || ''} onChange={e => setEdit({ ...edit, data: { ...edit.data, descricao: e.target.value } })} rows={2} /></label>
                <div className="grid g2">
                  <label className="f">Preço (R$)<input id="e-preco" value={edit.data.preco} onChange={e => setEdit({ ...edit, data: { ...edit.data, preco: e.target.value } })} inputMode="decimal" required /></label>
                  <label className="f">Categoria<select id="e-cat" value={edit.data.categoria_id} onChange={e => setEdit({ ...edit, data: { ...edit.data, categoria_id: e.target.value } })}>{cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
                </div>
                <label className="f">Selo de destaque (ex.: Da casa, Novo)<input id="e-dest" value={edit.data.destaque || ''} onChange={e => setEdit({ ...edit, data: { ...edit.data, destaque: e.target.value || null } })} /></label>
                <label className="f">Foto do item
                  {edit.data.imagem_url && <img src={edit.data.imagem_url} alt="" style={{ height: 80, width: 'auto', borderRadius: 4 }} />}
                  <input id="e-foto" type="file" accept="image/*" onChange={e => e.target.files[0] && foto(e.target.files[0], u => setEdit({ ...edit, data: { ...edit.data, imagem_url: u } }))} /></label>
                <div className="rowx">
                  <label className="rowx" style={{ fontSize: 14 }}><input type="checkbox" style={{ width: 'auto' }} checked={edit.data.ativo} onChange={e => setEdit({ ...edit, data: { ...edit.data, ativo: e.target.checked } })} /> Visível</label>
                  <label className="rowx" style={{ fontSize: 14 }}><input type="checkbox" style={{ width: 'auto' }} checked={edit.data.esgotado} onChange={e => setEdit({ ...edit, data: { ...edit.data, esgotado: e.target.checked } })} /> Esgotado</label>
                </div>
              </>
            )}
            <div className="actions">
              {edit.data.id && edit.tipo === 'cat' && <button type="button" className="btn danger" onClick={() => { apagar('categorias', edit.data.id); setEdit(null) }}>Apagar categoria</button>}
              <button type="button" className="btn ghost" onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn">Salvar</button>
            </div>
          </form>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
