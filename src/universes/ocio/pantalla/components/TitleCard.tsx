import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, CheckCircle2, Star } from 'lucide-react';
import { posterUrl } from '../lib/tmdb';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';
import type { MediaType, TmdbMediaItem } from '../types';

interface TitleCardProps {
  item: TmdbMediaItem;
  mediaType?: MediaType;
  inWatchlist?: boolean;
  watched?: boolean;
  overlayLabel?: string;
  /** When true, renders a fixed mobile-first width (used in carousels). */
  fixedWidth?: boolean;
  className?: string;
}

export default function TitleCard({
  item, mediaType, inWatchlist, watched, overlayLabel, fixedWidth = false, className = '',
}: TitleCardProps) {
  const type = mediaType ?? item.media_type ?? (item.title ? 'movie' : 'tv');
  const title = item.title ?? item.name ?? '';
  const poster = posterUrl(item.poster_path, 'w500');
  const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null;

  const widthClass = fixedWidth ? 'w-[132px] md:w-[148px] shrink-0 snap-start' : 'w-full';

  return (
    <Link to={`/ocio/pantalla/${type}/${item.id}`} className={`block ${widthClass} ${className}`}>
      <motion.div
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="flex flex-col gap-2.5"
      >
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 shadow-lg shadow-black/50">
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 text-center">
              <span className="text-[11px] font-semibold text-zinc-500 line-clamp-4">{title}</span>
            </div>
          )}

          {/* Gradient wash at bottom for readability if overlay */}
          {overlayLabel && (
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          )}

          {/* Rating chip */}
          {rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/10">
              <Star size={10} fill={PANTALLA_ACCENT} stroke={PANTALLA_ACCENT} />
              <span className="text-[10px] font-bold text-white tabular-nums">{rating}</span>
            </div>
          )}

          {/* State badges */}
          {(watched || inWatchlist) && (
            <div className="absolute top-2 left-2">
              {watched ? (
                <div className="p-1 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/10">
                  <CheckCircle2 size={13} style={{ color: PANTALLA_ACCENT }} />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/10">
                  <Bookmark size={13} style={{ color: PANTALLA_ACCENT }} fill={PANTALLA_ACCENT} />
                </div>
              )}
            </div>
          )}

          {/* Overlay episode/date label */}
          {overlayLabel && (
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="text-[11px] font-bold text-white text-center leading-tight line-clamp-2">{overlayLabel}</p>
            </div>
          )}
        </div>

        {!overlayLabel && (
          <p className="text-[13px] font-semibold text-white/90 leading-tight line-clamp-2 px-0.5">
            {title}
          </p>
        )}
      </motion.div>
    </Link>
  );
}
