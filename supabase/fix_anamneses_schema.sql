
-- SCHEMA FIX: ADICIONAR COLUNAS FALTANTES PARA PROFESSOR E ALUNOS
-- Este script garante que todas as colunas necessárias para a Chamada e Cadastro existam.

-- 1. Tabela de Alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS escola TEXT,
ADD COLUMN IF NOT EXISTS serie_ano TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS autoriza_imagem BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS declaracao_assinada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grau_parentesco TEXT;

-- 2. Tabela de Perfis (Dados do Responsável)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS nivel_ensino TEXT;

-- 3. Tabela de Anamneses (Saúde e PNE)
ALTER TABLE public.anamneses
ADD COLUMN IF NOT EXISTS is_pne BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pne_descricao TEXT,
ADD COLUMN IF NOT EXISTS doenca_cronica TEXT;

-- 4. Garantir que as políticas RLS permitam a leitura dessas novas colunas
-- (O script anterior fix_professor_students_visibility.sql já deve ter dado acesso à tabela,
-- mas rodar este garante que o schema esteja pronto para o SELECT)

-- Recarregar o cache do schema do PostgREST (Supabase faz isso automaticamente após DDL, 
-- mas às vezes leva alguns segundos)
SELECT pg_notify('pgrst', 'reload schema');
