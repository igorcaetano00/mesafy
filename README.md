# FOODPORN Menu

Cardápio digital no QR Code com pedido pelo WhatsApp, painel do restaurante e painel admin da plataforma.
Domínio: **foodporn.com.br** (garcononline.com.br redireciona para ele)

Inclui a landing da marca FOODPORN com a vitrine de e-books (Hotmart). Capas e logo em `public/fp/`.

Stack: React (Vite) no **Cloudflare Pages** + Pages Functions (`functions/`) + Supabase (banco, login, tempo real, fotos) + Gemini (leitura de cardápio).

## Hospedagem (Cloudflare Pages)
- Projeto conectado a este repositório no GitHub. Cada envio na `main` publica sozinho.
- Build: `npm run build` · Pasta de saída: `dist`
- Rotas do React: o Pages serve o `index.html` para qualquer rota (não há `404.html`), então `/admin`, `/painel` e `/:slug` funcionam.
- Função de servidor: `functions/api/ler-cardapio.js` responde em `POST /api/ler-cardapio`.

### Variáveis de ambiente (Settings > Variables and Secrets, em Production)
| Nome | Tipo | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | Texto | URL do projeto Supabase (build e função) |
| `VITE_SUPABASE_ANON_KEY` | Texto | Chave pública do Supabase (build e função) |
| `GEMINI_API_KEY` | **Secret** | Leitura de cardápio por IA |
| `GEMINI_MODEL` | Texto, opcional | Troca o modelo sem mexer no código |

Depois de mudar uma variável, rode um novo deploy (Deployments > Retry deployment).

### Domínio próprio
1. Em Cloudflare: Add a domain > `foodporn.com.br` (plano Free).
2. No registro.br, troque os servidores DNS pelos dois que o Cloudflare indicar.
3. No projeto Pages: Custom domains > adicione `foodporn.com.br` e `www.foodporn.com.br`.
4. No Supabase: Authentication > URL Configuration > Site URL `https://foodporn.com.br` e Redirect URLs `https://foodporn.com.br/**`.

## Supabase
1. SQL Editor: rode `supabase/schema.sql`, depois `supabase/admin.sql`. `supabase/seed_jhonnys.sql` cria o restaurante piloto.
2. `is_admin()` (em `schema.sql`) define o e-mail do administrador da plataforma. Ele precisa bater com `ADMINS` em `src/pages/admin/Admin.jsx`.
3. Authentication > URL Configuration: Site URL e Redirect URLs com o endereço público do site.

## Acessos
- Cardápio: `/{slug}` (ex.: `/jhonnys-garage`)
- Painel do restaurante: `/login` > `/painel`
- Admin da plataforma: `/admin` (visão geral, clientes, ficha, pagamentos, consumidores)
- O dono cria a conta em `/login`; o admin vincula pelo e-mail na ficha do cliente.

## Rodar local
```
npm install
cp .env.example .env   # preencha
npm run dev
```

## Estrutura
```
supabase/schema.sql        tabelas, segurança (RLS), tempo real, storage, relatórios, criar_pedido
supabase/admin.sql         pagamentos, notas, funções do admin (métricas, vincular dono, registrar pagamento)
functions/api/             funções de servidor do Cloudflare Pages (leitura de cardápio por IA)
src/pages/Home.jsx         landing de vendas
src/pages/Menu.jsx         cardápio público + carrinho + pedido (grava no banco e abre WhatsApp)
src/pages/painel/          painel do restaurante (pedidos em tempo real, cardápio, importar, QR, configurações)
src/pages/admin/           painel admin da plataforma
src/lib/comercial.js       preços, links de pagamento, regras de cobrança
```

## Roadmap
- Webhook do Asaas (pagamento entra sozinho e atualiza o status)
- Despesas e relatórios do restaurante
- Delivery com taxa por bairro
- Subdomínio por restaurante (`bar.foodporn.com.br`), já suportado no código
