"use client";

import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation(options = {}) {
  const { threshold = 0.1, root = null, rootMargin = '0px', triggerOnce = true } = options;
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion natively
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      requestAnimationFrame(() => setIsInView(true));
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          // If we want it to hide again when scrolling out
          setIsInView(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [ref, isInView];
}
