-- Add health and observation fields to alunos table
ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS alergias text,
ADD COLUMN IF NOT EXISTS medicamentos text,
ADD COLUMN IF NOT EXISTS observacoes text;
