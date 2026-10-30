-- =====================================================================
-- PLATAFORMA DE CARDÁPIO DIGITAL  |  Esquema Supabase (Postgres)
-- Rode inteiro no SQL Editor do Supabase. Idempotente o suficiente
-- para rodar de novo em projeto limpo.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- RESTAURANTES ----------
create table if not exists restaurantes (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,               -- jhonnys-garage  -> jhonnys-garage.plataforma.com
  nome          text not null,
  subtitulo     text,                               -- "Lanchonete e Petiscaria"
  descricao     text,                               -- frase do hero
  cidade        text,
  uf            text,
  whatsapp      text not null,                      -- só dígitos, com DDI: 5527997679086
  whatsapp_exibicao text,                           -- "27 99767-9086"
  cor           text default '#3dff8a',             -- acento
  logo_url      text,
  capa_url      text,
  modo          text default 'mesa' check (modo in ('mesa','delivery','ambos')),
  aberto        boolean default true,               -- chave manual "aberto/fechado"
  horarios      jsonb default '{}'::jsonb,          -- {"seg":["18:00","23:00"],...}
  dominio_proprio text,
  status        text default 'trial' check (status in ('trial','ativo','inadimplente','suspenso','cancelado')),
  plano         text default 'mensal' check (plano in ('mensal','anual','piloto')),
  owner_id      uuid references auth.users(id) on delete set null,
  criado_em     timestamptz default now()
);

-- ---------- MEMBROS (dono, caixa, cozinha) ----------
create table if not exists membros (
  restaurante_id uuid references restaurantes(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete cascade,
  papel          text default 'dono' check (papel in ('dono','caixa','cozinha')),
  primary key (restaurante_id, user_id)
);

-- ---------- CARDÁPIO ----------
create table if not exists categorias (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  nome           text not null,
  subtitulo      text,
  imagem_url     text,
  ordem          int default 0,
  ativa          boolean default true
);

create table if not exists itens (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  categoria_id   uuid references categorias(id) on delete cascade,
  nome           text not null,
  descricao      text,
  preco          numeric(10,2) not null default 0,
  imagem_url     text,
  destaque       text,                               -- "Da casa"
  esgotado       boolean default false,
  ativo          boolean default true,
  ordem          int default 0
);

-- ---------- DELIVERY (desativado no MVP, já preparado) ----------
create table if not exists bairros_entrega (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  nome           text not null,
  taxa           numeric(10,2) default 0,
  ativo          boolean default true
);

-- ---------- PEDIDOS ----------
create table if not exists pedidos (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  numero         int,
  tipo           text default 'mesa' check (tipo in ('mesa','delivery','retirada')),
  nome           text not null,
  celular        text not null,                      -- só dígitos
  mesa           text,
  endereco       text,
  bairro         text,
  itens          jsonb not null,                     -- [{nome, qtd, preco, subtotal}]
  subtotal       numeric(10,2) not null,
  taxa_entrega   numeric(10,2) default 0,
  total          numeric(10,2) not null,
  obs            text,
  status         text default 'novo' check (status in ('novo','preparo','pronto','entregue','cancelado')),
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);
create index if not exists pedidos_rest_data on pedidos (restaurante_id, criado_em desc);

-- número sequencial por restaurante
create or replace function set_numero_pedido() returns trigger language plpgsql as $$
begin
  select coalesce(max(numero),0)+1 into new.numero from pedidos where restaurante_id = new.restaurante_id;
  return new;
end $$;
drop trigger if exists trg_numero_pedido on pedidos;
create trigger trg_numero_pedido before insert on pedidos for each row execute function set_numero_pedido();

create or replace function touch_atualizado() returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end $$;
drop trigger if exists trg_touch_pedido on pedidos;
create trigger trg_touch_pedido before update on pedidos for each row execute function touch_atualizado();

-- ---------- CLIENTES (consolidado a partir dos pedidos) ----------
create table if not exists clientes (
  restaurante_id uuid references restaurantes(id) on delete cascade,
  celular        text,
  nome           text,
  total_pedidos  int default 0,
  total_gasto    numeric(12,2) default 0,
  primeiro_pedido timestamptz,
  ultimo_pedido  timestamptz,
  primary key (restaurante_id, celular)
);
create or replace function upsert_cliente() returns trigger language plpgsql security definer as $$
begin
  insert into clientes (restaurante_id, celular, nome, total_pedidos, total_gasto, primeiro_pedido, ultimo_pedido)
  values (new.restaurante_id, new.celular, new.nome, 1, new.total, new.criado_em, new.criado_em)
  on conflict (restaurante_id, celular) do update set
    nome = excluded.nome,
    total_pedidos = clientes.total_pedidos + 1,
    total_gasto   = clientes.total_gasto + excluded.total_gasto,
    ultimo_pedido = excluded.ultimo_pedido;
  return new;
end $$;
drop trigger if exists trg_cliente on pedidos;
create trigger trg_cliente after insert on pedidos for each row execute function upsert_cliente();

-- ---------- DESPESAS ----------
create table if not exists despesas (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  data           date not null default current_date,
  categoria      text not null,                      -- insumos, pessoal, aluguel, energia, marketing, outros
  valor          numeric(10,2) not null,
  descricao      text,
  criado_em      timestamptz default now()
);

-- ---------- ASSINATURAS (Asaas) ----------
create table if not exists assinaturas (
  id                    uuid primary key default gen_random_uuid(),
  restaurante_id        uuid references restaurantes(id) on delete cascade unique,
  asaas_customer_id     text,
  asaas_subscription_id text,
  plano                 text check (plano in ('mensal','anual','piloto')),
  valor                 numeric(10,2),
  status                text default 'pendente',     -- pendente, ativa, atrasada, cancelada
  proxima_cobranca      date,
  ultimo_pagamento      timestamptz,
  criado_em             timestamptz default now()
);

-- =====================================================================
-- SEGURANÇA (RLS)
-- =====================================================================
alter table restaurantes    enable row level security;
alter table membros         enable row level security;
alter table categorias      enable row level security;
alter table itens           enable row level security;
alter table bairros_entrega enable row level security;
alter table pedidos         enable row level security;
alter table clientes        enable row level security;
alter table despesas        enable row level security;
alter table assinaturas     enable row level security;

-- restaurantes em que o usuário logado é membro
create or replace function meus_restaurantes() returns setof uuid language sql stable security definer as $$
  select restaurante_id from membros where user_id = auth.uid()
  union
  select id from restaurantes where owner_id = auth.uid();
$$;

-- admin da plataforma: e-mails listados aqui
create or replace function is_admin() returns boolean language sql stable as $$
  select coalesce((auth.jwt() ->> 'email') in ('igorantcaetano@gmail.com'), false);
$$;

-- --- leitura pública do cardápio (anon) ---
drop policy if exists "pub restaurantes" on restaurantes;
create policy "pub restaurantes" on restaurantes for select using (status in ('trial','ativo','inadimplente'));
drop policy if exists "pub categorias" on categorias;
create policy "pub categorias" on categorias for select using (ativa);
drop policy if exists "pub itens" on itens;
create policy "pub itens" on itens for select using (ativo);
drop policy if exists "pub bairros" on bairros_entrega;
create policy "pub bairros" on bairros_entrega for select using (ativo);

-- --- cliente final cria pedido (anon) ---
drop policy if exists "pub cria pedido" on pedidos;
create policy "pub cria pedido" on pedidos for insert with check (true);

-- --- dono/membros gerenciam tudo do seu restaurante ---
drop policy if exists "dono restaurantes" on restaurantes;
create policy "dono restaurantes" on restaurantes for all
  using (id in (select meus_restaurantes()) or is_admin())
  with check (id in (select meus_restaurantes()) or is_admin());

drop policy if exists "membro ve membros" on membros;
create policy "membro ve membros" on membros for select using (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono gere membros" on membros;
create policy "dono gere membros" on membros for all
  using (restaurante_id in (select id from restaurantes where owner_id = auth.uid()) or is_admin())
  with check (restaurante_id in (select id from restaurantes where owner_id = auth.uid()) or is_admin());

drop policy if exists "dono categorias" on categorias;
create policy "dono categorias" on categorias for all
  using (restaurante_id in (select meus_restaurantes()) or is_admin())
  with check (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono itens" on itens;
create policy "dono itens" on itens for all
  using (restaurante_id in (select meus_restaurantes()) or is_admin())
  with check (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono bairros" on bairros_entrega;
create policy "dono bairros" on bairros_entrega for all
  using (restaurante_id in (select meus_restaurantes()) or is_admin())
  with check (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono pedidos" on pedidos;
create policy "dono pedidos" on pedidos for select using (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono atualiza pedidos" on pedidos;
create policy "dono atualiza pedidos" on pedidos for update
  using (restaurante_id in (select meus_restaurantes()) or is_admin())
  with check (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono clientes" on clientes;
create policy "dono clientes" on clientes for select using (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono despesas" on despesas;
create policy "dono despesas" on despesas for all
  using (restaurante_id in (select meus_restaurantes()) or is_admin())
  with check (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "dono assinatura" on assinaturas;
create policy "dono assinatura" on assinaturas for select using (restaurante_id in (select meus_restaurantes()) or is_admin());
drop policy if exists "admin assinatura" on assinaturas;
create policy "admin assinatura" on assinaturas for all using (is_admin()) with check (is_admin());

-- --- novo usuário cria o próprio restaurante no onboarding ---
drop policy if exists "cria restaurante" on restaurantes;
create policy "cria restaurante" on restaurantes for insert with check (auth.uid() = owner_id);

-- ---------- TEMPO REAL ----------
do $$ begin
  alter publication supabase_realtime add table pedidos;
exception when duplicate_object then null; end $$;

-- ---------- STORAGE (fotos) ----------
insert into storage.buckets (id, name, public) values ('fotos','fotos',true) on conflict do nothing;
drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects for select using (bucket_id = 'fotos');
drop policy if exists "membro sobe foto" on storage.objects;
create policy "membro sobe foto" on storage.objects for insert with check (bucket_id = 'fotos' and auth.role() = 'authenticated');
drop policy if exists "membro apaga foto" on storage.objects;
create policy "membro apaga foto" on storage.objects for delete using (bucket_id = 'fotos' and auth.role() = 'authenticated');

-- ---------- RELATÓRIO: resumo do dia/mês ----------
create or replace view v_vendas_dia as
  select restaurante_id, date_trunc('day', criado_em)::date as dia,
         count(*) as pedidos, sum(total) as faturamento, avg(total) as ticket_medio
  from pedidos where status <> 'cancelado'
  group by 1,2;

create or replace function mais_vendidos(rid uuid, desde date default current_date - 30)
returns table (nome text, qtd bigint, receita numeric) language sql stable as $$
  select i->>'nome', sum((i->>'qtd')::int), sum((i->>'subtotal')::numeric)
  from pedidos p, jsonb_array_elements(p.itens) i
  where p.restaurante_id = rid and p.criado_em >= desde and p.status <> 'cancelado'
  group by 1 order by 2 desc limit 20;
$$;

-- ---------- PEDIDO VIA FUNÇÃO (cliente anônimo não lê a tabela) ----------
create or replace function set_numero_pedido() returns trigger language plpgsql security definer as $$
begin
  select coalesce(max(numero),0)+1 into new.numero from pedidos where restaurante_id = new.restaurante_id;
  return new;
end $$;

create or replace function criar_pedido(p jsonb) returns int language plpgsql security definer as $$
declare n int; r restaurantes%rowtype;
begin
  select * into r from restaurantes where id = (p->>'restaurante_id')::uuid;
  if r.id is null then raise exception 'Restaurante não encontrado'; end if;
  if r.status in ('suspenso','cancelado') then raise exception 'Restaurante indisponível'; end if;
  if r.aberto = false then raise exception 'Restaurante fechado'; end if;
  insert into pedidos (restaurante_id,tipo,nome,celular,mesa,endereco,bairro,itens,subtotal,taxa_entrega,total,obs)
  values (r.id, coalesce(p->>'tipo','mesa'), p->>'nome', p->>'celular', p->>'mesa', p->>'endereco', p->>'bairro',
          p->'itens', (p->>'subtotal')::numeric, coalesce((p->>'taxa_entrega')::numeric,0), (p->>'total')::numeric, p->>'obs')
  returning numero into n;
  return n;
end $$;
revoke all on function criar_pedido(jsonb) from public;
grant execute on function criar_pedido(jsonb) to anon, authenticated;
