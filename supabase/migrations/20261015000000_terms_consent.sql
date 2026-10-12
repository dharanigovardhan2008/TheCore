-- Migration: Add terms_version and terms_accepted_at to profiles table

ALTER TABLE public.profiles
ADD COLUMN terms_version TEXT,
ADD COLUMN terms_accepted_at TIMESTAMPTZ;
