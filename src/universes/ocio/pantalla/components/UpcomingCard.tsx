import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { posterUrl } from '../lib/tmdb';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';
import type { MediaType } from '../types';

interface UpcomingCardProps {
  tmdbId: number;
  mediaType: MediaType;
  posterPath: string | null;
  title: string;
  airDate: string;
  episodeLabel?: string;
}

function daysFrom(iso: string): { label: string; soon: boolean } {
  const now = new Date();
  const then = new Date(iso);
  const diff = Math.round((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { label: 'Today', soon: true };
  if (diff === 1) return { label: 'Tomorrow', soon: true };
  if (diff < 7) return { label: `${diff}d`, soon: true };
  return { label: `${diff}d`, soon: false };
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function UpcomingCard({ tmdbId, mediaType, posterPath, title, airDate, episodeLabel }: UpcomingCardProps) {
  const poster = posterUrl(posterPath, 'w342');
  const { label: dayLabel, soon } = daysFrom(airDate);

  return (
    <Link to={`/ocio/pantalla/${mediaType}/${tmdbId}`} className="block w-[148px] md:w-[168px] shrink-0 snap-start">
      <motion.div whileTap={{ scale: 0.96 }} className="flex flex-col gap-2.5">
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 shadow-lg shadow-black/50">
          {poster && (
            <img src={poster} alt={title} loading="lazy" className="w-full h-full object-cover" draggable={false} />
          )}

          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />

          {/* Top-left countdown chip */}
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums backdrop-blur-md ring-1"
            style={{
              background: soon ? `${PANTALLA_ACCENT}25` : 'rgba(0,0,0,0.6)',
              color: soon ? PANTALLA_ACCENT : '#ffffff',
              boxShadow: soon ? `0 0 10px ${PANTALLA_ACCENT}40` : 'none',
              borderColor: soon ? `${PANTALLA_ACCENT}50` : 'rgba(255,255,255,0.12)',
            }}
          >
            {dayLabel}
          </div>

          {/* Bottom content */}
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">{shortDate(airDate)}</p>
            {episodeLabel && (
              <p className="text-[12px] font-bold mt-0.5 tabular-nums" style={{ color: PANTALLA_ACCENT }}>
                {episodeLabel}
              </p>
            )}
          </div>
        </div>

        <p className="text-[12px] font-semibold text-white/90 leading-tight line-clamp-1 px-0.5">{title}</p>
      </motion.div>
    </Link>
  );
}
