import { useEffect, useRef, useState } from 'react';
import type { EntropyEvent } from '../lib/entropy';
import { computeEntropyScore, deriveSeed } from '../lib/entropy';

export default function useEntropy() {
  const eventsRef = useRef<EntropyEvent[]>([]);
  const lastKeyTsRef = useRef(0);
  const lastMouseTsRef = useRef(0);
  const [score, setScore] = useState(0);
  const [lockedSeed, setLockedSeed] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const scheduleUpdate = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        try {
          setScore(computeEntropyScore(eventsRef.current));
        } finally {
          rafRef.current = null;
        }
      });
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const now = Date.now();
      eventsRef.current.push({ t: 'k', key: e.key, ts: now, dt: now - lastKeyTsRef.current });
      lastKeyTsRef.current = now;
      scheduleUpdate();
    };

    const handleMousemove = (e: MouseEvent) => {
      // Avoid recording mouse movement while the user is actively typing
      const active = document && document.activeElement as Element | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute?.('contenteditable') === 'true')) return;
      const now = Date.now();
      if (now - lastMouseTsRef.current < 50) return;
      lastMouseTsRef.current = now;
      eventsRef.current.push({ t: 'm', x: e.clientX, y: e.clientY, ts: now });
      scheduleUpdate();
    };

    const handleClick = (e: MouseEvent) => {
      // Ignore clicks that originate from focused form controls to avoid focus churn
      const active = document && document.activeElement as Element | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute?.('contenteditable') === 'true')) return;
      eventsRef.current.push({ t: 'c', x: e.clientX, y: e.clientY, ts: Date.now() });
      scheduleUpdate();
    };

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const active = document && document.activeElement as Element | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute?.('contenteditable') === 'true')) return;
      eventsRef.current.push({ t: 'c', x: t.clientX, y: t.clientY, ts: Date.now() });
      scheduleUpdate();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const active = document && document.activeElement as Element | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute?.('contenteditable') === 'true')) return;
      const now = Date.now();
      if (now - lastMouseTsRef.current < 50) return;
      lastMouseTsRef.current = now;
      eventsRef.current.push({ t: 'm', x: t.clientX, y: t.clientY, ts: now });
      scheduleUpdate();
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousemove', handleMousemove);
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousemove', handleMousemove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function finalize(): number {
    eventsRef.current.push({ t: 'c', x: 0, y: 0, ts: Date.now(), last: true });
    const seed = deriveSeed(eventsRef.current);
    setLockedSeed(seed);
    return seed;
  }

  function reset() {
    eventsRef.current = [];
    setScore(0);
    setLockedSeed(null);
    lastKeyTsRef.current = 0;
    lastMouseTsRef.current = 0;
  }

  return { score, finalize, reset, lockedSeed };
}
