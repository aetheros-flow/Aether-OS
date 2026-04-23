import type { ReactNode } from 'react';

/**
 * Horizontal snap-scroll rail. The inner padding matches the shell's page
 * gutter (16px mobile, 32px desktop) so the first card aligns with section
 * titles, and the bleed lets items scroll edge-to-edge.
 */
export default function HorizontalScroller({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 md:-mx-8">
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 px-4 md:px-8 snap-x snap-mandatory hide-scrollbar scroll-smooth">
        {children}
      </div>
    </div>
  );
}
