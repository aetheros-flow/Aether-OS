import type { Author, Book, Highlight } from '@/types';
import { localize, type ContentLanguage } from '@/types';

interface BuildMarkdownInput {
  books: Book[];
  authorsById: Map<string, Author>;
  highlights: Highlight[];
  language: ContentLanguage;
}

/**
 * Build a Markdown document with all highlights grouped by book → chapter.
 * The format is Obsidian/Notion-friendly (plain markdown, block quotes).
 */
export function buildHighlightsMarkdown(input: BuildMarkdownInput): string {
  const { books, authorsById, highlights, language } = input;
  if (highlights.length === 0) return '# Lumina — highlights\n\n_No highlights saved yet._\n';

  const byBook = groupBy(highlights, (h) => h.bookId);
  const booksById = new Map(books.map((b) => [b.id, b]));

  const lines: string[] = [];
  lines.push('# Lumina Library — highlights');
  lines.push('');
  lines.push(`_Exported ${new Date().toLocaleDateString()} · ${highlights.length} passages from ${byBook.size} books_`);
  lines.push('');

  // Sort books alphabetically by display title.
  const sortedBookIds = [...byBook.keys()].sort((a, b) => {
    const ta = booksById.get(a);
    const tb = booksById.get(b);
    if (!ta || !tb) return 0;
    return localize(ta.title, language).localeCompare(localize(tb.title, language));
  });

  for (const bookId of sortedBookIds) {
    const book = booksById.get(bookId);
    const bookHighlights = byBook.get(bookId) ?? [];
    const title = book ? localize(book.title, language) : bookId;
    const author = book ? authorsById.get(book.authorId) : undefined;

    lines.push(`## ${title}`);
    if (author) lines.push(`*${author.name}*`);
    lines.push('');

    // Group by chapter, preserving chapter order if we have the book.
    const chapterOrder = new Map<string, number>();
    if (book) {
      for (const c of book.chapters) chapterOrder.set(c.id, c.order);
    }
    const byChapter = groupBy(bookHighlights, (h) => h.chapterId);
    const sortedChapterIds = [...byChapter.keys()].sort(
      (a, b) => (chapterOrder.get(a) ?? 9999) - (chapterOrder.get(b) ?? 9999),
    );

    for (const chId of sortedChapterIds) {
      const chapter = book?.chapters.find((c) => c.id === chId);
      const chTitle = chapter ? localize(chapter.title, language) : chId;
      const order = chapter?.order ?? null;
      lines.push(`### ${order != null ? `${String(order).padStart(2, '0')}. ` : ''}${chTitle}`);
      lines.push('');

      const items = byChapter.get(chId) ?? [];
      const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      for (const h of sorted) {
        lines.push(`> ${h.text.replace(/\n/g, '\n> ')}`);
        if (h.note.trim()) {
          lines.push('');
          lines.push(`**Note:** ${h.note.replace(/\n/g, ' ')}`);
        }
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = keyFn(item);
    const arr = map.get(k) ?? [];
    arr.push(item);
    map.set(k, arr);
  }
  return map;
}

export function downloadTextFile(filename: string, content: string, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
