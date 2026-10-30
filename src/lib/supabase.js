import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) console.warn('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')

export const supabase = createClient(url, key)
export const DOMINIO = import.meta.env.VITE_DOMINIO || window.location.host

export const fmt = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',')
export const soDigitos = (s) => (s || '').replace(/\D/g, '')

/** Descobre o slug do restaurante: subdomínio (jhonnys.plataforma.com) ou rota (/jhonnys) */
export function slugDoHost() {
  const h = window.location.hostname
  const base = DOMINIO.split(':')[0]
  if (h !== base && h.endsWith('.' + base)) {
    const sub = h.slice(0, -(base.length + 1))
    if (sub && !['www', 'app', 'painel', 'admin'].includes(sub)) return sub
  }
  return null
}

/** Carrega restaurante + cardápio completo por slug (uso público) */
export async function carregarCardapio(slug) {
  const { data: r, error } = await supabase.from('restaurantes').select('*').eq('slug', slug).maybeSingle()
  if (error || !r) return null
  const [{ data: cats }, { data: itens }] = await Promise.all([
    supabase.from('categorias').select('*').eq('restaurante_id', r.id).eq('ativa', true).order('ordem'),
    supabase.from('itens').select('*').eq('restaurante_id', r.id).eq('ativo', true).order('ordem'),
  ])
  return { restaurante: r, categorias: (cats || []).map(c => ({ ...c, itens: (itens || []).filter(i => i.categoria_id === c.id) })) }
}

export const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}
