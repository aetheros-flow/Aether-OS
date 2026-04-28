-- Migration: Add TMDB fields to Ocio_watchlist
-- Description: Adds tmdb_id, tmdb_type, runtime, and next_episode_date for Moviebase-like functionality.

ALTER TABLE public."Ocio_watchlist" 
ADD COLUMN IF NOT EXISTS tmdb_id numeric,
ADD COLUMN IF NOT EXISTS tmdb_type text,
ADD COLUMN IF NOT EXISTS runtime integer,
ADD COLUMN IF NOT EXISTS next_episode_date timestamp with time zone;
