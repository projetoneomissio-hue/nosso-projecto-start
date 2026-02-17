-- Tabela de Solicitações de Matrícula (Staging Area)
-- Permite que usuários não autenticados (anon) solicitem vaga.

create type status_solicitacao as enum ('pendente', 'aprovada', 'rejeitada');

create table if not exists solicitacoes_matricula (
  id uuid default gen_random_uuid() primary key,
  nome_completo text not null,
  whatsapp text not null,
  data_nascimento date not null,
  unidade_id uuid references unidades(id) not null,
  status status_solicitacao default 'pendente',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table solicitacoes_matricula enable row level security;

-- Policy 1: Anônimos podem INSERIR solicitações (Matrícula Online)
create policy "Anonimos podem solicitar matricula" on solicitacoes_matricula
  for insert
  to anon
  with check (true);

-- Policy 2: Usuários autenticados (Coordenação) podem VER e EDITAR solicitações da sua unidade
create policy "Coordenação vê solicitações da sua unidade" on solicitacoes_matricula
  for all
  to authenticated
  using (
    unidade_id in (
      select unidade_id from user_unidades 
      where user_id = auth.uid()
    )
  )
  with check (
    unidade_id in (
      select unidade_id from user_unidades 
      where user_id = auth.uid()
    )
  );

-- Indexes para performance
create index idx_solicitacoes_unidade on solicitacoes_matricula(unidade_id);
create index idx_solicitacoes_status on solicitacoes_matricula(status);

-- Policy 3: Permitir leitura pública de Unidades (para resolver Slug -> ID)
create policy "Public view unidades" on unidades
  for select
  to anon
  using (true); 
-- Nota: Em produção, poderíamos restringir colunas via View, mas RLS padrão já serve se não tivermos dados sensíveis na tabela 'unidades'.

