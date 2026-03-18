import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SWIPE_THRESHOLD = 70;
const SWIPE_MAX_VERTICAL = 80;

export type SwipeDirection = "left" | "right" | null;

/**
 * Enables horizontal swipe navigation between a list of top-level pages.
 * Only activates when the current path matches one of the pages exactly.
 *
 * Returns the latest swipe direction (for CSS animation), auto-cleared after 300ms.
 */
export const useSwipeNavigation = (pages: string[]): SwipeDirection => {
  const navigate = useNavigate();
  const location = useLocation();
  const startRef = useRef({ x: 0, y: 0 });
  const [direction, setDirection] = useState<SwipeDirection>(null);

  const getCurrentIndex = useCallback(() => {
    return pages.findIndex((p) => location.pathname === p);
  }, [location.pathname, pages]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      startRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startRef.current.x;
      const dy = e.changedTouches[0].clientY - startRef.current.y;

      // Must be a clear horizontal swipe
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_MAX_VERTICAL) return;

      const idx = getCurrentIndex();
      if (idx === -1) return; // not on a swipeable page

      if (dx > 0 && idx > 0) {
        setDirection("right");
        navigate(pages[idx - 1]);
      } else if (dx < 0 && idx < pages.length - 1) {
        setDirection("left");
        navigate(pages[idx + 1]);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [getCurrentIndex, navigate, pages]);

  // Auto-clear direction for animation reset
  useEffect(() => {
    if (!direction) return;
    const timer = setTimeout(() => setDirection(null), 350);
    return () => clearTimeout(timer);
  }, [direction]);

  return direction;
};
