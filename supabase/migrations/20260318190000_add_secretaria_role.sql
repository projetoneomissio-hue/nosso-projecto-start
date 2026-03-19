-- Migration 1/2: Add 'secretaria' value to app_role enum
-- Must be committed BEFORE using the value in policies (PostgreSQL requirement)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';
