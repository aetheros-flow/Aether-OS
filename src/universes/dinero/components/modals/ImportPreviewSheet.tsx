import { useMemo, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import {
  X, AlertTriangle, Sparkles, Brain, FileText, Database, Loader2, Check,
  AlertCircle, TrendingUp, TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PreparedRow, RowSource } from '../../lib/import-pipeline';
import { CANONICAL_CATEGORIES } from '../../lib/category-icons';
import type { Category } from '../../types';

const ACCENT = '#7EC28A';

interface ImportPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  initialRows: PreparedRow[];
  counts: {
    total: number;
    fromFile: number;
    fromMemory: number;
    fromAI: number;
    fromFallback: number;
    duplicates: number;
  };
  aiWarning: string | null;
  categories: Category[];
  onCommit: (rows: PreparedRow[], rememberOverrides: boolean) => Promise<void>;
}

const SOURCE_META: Record<RowSource, { label: string; color: string; icon: typeof Brain }> = {
  file:     { label: 'From file',   color: '#60A5FA', icon: FileText },
  memory:   { label: 'Memory',      color: '#34D399', icon: Database },
  ai:       { label: 'AI',          color: '#A78BFA', icon: Brain },
  fallback: { label: 'Rule',        color: '#FBBF24', icon: Sparkles },
};

export default function ImportPreviewSheet({
  open, onClose, initialRows, counts, aiWarning, categories, onCommit,
}: ImportPreviewSheetProps) {
  const [rows, setRows] = useState<PreparedRow[]>(initialRows);
  const [rememberOverrides, setRememberOverrides] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const allowedCategories = useMemo(
    () => Array.from(new Set([...CANONICAL_CATEGORIES, ...categories.map(c => c.name)])).sort(),
    [categories],
  );

  // Keep rows in sync when opening with new analysis
  useMemo(() => { setRows(initialRows); }, [initialRows]);

  const selectedCount = rows.filter(r => r.selected).length;
  const overrideCount = rows.filter(r => r.selected && r.category !== r.originalCategory).length;

  const updateRow = (key: string, patch: Partial<PreparedRow>) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));
  };

  const toggleSelected = (key: string) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, selected: !r.selected } : r));
  };

  const selectAll = () => setRows(prev => prev.map(r => ({ ...r, selected: true })));
  const skipDuplicates = () => setRows(prev => prev.map(r => r.isDuplicate ? { ...r, selected: false } : r));

  const handleConfirm = async () => {
    if (selectedCount === 0) { toast.warning('Nothing to import — select at least one row.'); return; }
    setSubmitting(true);
    try {
      await onCommit(rows, rememberOverrides);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            drag="y"
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[94vh] rounded-t-[28px] bg-[#241E1A] border-t border-[rgba(232,221,204,0.08)] flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+8px)] touch-pan-y"
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 flex items-start justify-between shrink-0 border-b border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: ACCENT }}>
                  Review before import
                </p>
                <h3 className="font-serif text-2xl text-white tracking-tight mt-1">AI categorization</h3>
                <p className="text-[12px] text-zinc-400 mt-1.5 leading-snug">
                  {counts.total} transactions parsed — edit any category below. The model learns from your corrections.
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-zinc-400 active:scale-90 transition-transform" aria-label="Close">
                <X size={14} />
              </button>
            </div>

            {/* Stats */}
            <div className="px-5 pt-4 pb-3 shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth">
              <SourceChip count={counts.fromMemory} meta={SOURCE_META.memory} />
              <SourceChip count={counts.fromAI}     meta={SOURCE_META.ai} />
              <SourceChip count={counts.fromFile}   meta={SOURCE_META.file} />
              <SourceChip count={counts.fromFallback} meta={SOURCE_META.fallback} />
              {counts.duplicates > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 h-8 rounded-full shrink-0"
                  style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.3)' }}
                >
                  <AlertTriangle size={12} className="text-rose-400" />
                  <span className="text-[11px] font-bold text-rose-300 tabular-nums">{counts.duplicates} dup</span>
                </div>
              )}
            </div>

            {/* Warnings */}
            {aiWarning && (
              <div className="px-5 pb-2">
                <div
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }}
                >
                  <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-200 leading-snug">{aiWarning}</p>
                </div>
              </div>
            )}

            {/* Bulk actions */}
            <div className="px-5 pb-3 flex items-center gap-2 text-[11px] shrink-0">
              <button
                onClick={selectAll}
                className="px-3 h-8 rounded-full font-semibold text-zinc-300 active:scale-95 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Select all
              </button>
              {counts.duplicates > 0 && (
                <button
                  onClick={skipDuplicates}
                  className="px-3 h-8 rounded-full font-semibold text-rose-300 active:scale-95 transition-all"
                  style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}
                >
                  Skip duplicates
                </button>
              )}
              <span className="ml-auto text-zinc-500 font-semibold tabular-nums">
                {selectedCount}/{counts.total} selected
              </span>
            </div>

            {/* Rows list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4">
              <div className="flex flex-col gap-2">
                {rows.map(row => (
                  <RowItem
                    key={row.key}
                    row={row}
                    allowedCategories={allowedCategories}
                    onToggle={() => toggleSelected(row.key)}
                    onChangeCategory={(c) => updateRow(row.key, { category: c })}
                    onChangeType={(t) => updateRow(row.key, { type: t })}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 pt-3 pb-1 border-t border-white/5 flex flex-col gap-3">
              <label className="flex items-center gap-2.5 text-[12px] text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberOverrides}
                  onChange={(e) => setRememberOverrides(e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                <span>
                  Remember my edits
                  {overrideCount > 0 && (
                    <span className="ml-1 font-bold text-white tabular-nums">({overrideCount})</span>
                  )}
                  <span className="ml-1 text-zinc-600">— teach AI for future imports</span>
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="h-11 px-5 rounded-full text-[13px] font-semibold text-white active:scale-95 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting || selectedCount === 0}
                  className="flex-1 h-11 rounded-full font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                  style={{ background: ACCENT, color: '#000', boxShadow: `0 4px 14px ${ACCENT}50` }}
                >
                  {submitting
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Check size={14} strokeWidth={2.5} />}
                  {submitting ? 'Importing…' : `Import ${selectedCount}`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Atoms ────────────────────────────────────────────────────────────────────

function SourceChip({ count, meta }: { count: number; meta: typeof SOURCE_META[RowSource] }) {
  if (count === 0) return null;
  const Icon = meta.icon;
  return (
    <div
      className="flex items-center gap-1.5 px-3 h-8 rounded-full shrink-0"
      style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}40` }}
    >
      <Icon size={12} style={{ color: meta.color }} />
      <span className="text-[11px] font-bold tabular-nums" style={{ color: meta.color }}>
        {count}
      </span>
      <span className="text-[11px] font-semibold text-zinc-400 -ml-0.5">{meta.label}</span>
    </div>
  );
}

function RowItem({ row, allowedCategories, onToggle, onChangeCategory, onChangeType }: {
  row: PreparedRow;
  allowedCategories: string[];
  onToggle: () => void;
  onChangeCategory: (c: string) => void;
  onChangeType: (t: 'income' | 'expense') => void;
}) {
  const sourceMeta = SOURCE_META[row.source];
  const SourceIcon = sourceMeta.icon;
  const isEdited = row.category !== row.originalCategory;

  return (
    <div
      className="rounded-2xl p-3.5 transition-all"
      style={{
        background: row.selected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${row.isDuplicate ? 'rgba(244,63,94,0.35)' : 'rgba(255,255,255,0.06)'}`,
        opacity: row.selected ? 1 : 0.5,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="mt-0.5 w-5 h-5 rounded-md shrink-0 flex items-center justify-center active:scale-90 transition-all"
          style={{
            background: row.selected ? ACCENT : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${row.selected ? ACCENT : 'rgba(255,255,255,0.15)'}`,
          }}
          aria-label={row.selected ? 'Exclude from import' : 'Include in import'}
        >
          {row.selected && <Check size={12} color="#000" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Line 1: date + description + amount */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight line-clamp-2">
                {row.description || '(no description)'}
              </p>
              <p className="text-[10px] text-zinc-500 tabular-nums mt-0.5">
                {row.date.slice(0, 10)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {row.type === 'income'
                ? <TrendingUp size={12} className="text-emerald-400" />
                : <TrendingDown size={12} className="text-rose-400" />}
              <span
                className="text-[13px] font-black tabular-nums"
                style={{ color: row.type === 'income' ? '#34D399' : '#F87171' }}
              >
                {row.type === 'income' ? '+' : '-'}{row.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Line 2: source badge + category dropdown + type toggle */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <div
              className="flex items-center gap-1 px-2 h-6 rounded-full"
              style={{ background: `${sourceMeta.color}12`, border: `1px solid ${sourceMeta.color}35` }}
            >
              <SourceIcon size={10} style={{ color: sourceMeta.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sourceMeta.color }}>
                {sourceMeta.label}
                {row.confidence != null && ` · ${Math.round(row.confidence * 100)}%`}
              </span>
            </div>

            {row.isDuplicate && (
              <div
                className="flex items-center gap-1 px-2 h-6 rounded-full"
                style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)' }}
              >
                <AlertTriangle size={10} className="text-rose-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-300">Duplicate</span>
              </div>
            )}

            {isEdited && (
              <div
                className="flex items-center gap-1 px-2 h-6 rounded-full"
                style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}40` }}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                  Edited
                </span>
              </div>
            )}
          </div>

          {/* Line 3: editable controls */}
          <div className="flex items-center gap-2 mt-2.5">
            <select
              value={row.category}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="flex-1 min-w-0 h-9 px-3 rounded-xl text-[12px] font-semibold text-white outline-none focus:ring-1 focus:ring-white/15 appearance-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {!allowedCategories.includes(row.category) && row.category && (
                <option value={row.category} className="bg-zinc-900">{row.category}</option>
              )}
              {allowedCategories.map(c => (
                <option key={c} value={c} className="bg-zinc-900">{c}</option>
              ))}
            </select>

            <button
              onClick={() => onChangeType(row.type === 'income' ? 'expense' : 'income')}
              className="h-9 px-3 rounded-xl text-[11px] font-bold active:scale-95 transition-all shrink-0"
              style={{
                background: row.type === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${row.type === 'income' ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
                color: row.type === 'income' ? '#34D399' : '#F87171',
              }}
              aria-label="Toggle type"
            >
              {row.type === 'income' ? 'IN' : 'OUT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
