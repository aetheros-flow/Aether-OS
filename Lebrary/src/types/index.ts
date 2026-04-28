export type ContentLanguage = 'en' | 'es';
export type OriginalLanguage = 'en' | 'es';
export type Theme = 'light' | 'dark';
export type Difficulty = 'medium' | 'hard';
export type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LocalizedText {
  en?: string;
  es?: string;
}

export interface OriginalFile {
  path: string;
  format: 'pdf' | 'epub' | 'mobi' | 'txt';
  sizeBytes?: number;
}

export interface QuizQuestion {
  id: string;
  chapterId?: string;
  question: LocalizedText;
  options: LocalizedText[];
  correctOption: number;
  explanation?: LocalizedText;
  difficulty: Difficulty;
}

export interface Chapter {
  id: string;
  order: number;
  title: LocalizedText;
  content: LocalizedText;
  keyIdeas?: LocalizedText[];
  estimatedReadingMinutes?: number;
}

export interface Book {
  id: string;
  title: LocalizedText;
  authorId: string;
  coverImage: string;
  description: LocalizedText;
  originalLanguage: OriginalLanguage;
  originalFile?: OriginalFile;
  publicationYear?: number;
  genre?: string[];
  chapters: Chapter[];
  quiz: QuizQuestion[];
}

export interface Author {
  id: string;
  name: string;
  image: string;
  bio: LocalizedText;
  accomplishments: LocalizedText[];
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  relatedBookIds: string[];
}

export interface ReadingProgress {
  bookId: string;
  completedChapterIds: string[];
  lastReadChapterId: string | null;
  lastReadAt: string;
  /** Timestamp set when every chapter of the book has been read. */
  finishedAt?: string | null;
}

export interface QuizAttempt {
  id: string;
  bookId: string;
  answers: Record<string, number>;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  chapterId: string;
  text: string;
  language: ContentLanguage;
  prefix: string;
  suffix: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
}

export function localize(text: LocalizedText, lang: ContentLanguage): string {
  const primary = text[lang];
  if (primary && primary.length > 0) return primary;
  const fallback = text[lang === 'en' ? 'es' : 'en'];
  return fallback ?? '';
}
