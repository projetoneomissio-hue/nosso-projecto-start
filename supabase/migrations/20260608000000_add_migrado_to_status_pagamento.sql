-- Fase C: adiciona status 'migrado' ao enum status_pagamento
-- Usado para pagamentos importados de planilhas históricas.
-- Permite distinguir visualmente dados migrados de dados registrados no sistema.
ALTER TYPE public.status_pagamento ADD VALUE IF NOT EXISTS 'migrado';
