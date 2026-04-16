/**
 * This module previously contained a fake "AI" categorization function
 * that was a hardcoded keyword if/else chain with an artificial delay.
 *
 * It has been replaced by `autoCategorize` in `dinero-io.ts`, which:
 *  - Has an honest name and JSDoc that states it is rule-based
 *  - Does not add a fake processing delay
 *  - Is co-located with the other import/export utilities
 *
 * This file is kept as a placeholder to avoid breaking any future imports.
 */
export {};