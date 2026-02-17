-- 1. Criar tabela de Unidades
create table if not exists unidades (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  cnpj text,
  logo_url text,
  slug text unique,
  created_at timestamp with time zone default now()
);

-- 2. Criar Unidade Padrão (Matriz)
-- Usamos um ID fixo para facilitar migração, ou geramos um e usamos ele.
-- Vamos usar um UUID fixo para garantir que o script seja idempotente/reprodutível.
insert into unidades (id, nome, slug)
values ('00000000-0000-0000-0000-000000000001', 'Matriz', 'matriz')
on conflict (id) do nothing;

-- 3. Tabela de Ligação Usuário-Unidade
create table if not exists user_unidades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  unidade_id uuid references unidades(id) on delete cascade,
  role text not null, -- copia de user_roles por enquanto
  created_at timestamp with time zone default now(),
  unique(user_id, unidade_id)
);

-- Habilitar RLS em unidades e user_unidades
alter table unidades enable row level security;
alter table user_unidades enable row level security;

-- Policy simples pra começar (usuário vê as unidades que pertence)
create policy "Ver unidades vinculadas" on unidades
  for select
  using (
    id in (select unidade_id from user_unidades where user_id = auth.uid())
  );

create policy "Ver seu próprio vínculo" on user_unidades
  for select
  using (user_id = auth.uid());

-- Migrar roles existentes para user_unidades (vinculados à Matriz)
insert into user_unidades (user_id, unidade_id, role)
select user_id, '00000000-0000-0000-0000-000000000001', role
from user_roles
on conflict (user_id, unidade_id) do nothing;

-- 4. Função auxiliar para adicionar unidade_id
create or replace function add_unidade_column_safe(tbl text) returns void as $$
begin
  -- Verificar se a tabela existe antes de tentar alterar
  if not exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = tbl
  ) then
    raise notice 'Tabela % não existe, pulando.', tbl;
    return;
  end if;

  -- Adicionar coluna permitindo NULL inicialmente
  execute format('alter table %I add column if not exists unidade_id uuid references unidades(id);', tbl);
  
  -- Preencher existentes com a Matriz
  execute format('update %I set unidade_id = %L where unidade_id is null;', tbl, '00000000-0000-0000-0000-000000000001');
  
  -- Definir DEFAULT para não quebrar INSERTs novos do frontend antigo
  execute format('alter table %I alter column unidade_id set default %L;', tbl, '00000000-0000-0000-0000-000000000001');
  
  -- Agora impor NOT NULL
  execute format('alter table %I alter column unidade_id set not null;', tbl);
end;
$$ language plpgsql;

-- Aplicar nas tabelas
select add_unidade_column_safe('alunos');
select add_unidade_column_safe('matriculas');
select add_unidade_column_safe('pagamentos');
select add_unidade_column_safe('turmas');
select add_unidade_column_safe('atividades');
select add_unidade_column_safe('comunicados');
select add_unidade_column_safe('audit_logs');
select add_unidade_column_safe('custos_predio');
-- select add_unidade_column_safe('profiles'); -- Profiles são globais? Geralmente sim. Mas se o dado for sensível... vamos deixar profiles global por enquanto e user_unidades define o acesso.

drop function add_unidade_column_safe(text);
