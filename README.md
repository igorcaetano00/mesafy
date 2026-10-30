# Mesafy

Cardápio digital com pedido pelo WhatsApp, painel do restaurante e painel admin.
Stack: React (Vite) no Netlify + Supabase (banco, login, tempo real, fotos). Custo zero no início.

## Subir em 20 minutos

### 1. Supabase (banco)
1. Crie conta em supabase.com e um projeto (região: South America, São Paulo).
2. Menu **SQL Editor** > New query > cole `supabase/schema.sql` inteiro > Run.
3. Nova query > cole `supabase/seed_jhonnys.sql` > Run. (Cria o Jhonny's com o cardápio completo.)
4. Menu **Authentication > Providers > Email**: desligue "Confirm email" por enquanto (facilita o piloto).
5. Menu **Project Settings > API**: copie `Project URL` e `anon public key`.
6. No `schema.sql`, a função `is_admin()` lista o e-mail do administrador. Troque se precisar e rode de novo só aquele bloco.

### 2. Netlify (site)
1. Suba esta pasta num repositório no GitHub (sem a pasta `node_modules` e sem `.env`).
2. Em app.netlify.com > Add new site > Import from Git > escolha o repositório. Build command e publish já vêm do `netlify.toml`.
3. **Site settings > Environment variables**, adicione:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
   - `VITE_DOMINIO` = o domínio do site (ex.: `mesafy.netlify.app`, sem https)
4. Deploy. O site abre em `https://SEU-SITE.netlify.app`.

### 3. Primeiro acesso
- Cardápio do Jhonny's: `https://SEU-SITE.netlify.app/jhonnys-garage`
- Painel: `https://SEU-SITE.netlify.app/login` > "Ainda não tenho conta" > crie o usuário do dono.
- Vincule o dono ao restaurante (SQL Editor):
  ```sql
  update restaurantes set owner_id = (select id from auth.users where email = 'EMAIL_DO_DONO') where slug = 'jhonnys-garage';
  ```
- Admin da plataforma: `https://SEU-SITE.netlify.app/admin` (precisa logar com o e-mail listado em `is_admin()`).

Qualquer novo restaurante que criar conta em `/login` cai no onboarding e cria o próprio cardápio sozinho.

## Rodar local
```
npm install
cp .env.example .env   # preencha
npm run dev
```

## Estrutura
```
supabase/schema.sql        tabelas, segurança (RLS), tempo real, storage, relatórios
supabase/seed_jhonnys.sql  restaurante piloto
src/pages/Menu.jsx         cardápio público + carrinho + pedido (grava no banco e abre WhatsApp)
src/pages/painel/          Resumo, Pedidos (tempo real), Cardápio (CRUD), QR Code, Configurações, Onboarding
src/pages/admin/           lista de restaurantes, ativar/suspender
src/lib/supabase.js        cliente, helpers, resolução de subdomínio
netlify/functions/         (Dia 3) webhook Asaas, extração de cardápio por IA
```

## Subdomínio por restaurante (depois)
Com domínio próprio: em Netlify > Domain management adicione `*.seudominio.com` (wildcard) e no DNS um CNAME `*` apontando para o site. O código já resolve `jhonnys.seudominio.com` para o slug `jhonnys`.

## Roadmap
- Dia 2: upload de cardápio (PDF/Word/JPG) com extração por IA; despesas; clientes
- Dia 3: landing de vendas, checkout Asaas (mensal/anual), webhook de pagamento, bloqueio por inadimplência
- Depois: delivery com taxa por bairro, imagens de IA pelo painel, domínio próprio automatizado
