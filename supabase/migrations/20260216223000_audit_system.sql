-- Tabela de Auditoria
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  action text not null, -- INSERT, UPDATE, DELETE
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Ativar RLS (apenas admins podem ver logs)
alter table audit_logs enable row level security;

create policy "Admins podem ver logs de auditoria"
  on audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Função Trigger Genérica
create or replace function log_audit_event()
returns trigger as $$
declare
  old_row jsonb := null;
  new_row jsonb := null;
begin
  if (TG_OP = 'UPDATE') or (TG_OP = 'DELETE') then
    old_row = to_jsonb(OLD);
  end if;

  if (TG_OP = 'INSERT') or (TG_OP = 'UPDATE') then
    new_row = to_jsonb(NEW);
  end if;

  insert into audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce(NEW.id::text, OLD.id::text),
    old_row,
    new_row
  );

  return null; -- Triggers do tipo AFTER ignoram o retorno
end;
$$ language plpgsql security definer;

-- Aplicar Triggers nas tabelas críticas

-- Pagamentos
drop trigger if exists audit_pagamentos on pagamentos;
create trigger audit_pagamentos
after insert or update or delete on pagamentos
for each row execute function log_audit_event();

-- Alunos
drop trigger if exists audit_alunos on alunos;
create trigger audit_alunos
after insert or update or delete on alunos
for each row execute function log_audit_event();

-- Matrículas
drop trigger if exists audit_matriculas on matriculas;
create trigger audit_matriculas
after insert or update or delete on matriculas
for each row execute function log_audit_event();

-- Custos Prédio
drop trigger if exists audit_custos on custos_predio;
create trigger audit_custos
after insert or update or delete on custos_predio
for each row execute function log_audit_event();
