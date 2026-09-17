import { useRef, useState, useEffect, useCallback } from "react";

const THRESHOLD = 72; // px to pull before triggering refresh

export function usePullToRefresh(onRefresh, containerRef) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef?.current;
    if (!el) return;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [containerRef]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) { setPulling(false); setPullY(0); return; }
    setPulling(true);
    setPullY(Math.min(dy * 0.45, THRESHOLD * 1.2));
    if (dy > THRESHOLD) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startY.current = null;
    if (pullY >= THRESHOLD * 0.7) {
      setRefreshing(true);
      setPullY(THRESHOLD * 0.6);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullY(0);
  }, [pullY, onRefresh]);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pulling, pullY, refreshing };
}
