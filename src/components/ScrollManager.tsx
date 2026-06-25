"use client";

import { useEffect, useRef } from "react";

interface ScrollManagerProps {
  sectionIds: string[];
  onSectionChange: (index: number) => void;
  sectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
}

export default function ScrollManager({
  sectionIds,
  onSectionChange,
}: ScrollManagerProps) {
  const lastSectionRef = useRef(0);
  const callbackRef = useRef(onSectionChange);

  // Keep callback ref in sync without triggering observer re-creation
  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let bestEntry: IntersectionObserverEntry | null = null;
        let bestRatio = 0;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestEntry = entry;
          }
        }

        if (bestEntry) {
          const idx = sectionIds.indexOf(bestEntry.target.id);
          if (idx !== -1 && idx !== lastSectionRef.current) {
            lastSectionRef.current = idx;
            callbackRef.current(idx);
          }
        }

        // Fallback: if NO section is intersecting (e.g. user scrolled past end),
        // pick the last visible section or the one closest to the viewport top
        if (!bestEntry) {
          let closestIdx = -1;
          let closestDist = Infinity;
          sectionIds.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) {
              const rect = el.getBoundingClientRect();
              // Section whose top is closest to the top of viewport
              const dist = Math.abs(rect.top);
              if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
              }
            }
          });
          if (closestIdx !== -1 && closestIdx !== lastSectionRef.current) {
            lastSectionRef.current = closestIdx;
            callbackRef.current(closestIdx);
          }
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
        rootMargin: "0px 0px -5% 0px",
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // Only re-create when sectionIds change (not onSectionChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds]);

  return null;
}
