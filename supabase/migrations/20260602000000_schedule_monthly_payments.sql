-- Schedule: Auto-generate monthly payment records on the 1st of each month
-- Uses pg_cron to call gerar_pagamentos_mensais() directly (no HTTP, no secrets needed)

-- Remove existing job if it exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gerar-pagamentos-mensais-todo-mes') THEN
    PERFORM cron.unschedule('gerar-pagamentos-mensais-todo-mes');
  END IF;
END $$;

-- Schedule: runs at 00:05 UTC on the 1st of every month
-- 5-minute offset avoids contention with midnight maintenance windows
SELECT cron.schedule(
  'gerar-pagamentos-mensais-todo-mes',
  '5 0 1 * *',
  $$SELECT public.gerar_pagamentos_mensais()$$
);
