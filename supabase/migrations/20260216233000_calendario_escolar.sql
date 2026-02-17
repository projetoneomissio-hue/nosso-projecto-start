-- Tabela de Calendário Escolar
create table if not exists calendario_escolar (
  id uuid default gen_random_uuid() primary key,
  unidade_id uuid references unidades(id) not null,
  titulo text not null,
  descricao text,
  data_inicio date not null,
  data_fim date not null,
  tipo text check (tipo in ('feriado', 'recesso', 'evento', 'prova', 'reuniao')),
  eh_dia_letivo boolean default false,
  created_at timestamp with time zone default now()
);

-- Index para performance de busca por data e unidade
create index idx_calendario_unidade_data on calendario_escolar(unidade_id, data_inicio);

-- RLS
alter table calendario_escolar enable row level security;

create policy "Ver calendario da sua unidade" on calendario_escolar
  for select
  using (
    unidade_id in (
      select unidade_id from user_unidades where user_id = auth.uid()
    )
  );

create policy "Gerenciar calendario da sua unidade (Admin/Coord)" on calendario_escolar
  for all
  using (
    unidade_id in (
      select unidade_id from user_unidades 
      where user_id = auth.uid() 
      and role in ('direcao', 'coordenacao')
    )
  );
