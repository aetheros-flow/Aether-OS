import { useCallback } from 'react';
import type { ReaderFontSize } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { storageKeys } from '@/lib/storage';

interface ReaderSettings {
  fontSize: ReaderFontSize;
}

const DEFAULT_SETTINGS: ReaderSettings = { fontSize: 'md' };

export function useReaderSettings() {
  const [settings, setSettings] = useLocalStorage<ReaderSettings>(
    storageKeys.readerSettings,
    DEFAULT_SETTINGS,
  );

  const setFontSize = useCallback(
    (fontSize: ReaderFontSize) => setSettings((prev) => ({ ...prev, fontSize })),
    [setSettings],
  );

  return { ...settings, setFontSize };
}
