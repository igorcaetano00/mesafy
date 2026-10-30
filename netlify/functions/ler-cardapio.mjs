// Lê um cardápio (PDF, imagem ou Word) com o Gemini e devolve categorias e itens em JSON.
// Exige usuário logado no Mesafy. A chave GEMINI_API_KEY fica só aqui, no servidor.
import mammoth from 'mammoth'

const MODELO = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MAX_BYTES = 4.5 * 1024 * 1024

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    categorias: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nome: { type: 'STRING' },
          subtitulo: { type: 'STRING' },
          itens: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { nome: { type: 'STRING' }, descricao: { type: 'STRING' }, preco: { type: 'NUMBER' } },
              required: ['nome', 'preco'],
            },
          },
        },
        required: ['nome', 'itens'],
      },
    },
  },
  required: ['categorias'],
}

const PROMPT = `Você lê cardápios de bares, lanchonetes e restaurantes brasileiros e devolve os dados estruturados.
Regras:
- Agrupe os itens nas categorias do próprio cardápio (Lanches, Porções, Bebidas etc.), mantendo a ordem original.
- "nome": nome do prato como está escrito. "descricao": ingredientes ou observação, se houver, senão string vazia.
- "preco": número em reais, sem símbolo (ex.: 36.5). Se o item tem tamanhos ou variações com preços diferentes, crie um item por variação, com o tamanho no nome (ex.: "Pizza Calabresa (grande)").
- Se não houver preço legível, use 0.
- Não invente itens nem preços. Ignore telefone, endereço, redes sociais e textos promocionais.`

export default async (req) => {
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido' })
  const key = process.env.GEMINI_API_KEY
  if (!key) return json(500, { erro: 'Chave do Gemini não configurada no servidor.' })

  // 1) exige usuário logado
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const sbUrl = process.env.VITE_SUPABASE_URL, sbKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!token || !sbUrl || !sbKey) return json(401, { erro: 'Faça login para usar.' })
  const u = await fetch(`${sbUrl}/auth/v1/user`, { headers: { apikey: sbKey, authorization: `Bearer ${token}` } })
  if (!u.ok) return json(401, { erro: 'Sessão expirada. Entre de novo.' })

  // 2) lê o arquivo
  let body
  try { body = await req.json() } catch { return json(400, { erro: 'Requisição inválida.' }) }
  const { nome = '', tipo = '', dados = '' } = body
  if (!dados) return json(400, { erro: 'Nenhum arquivo enviado.' })
  const buf = Buffer.from(dados, 'base64')
  if (buf.length > MAX_BYTES) return json(413, { erro: 'Arquivo grande demais. Máximo de 4 MB.' })

  const ext = nome.toLowerCase().split('.').pop()
  const parts = [{ text: PROMPT }]
  try {
    if (ext === 'docx' || tipo.includes('wordprocessingml')) {
      const { value } = await mammoth.extractRawText({ buffer: buf })
      if (!value.trim()) return json(422, { erro: 'Não encontrei texto no Word.' })
      parts.push({ text: 'Cardápio:\n' + value.slice(0, 60000) })
    } else if (ext === 'pdf' || tipo === 'application/pdf') {
      parts.push({ inline_data: { mime_type: 'application/pdf', data: dados } })
    } else if (/^image\/(jpeg|png|webp|heic|heif)$/.test(tipo)) {
      parts.push({ inline_data: { mime_type: tipo, data: dados } })
    } else {
      return json(415, { erro: 'Formato não suportado. Envie PDF, JPG, PNG ou Word (.docx).' })
    }
  } catch (e) {
    return json(422, { erro: 'Não consegui abrir o arquivo.' })
  }

  // 3) chama o Gemini
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  })
  if (!r.ok) {
    console.error('gemini', r.status, (await r.text()).slice(0, 400))
    return json(502, { erro: 'A leitura automática falhou. Tente de novo ou envie uma foto mais nítida.' })
  }
  const out = await r.json()
  const txt = out?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
  try {
    const dadosCardapio = JSON.parse(txt)
    if (!dadosCardapio.categorias?.length) return json(422, { erro: 'Não encontrei itens neste arquivo.' })
    return json(200, dadosCardapio)
  } catch {
    return json(502, { erro: 'Resposta inesperada da leitura. Tente de novo.' })
  }
}
