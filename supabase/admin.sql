-- =====================================================================
-- MESAFY | Painel administrativo da plataforma
-- Rodar depois do schema.sql. Idempotente.
-- =====================================================================

-- ---------- Dados comerciais do cliente ----------
alter table restaurantes add column if not exists valor_mensal       numeric(10,2);  -- valor cobrado (mensal) ou valor do ano (anual)
alter table restaurantes add column if not exists proximo_vencimento date;
alter table restaurantes add column if not exists contato_nome       text;
alter table restaurantes add column if not exists contato_email      text;
alter table restaurantes add column if not exists contato_celular    text;
alter table restaurantes add column if not exists origem             text;           -- indicação, instagram, visita...
alter table restaurantes add column if not exists cancelado_em       timestamptz;

-- ---------- Pagamentos recebidos ----------
create table if not exists pagamentos (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  valor          numeric(10,2) not null,
  pago_em        date not null default current_date,
  referente_a    date,                                -- início do período pago
  metodo         text default 'pix' check (metodo in ('pix','boleto','cartao','dinheiro','transferencia','outro')),
  referencia     text,                                -- id da cobrança no Asaas, nº do recibo
  status         text default 'pago' check (status in ('pago','estornado')),
  obs            text,
  criado_em      timestamptz default now()
);
create index if not exists pagamentos_rest on pagamentos (restaurante_id, pago_em desc);

-- ---------- Notas internas (histórico de atendimento) ----------
create table if not exists admin_notas (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade,
  texto          text not null,
  criado_em      timestamptz default now()
);

alter table pagamentos  enable row level security;
alter table admin_notas enable row level security;

drop policy if exists "admin pagamentos" on pagamentos;
create policy "admin pagamentos" on pagamentos for all using (is_admin()) with check (is_admin());
drop policy if exists "dono ve pagamentos" on pagamentos;
create policy "dono ve pagamentos" on pagamentos for select using (restaurante_id in (select meus_restaurantes()));

drop policy if exists "admin notas" on admin_notas;
create policy "admin notas" on admin_notas for all using (is_admin()) with check (is_admin());

-- Admin pode criar restaurante para um cliente (sem dono ainda)
drop policy if exists "admin cria restaurante" on restaurantes;
create policy "admin cria restaurante" on restaurantes for insert with check (is_admin());

-- ---------- Visão consolidada de cada cliente ----------
drop function if exists admin_clientes();
create or replace function admin_clientes()
returns table (
  id uuid, nome text, slug text, cidade text, uf text, whatsapp text, status text, plano text,
  valor_mensal numeric, mrr numeric, proximo_vencimento date, dias_para_vencer int,
  contato_nome text, contato_email text, contato_celular text, origem text,
  dono_email text, criado_em timestamptz,
  itens int, categorias int, pedidos_30d int, faturamento_30d numeric, ultimo_pedido timestamptz,
  total_pago numeric, ultimo_pagamento date
) language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Acesso restrito'; end if;
  return query
  select r.id, r.nome, r.slug, r.cidade, r.uf, r.whatsapp, r.status, r.plano,
         r.valor_mensal,
         case when r.status in ('ativo','inadimplente') then
           case r.plano when 'anual' then round(coalesce(r.valor_mensal,0)/12,2) else coalesce(r.valor_mensal,0) end
         else 0 end as mrr,
         r.proximo_vencimento,
         (r.proximo_vencimento - current_date)::int,
         r.contato_nome, r.contato_email, r.contato_celular, r.origem,
         u.email::text, r.criado_em,
         (select count(*)::int from itens i where i.restaurante_id = r.id),
         (select count(*)::int from categorias c where c.restaurante_id = r.id),
         (select count(*)::int from pedidos p where p.restaurante_id = r.id and p.criado_em >= now() - interval '30 days' and p.status <> 'cancelado'),
         (select coalesce(sum(p.total),0) from pedidos p where p.restaurante_id = r.id and p.criado_em >= now() - interval '30 days' and p.status <> 'cancelado'),
         (select max(p.criado_em) from pedidos p where p.restaurante_id = r.id),
         (select coalesce(sum(g.valor),0) from pagamentos g where g.restaurante_id = r.id and g.status = 'pago'),
         (select max(g.pago_em) from pagamentos g where g.restaurante_id = r.id and g.status = 'pago')
  from restaurantes r
  left join auth.users u on u.id = r.owner_id
  order by r.criado_em desc;
end $$;
revoke all on function admin_clientes() from public, anon;
grant execute on function admin_clientes() to authenticated;

-- ---------- Receita por mês (últimos 12) ----------
create or replace function admin_receita_mensal()
returns table (mes date, recebido numeric, qtd int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Acesso restrito'; end if;
  return query
  select m::date, coalesce(sum(g.valor),0), count(g.id)::int
  from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m
  left join pagamentos g on date_trunc('month', g.pago_em) = m and g.status = 'pago'
  group by m order by m;
end $$;
revoke all on function admin_receita_mensal() from public, anon;
grant execute on function admin_receita_mensal() to authenticated;

-- ---------- Registrar pagamento (e renovar o vencimento) ----------
create or replace function admin_registrar_pagamento(
  rid uuid, p_valor numeric, p_pago_em date default current_date,
  p_metodo text default 'pix', p_referencia text default null, p_obs text default null
) returns date language plpgsql security definer set search_path = public as $$
declare r restaurantes%rowtype; base date; novo date;
begin
  if not is_admin() then raise exception 'Acesso restrito'; end if;
  select * into r from restaurantes where id = rid;
  if r.id is null then raise exception 'Cliente não encontrado'; end if;
  base := greatest(coalesce(r.proximo_vencimento, p_pago_em), p_pago_em - 5);
  novo := base + case when r.plano = 'anual' then interval '1 year' else interval '1 month' end;
  insert into pagamentos (restaurante_id, valor, pago_em, referente_a, metodo, referencia, obs)
  values (rid, p_valor, p_pago_em, base, p_metodo, p_referencia, p_obs);
  update restaurantes set proximo_vencimento = novo,
         status = case when status in ('trial','inadimplente','suspenso') then 'ativo' else status end,
         valor_mensal = coalesce(valor_mensal, p_valor)
  where id = rid;
  return novo;
end $$;
revoke all on function admin_registrar_pagamento(uuid, numeric, date, text, text, text) from public, anon;
grant execute on function admin_registrar_pagamento(uuid, numeric, date, text, text, text) to authenticated;

-- ---------- Vincular o dono pelo e-mail de login ----------
create or replace function admin_vincular_dono(rid uuid, p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not is_admin() then raise exception 'Acesso restrito'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'Nenhuma conta com esse e-mail. Peça para o cliente criar a conta em /login primeiro.'; end if;
  update restaurantes set owner_id = uid where id = rid;
  insert into membros (restaurante_id, user_id, papel) values (rid, uid, 'dono') on conflict do nothing;
  return p_email;
end $$;
revoke all on function admin_vincular_dono(uuid, text) from public, anon;
grant execute on function admin_vincular_dono(uuid, text) to authenticated;

-- ---------- Marcar inadimplentes (vencido há mais de 3 dias) ----------
create or replace function admin_atualizar_status()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_admin() then raise exception 'Acesso restrito'; end if;
  update restaurantes set status = 'inadimplente'
  where status = 'ativo' and plano <> 'piloto' and proximo_vencimento is not null and proximo_vencimento < current_date - 3;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function admin_atualizar_status() from public, anon;
grant execute on function admin_atualizar_status() to authenticated;

-- ---------- Piloto: Jhonny's Garage ----------
update restaurantes set valor_mensal = coalesce(valor_mensal, 0), origem = coalesce(origem, 'Piloto')
where slug = 'jhonnys-garage';
