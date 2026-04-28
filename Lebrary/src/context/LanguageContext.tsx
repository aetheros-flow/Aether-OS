import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { ContentLanguage, LocalizedText } from '@/types';
import { localize } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { storageKeys } from '@/lib/storage';

interface ContentLanguageContextValue {
  language: ContentLanguage;
  setLanguage: (lang: ContentLanguage) => void;
  toggleLanguage: () => void;
  t: (text: LocalizedText) => string;
}

const ContentLanguageContext = createContext<ContentLanguageContextValue | null>(null);

export function ContentLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<ContentLanguage>(
    storageKeys.contentLanguage,
    'en',
  );

  const toggleLanguage = useCallback(
    () => setLanguage((prev) => (prev === 'en' ? 'es' : 'en')),
    [setLanguage],
  );

  const t = useCallback((text: LocalizedText) => localize(text, language), [language]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  );

  return (
    <ContentLanguageContext.Provider value={value}>
      {children}
    </ContentLanguageContext.Provider>
  );
}

export function useContentLanguage() {
  const ctx = useContext(ContentLanguageContext);
  if (!ctx) throw new Error('useContentLanguage must be used within ContentLanguageProvider');
  return ctx;
}
