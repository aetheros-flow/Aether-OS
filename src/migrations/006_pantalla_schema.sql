-- Migration: Añadir campos cinemáticos a Ocio_watchlist
-- Descripción: Agrega `poster_url`, `episodes_watched` y `total_episodes` a la tabla `Ocio_watchlist` para dar soporte a la nueva experiencia Pantalla (estilo Lebrary).

ALTER TABLE public."Ocio_watchlist" 
ADD COLUMN IF NOT EXISTS poster_url text,
ADD COLUMN IF NOT EXISTS episodes_watched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_episodes integer;
