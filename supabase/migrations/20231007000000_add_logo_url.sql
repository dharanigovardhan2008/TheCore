-- Migration: Add logo_url to projects table

ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

