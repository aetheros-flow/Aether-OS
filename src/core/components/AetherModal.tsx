import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface AetherModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Desktop max width (mobile is always full width). Defaults to `max-w-md`. */
  maxWidth?: string;
}

/**
 * Aether premium modal.
 *
 * Mobile: bottom sheet that slides up with spring physics. Drag-to-dismiss on
 *         the grabber / header (vertical drag) — threshold 120px or 500px/s.
 * Desktop: centered panel with spring-scale enter.
 *
 * Surface is the shared warm paper-dark (`neo-modal-panel`). All 14 callers
 * inherit automatically.
 */
export default function AetherModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: AetherModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/55 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={panelRef}
            initial={isMobile ? { y: '100%' } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.9 }}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={handleDragEnd}
            className={`neo-modal-panel ${maxWidth} touch-pan-y max-h-[90vh] overflow-y-auto custom-scrollbar`}
            style={{
              paddingBottom: isMobile
                ? 'calc(env(safe-area-inset-bottom, 0px) + 24px)'
                : undefined,
            }}
          >
            {/* Mobile grabber — visible only on mobile */}
            <div className="md:hidden flex justify-center -mt-2 mb-3 select-none">
              <span className="aether-grabber" />
            </div>

            <div className={`flex items-center ${title ? 'justify-between mb-7' : 'justify-end mb-2'}`}>
              {title && (
                <h2
                  className="font-serif text-2xl md:text-[28px] font-medium tracking-tight"
                  style={{ color: 'var(--aether-text)' }}
                >
                  {title}
                </h2>
              )}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 rounded-full transition-colors"
                style={{
                  background: 'rgba(245,239,230,0.06)',
                  border: '1px solid var(--aether-border)',
                  color: 'var(--aether-text-muted)',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </motion.button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
