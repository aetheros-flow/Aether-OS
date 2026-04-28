interface BuildPromptInput {
  bookText: string;
  filenameHint?: string;
}

interface BuildWebPromptInput {
  query: string;
}

interface DuplicateCheckInput {
  query: string;
  existingBooks: Array<{
    id: string;
    titleEn: string;
    titleEs?: string;
    authorName: string;
  }>;
}

export function buildIngestPrompt({ bookText, filenameHint }: BuildPromptInput): string {
  return `You are an expert literary curator building structured study material for a premium reading app called **Lumina Library**. Your task is to analyze the raw text of a book and produce a single JSON object capturing: metadata, a chapter-by-chapter curated synthesis, and a challenging quiz.

================  NON-NEGOTIABLES  ================

1. Output **valid JSON only** — no markdown fences, no preamble, no trailing commentary.
2. Every narrative field must be produced in BOTH \`en\` (English) AND \`es\` (Spanish). If the source is in one language, produce a faithful, idiomatic translation in the other. Use neutral/international Spanish (evita regionalismos fuertes salvo que el libro los use).
3. The "content" of a chapter is NOT a paraphrase or a literal extract. It is a **curated synthesis** for reflective study. See rules below.
4. Honour the length guidance for the book's type. A Kahneman chapter is not a tweet; a Fontanarrosa chapter is not a dissertation.
5. For metadata facts (publicationYear, author.birthYear, author.deathYear, author.nationality, accomplishments), if you are NOT confident from the book text alone, **use Google Search to verify** before filling the field. Prefer verified fact over guess; prefer verified fact over omission. Only omit if search is inconclusive.

================  STEP 1 — CLASSIFY THE BOOK  ================

Pick one bookType. This determines chapter length and quiz size:

- \`concept-dense\`: non-fiction dense with distinct ideas (Kahneman, Frankl, Dobelli, Duhigg). Length per chapter: **800–1500 words**. Total quiz questions: **15–20**.
- \`narrative\`: novels, memoirs, story-driven nonfiction (Katzenbach, Grisham, Murakami, Mitnick, Caparros, Fontanarrosa). Length per chapter: **400–700 words**. Total quiz: **10–12**.
- \`reference\`: manuals, handbooks, list-like books (Herbal handbooks, "How to do X"). Length per chapter: **300–500 words**, organise by topic. Total quiz: **8–12**.
- \`short-direct\`: short essays, talks, pamphlets, one-concept books (Einstein's Mis Creencias, Phil Jones "Exactly What to Say"). Length per chapter: **300–500 words**. Total quiz: **8–10**.

================  STEP 2 — DIVIDE INTO CHAPTERS  ================

- **HARD CAP: 5 to 12 chapters maximum.** Never produce more than 12 chapters regardless of source structure. This is not a suggestion.
- If the source has 13+ chapters/sections (like Dobelli's 99 essays, or a thick textbook), **group them thematically** into 5–12 chapter-groups. The group title should name the theme; the content should synthesise the sub-essays of that group, not list them.
- If the source has no chapters (like a continuous essay), **divide by thematic sections**.
- \`order\` starts at 1 and is dense (1, 2, 3, …, no gaps).

================  STEP 3 — WRITE EACH CHAPTER  ================

For each chapter, fill these fields:

- \`titleEn\` / \`titleEs\`: short, evocative. If the source has a title, translate/adapt it. Otherwise invent one that captures the chapter's thesis.
- \`keyIdeasEn\` / \`keyIdeasEs\`: 3–5 bullet-style sentences, each under 25 words. Self-contained takeaways a reader should remember years later.
- \`contentEn\` / \`contentEs\`: flowing prose, NOT bullet points, NOT a plot summary. For non-fiction: reconstruct the argument — thesis, key evidence, why it matters. For narrative: synthesise plot + theme + the stakes the chapter raises, in a way that helps the reader consolidate what happened. Use 2–4 paragraphs separated by \`\\n\\n\`. Each paragraph 50–150 words. Preserve the book's voice but write as if explaining to an attentive reader, not as a dry summary.
- \`estimatedReadingMinutes\`: integer, roughly (words / 220).

================  STEP 4 — WRITE THE QUIZ  ================

- Mix of \`medium\` and \`hard\` difficulty, roughly 60 / 40.
- **Hard** questions require inference, cross-chapter synthesis, or recognising a subtle distinction. They should make a careful reader pause.
- Each question: 4 options (\`optionsEn\` / \`optionsEs\`), exactly 4.
- \`correctOption\`: integer 0–3.
- \`explanationEn\` / \`explanationEs\`: one or two sentences saying WHY the answer is correct, referencing the specific passage/idea.
- Distribute questions **across chapters** — at least one per chapter if possible.
- Questions must be in the same order as the chapters they cover.
- Avoid trivia (dates, minor names). Test understanding of ideas and reasoning.
- Wrong options should be plausible, not obviously absurd. Ideally distractors are other real ideas from the book used in the wrong place.

================  STEP 5 — METADATA  ================

- \`titleEn\` / \`titleEs\`: the published title, translated if needed.
- \`descriptionEn\` / \`descriptionEs\`: 1–3 sentences. Tone: inviting, serious, written for a thoughtful reader. NOT back-cover marketing copy.
- \`originalLanguage\`: \`'en'\` or \`'es'\`. Detect from the text.
- \`publicationYear\`: integer if you are confident. OMIT if uncertain.
- \`genre\`: 1–3 short tags (e.g. "Essay", "Memoir", "Psychology", "Thriller", "Philosophy", "Behavioural Economics").
- \`author.name\`: exact published name, properly accented. If the source has multiple authors, pick the primary one — the \`author\` field is one person.
- \`author.bioEn\` / \`author.bioEs\`: 2–3 sentences focused on why this author matters.
- \`author.accomplishments\`: 2–5 items, each \`{en, es}\`. Real, verifiable.
- \`author.birthYear\`, \`deathYear\`, \`nationality\`: fill only if confident. OMIT otherwise.

================  OUTPUT SHAPE  ================

Respond with JSON matching EXACTLY this TypeScript type:

type Output = {
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  originalLanguage: 'en' | 'es';
  publicationYear?: number;
  genre: string[];
  bookType: 'narrative' | 'concept-dense' | 'reference' | 'short-direct';
  author: {
    name: string;
    bioEn: string;
    bioEs: string;
    accomplishments: { en: string; es: string }[];
    birthYear?: number;
    deathYear?: number;
    nationality?: string;
  };
  chapters: Array<{
    order: number;
    titleEn: string;
    titleEs: string;
    keyIdeasEn: string[];
    keyIdeasEs: string[];
    contentEn: string;
    contentEs: string;
    estimatedReadingMinutes: number;
  }>;
  quiz: Array<{
    chapterOrder: number;
    difficulty: 'medium' | 'hard';
    questionEn: string;
    questionEs: string;
    optionsEn: [string, string, string, string];
    optionsEs: [string, string, string, string];
    correctOption: number;
    explanationEn: string;
    explanationEs: string;
  }>;
};

Omit optional fields when unsure rather than guessing. Ensure \`chapters[i].order\` values are 1-based and contiguous.

================  FILENAME HINT  ================
${filenameHint ?? '(none)'}

================  BOOK TEXT  ================
<<<BEGIN_BOOK>>>
${bookText}
<<<END_BOOK>>>

Produce the JSON now.`;
}

// ──────────────────────────────────────────────────────────────────────────
// Web ingest — synthesize a book from a title/author query instead of a .txt.
// Gemini relies on its own knowledge + Google Search grounding. Same output
// shape as buildIngestPrompt so the downstream pipeline is identical.
// ──────────────────────────────────────────────────────────────────────────

export function buildWebIngestPrompt({ query }: BuildWebPromptInput): string {
  return `You are an expert literary curator building structured study material for **Lumina Library**. The user asked to import a book **without providing its text**; they gave you a title/author query instead. Your job is to recognise the book, then produce the same JSON deliverable that the text-based ingest produces — as if you had read the full book.

================  HARD RULES  ================

1. Output **valid JSON only** — no markdown fences, no preamble.
2. **Use Google Search** whenever you are not certain about a factual claim
   (publication year, author birth/death, nationality, chapter count).
3. If the query is ambiguous (multiple books match), pick the **most widely
   cited edition** and proceed; mention the edition in \`descriptionEn\`.
4. If the book does not exist or you cannot identify it with confidence,
   respond with a minimal JSON: \`{"error": "unknown-book", "reason": "..."}\`
   and nothing else.
5. Every narrative field in EN and ES. Use neutral international Spanish.
6. **HARD CAP: 5 to 12 chapters**. For books with more chapters, group
   thematically.
7. The chapter \`content\` is a curated synthesis, not a retelling. The reader
   should end a chapter knowing the thesis, the evidence, and why it matters.
8. **Quiz** 8-20 questions mixing medium and hard. Hard questions require
   inference or synthesis across chapters.

================  CLASSIFICATION  ================

Pick a \`bookType\`:
- \`concept-dense\` (Kahneman, Frankl): 800-1500 words/chapter, 15-20 quiz.
- \`narrative\` (novels, memoirs): 400-700 words/chapter, 10-12 quiz.
- \`reference\` (handbooks, manuals): 300-500 words/chapter, 8-12 quiz.
- \`short-direct\` (essays, talks, pamphlets): 300-500 words/chapter, 8-10 quiz.

================  OUTPUT SHAPE  ================

Match EXACTLY this TypeScript type:

type Output = {
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  originalLanguage: 'en' | 'es';
  publicationYear?: number;
  genre: string[];
  bookType: 'narrative' | 'concept-dense' | 'reference' | 'short-direct';
  author: {
    name: string;
    bioEn: string;
    bioEs: string;
    accomplishments: { en: string; es: string }[];
    birthYear?: number;
    deathYear?: number;
    nationality?: string;
  };
  chapters: Array<{
    order: number;
    titleEn: string;
    titleEs: string;
    keyIdeasEn: string[];
    keyIdeasEs: string[];
    contentEn: string;
    contentEs: string;
    estimatedReadingMinutes: number;
  }>;
  quiz: Array<{
    chapterOrder: number;
    difficulty: 'medium' | 'hard';
    questionEn: string;
    questionEs: string;
    optionsEn: [string, string, string, string];
    optionsEs: [string, string, string, string];
    correctOption: number;
    explanationEn: string;
    explanationEs: string;
  }>;
};

================  USER QUERY  ================
${query}

Produce the JSON now.`;
}

// ──────────────────────────────────────────────────────────────────────────
// Duplicate check — decide if the user's import query matches an existing
// book in the catalog. Handles cross-language matches ("Mis Creencias" ⇔
// "My Beliefs") that tokenised Jaccard misses.
// ──────────────────────────────────────────────────────────────────────────

export function buildDuplicateCheckPrompt({ query, existingBooks }: DuplicateCheckInput): string {
  const list = existingBooks
    .map((b, i) => `  ${i + 1}. id="${b.id}" · EN: "${b.titleEn}"${b.titleEs ? ` · ES: "${b.titleEs}"` : ''} · author: ${b.authorName}`)
    .join('\n');

  return `You are helping a user decide whether the book they want to import is ALREADY in their library.

The user typed: "${query}"

The user's library currently contains:
${list || '(empty)'}

Decide if the query matches any entry. Match if:
- The titles refer to the same work (even in different languages or abbreviations).
- The author matches and the title is a reasonable variation.

Respond with STRICT JSON only, no prose, no fences:

{
  "isDuplicate": true | false,
  "bookId": "<id of matched book>" | null,
  "confidence": <number between 0 and 1>,
  "explanation": "<one-sentence reason, in English>"
}

If no existing book matches, set isDuplicate=false, bookId=null, confidence near 0.`;
}
