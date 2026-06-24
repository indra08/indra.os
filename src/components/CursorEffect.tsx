"use client";

import { useEffect, useRef } from "react";

export default function CursorEffect() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    let cursorX = 0;
    let cursorY = 0;
    let dotX = 0;
    let dotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };

    const animate = () => {
      dotX += (cursorX - dotX) * 0.5;
      dotY += (cursorY - dotY) * 0.5;

      cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px)`;
      dot.style.transform = `translate(${dotX - 2}px, ${dotY - 2}px)`;

      requestAnimationFrame(animate);
    };

    const onMouseEnterInteractive = () => cursor.classList.add("hovering");
    const onMouseLeaveInteractive = () => cursor.classList.remove("hovering");

    document.addEventListener("mousemove", onMouseMove);
    animate();

    const interactives = document.querySelectorAll(
      'a, button, [data-interactive], input, textarea'
    );
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onMouseEnterInteractive);
      el.addEventListener("mouseleave", onMouseLeaveInteractive);
    });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnterInteractive);
        el.removeEventListener("mouseleave", onMouseLeaveInteractive);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
}
