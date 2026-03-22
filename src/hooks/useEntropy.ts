import { useEffect, useRef, useState } from 'react';
import type { EntropyEvent } from '../lib/entropy';
import { computeEntropyScore, deriveSeed } from '../lib/entropy';

export default function useEntropy() {
  const eventsRef = useRef<EntropyEvent[]>([]);
  const lastKeyTsRef = useRef(0);
  const lastMouseTsRef = useRef(0);
  const [score, setScore] = useState(0);
  const [lockedSeed, setLockedSeed] = useState<number | null>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as Element | null;
      // Ignore keydown events that originate from form controls or editable regions
      if (target) {
        const tag = target.tagName;
        const isEditable = (target as HTMLElement).isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) return;
      }

      const now = Date.now();
      eventsRef.current.push({ t: 'k', key: e.key, ts: now, dt: now - lastKeyTsRef.current });
      lastKeyTsRef.current = now;
      setScore(computeEntropyScore(eventsRef.current));
    };

    const handleMousemove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseTsRef.current < 50) return;
      lastMouseTsRef.current = now;
      eventsRef.current.push({ t: 'm', x: e.clientX, y: e.clientY, ts: now });
      setScore(computeEntropyScore(eventsRef.current));
    };

    const handleClick = (e: MouseEvent) => {
      eventsRef.current.push({ t: 'c', x: e.clientX, y: e.clientY, ts: Date.now() });
      setScore(computeEntropyScore(eventsRef.current));
    };

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      eventsRef.current.push({ t: 'c', x: t.clientX, y: t.clientY, ts: Date.now() });
      setScore(computeEntropyScore(eventsRef.current));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const now = Date.now();
      if (now - lastMouseTsRef.current < 50) return;
      lastMouseTsRef.current = now;
      eventsRef.current.push({ t: 'm', x: t.clientX, y: t.clientY, ts: now });
      setScore(computeEntropyScore(eventsRef.current));
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
