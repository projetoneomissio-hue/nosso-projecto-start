create type status_certificado as enum ('emitido', 'revogado');

create table if not exists certificados (
  id uuid default gen_random_uuid() primary key,
  aluno_id uuid references alunos(id) not null,
  matricula_id uuid references matriculas(id) not null,
  unidade_id uuid references unidades(id) not null,
  codigo_validacao text not null unique,
  data_emissao date default now(),
  nome_curso text not null, -- Snapshot of course name
  carga_horaria_horas int,
  status status_certificado default 'emitido',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index idx_certificados_aluno on certificados(aluno_id);
create index idx_certificados_matricula on certificados(matricula_id);
create index idx_certificados_codigo on certificados(codigo_validacao);

-- RLS
alter table certificados enable row level security;

create policy "Enable read access for authenticated users in same unit" on certificados
  for select
  to authenticated
  using (
    unidade_id in (
      select unidade_id from user_unidades
      where user_id = auth.uid()
    )
  );

create policy "Enable insert for authenticated users in same unit" on certificados
  for insert
  to authenticated
  with check (
    unidade_id in (
      select unidade_id from user_unidades
      where user_id = auth.uid()
    )
  );
