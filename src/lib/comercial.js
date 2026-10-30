// Configuração comercial do Garçom Online (um lugar só para o admin)
export const PRECO_MES = 149.9
export const PRECO_ANO = 1199
export const LINK_MENSAL = 'https://www.asaas.com/000/c/s2zixj3vfwpkoyf7'
export const LINK_ANUAL = 'https://www.asaas.com/000/c/cdkuyf36tv3frp5d'
// Endereço atual do site (vale para o domínio provisório e para garcononline.com.br)
export const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://garcononline.com.br'

export const STATUS = {
  trial: { rotulo: 'Teste', cls: 'warn' },
  ativo: { rotulo: 'Ativo', cls: 'on' },
  inadimplente: { rotulo: 'Em atraso', cls: 'bad' },
  suspenso: { rotulo: 'Suspenso', cls: 'bad' },
  cancelado: { rotulo: 'Cancelado', cls: '' },
}
export const PLANOS = { mensal: 'Mensal', anual: 'Anual', piloto: 'Piloto' }
export const METODOS = { pix: 'Pix', boleto: 'Boleto', cartao: 'Cartão', dinheiro: 'Dinheiro', transferencia: 'Transferência', outro: 'Outro' }

export const brl = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const brl0 = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
export const data = (d) => d ? new Date(String(d).length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR') : '-'
export const diasDesde = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null
export const hoje = () => new Date().toISOString().slice(0, 10)

export function zap(numero, msg) {
  let n = String(numero || '').replace(/\D/g, '')
  if (n && !n.startsWith('55')) n = '55' + n
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`
}

export function msgCobranca(c) {
  const link = c.plano === 'anual' ? LINK_ANUAL : LINK_MENSAL
  const nome = (c.contato_nome || '').split(' ')[0] || 'tudo bem'
  const venc = c.proximo_vencimento ? ` com vencimento em ${data(c.proximo_vencimento)}` : ''
  return `Olá, ${nome}! Aqui é o Igor, do Garçom Online. Passando para lembrar da mensalidade do cardápio digital do ${c.nome}${venc}, no valor de ${brl(c.valor_mensal || (c.plano === 'anual' ? PRECO_ANO : PRECO_MES))}.\n\nPode pagar por Pix, boleto ou cartão neste link: ${link}\n\nQualquer dúvida, é só me chamar.`
}

// Saúde do cliente: o que precisa de atenção
export function alertas(c) {
  const a = []
  if (c.status === 'inadimplente') a.push({ nivel: 'bad', txt: `Pagamento em atraso há ${-c.dias_para_vencer} dias` })
  else if (c.status === 'ativo' && c.plano !== 'piloto' && c.dias_para_vencer != null && c.dias_para_vencer <= 7)
    a.push({ nivel: 'warn', txt: c.dias_para_vencer < 0 ? `Venceu há ${-c.dias_para_vencer} dias` : c.dias_para_vencer === 0 ? 'Vence hoje' : `Vence em ${c.dias_para_vencer} dias` })
  if (['trial', 'ativo'].includes(c.status) && !c.itens) a.push({ nivel: 'warn', txt: 'Cardápio vazio' })
  if (['trial', 'ativo'].includes(c.status) && !c.dono_email) a.push({ nivel: 'warn', txt: 'Sem dono vinculado' })
  const d = diasDesde(c.ultimo_pedido)
  if (c.status === 'ativo' && c.itens && (d === null || d >= 7)) a.push({ nivel: 'warn', txt: d === null ? 'Nenhum pedido ainda' : `Sem pedidos há ${d} dias` })
  if (c.status === 'ativo' && c.plano !== 'piloto' && !c.proximo_vencimento) a.push({ nivel: 'warn', txt: 'Sem data de vencimento' })
  return a
}

export function csv(nome, linhas) {
  if (!linhas.length) return
  const cols = Object.keys(linhas[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const txt = [cols.join(';'), ...linhas.map(l => cols.map(c => esc(l[c])).join(';'))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' }))
  a.download = nome; a.click()
}
