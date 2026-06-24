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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topEntry = visible.reduce((prev, curr) =>
            curr.boundingClientRect.top < prev.boundingClientRect.top
              ? curr
              : prev
          );
          const idx = sectionIds.indexOf(topEntry.target.id);
          if (idx !== -1 && idx !== lastSectionRef.current) {
            lastSectionRef.current = idx;
            onSectionChange(idx);
          }
        }
      },
      { threshold: 0.3, rootMargin: "-10% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, onSectionChange]);

  return null;
}
