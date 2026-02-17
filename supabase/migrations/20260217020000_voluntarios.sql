-- Add is_volunteer to professores
alter table professores add column if not exists is_volunteer boolean default false;

-- Add comment
comment on column professores.is_volunteer is 'Indica se o professor atua como voluntário';
