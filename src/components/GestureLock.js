"use client";

import { useEffect } from "react";

/**
 * GestureLock Component
 * 
 * This component prevents unwanted pinch-to-zoom and gesture-based movements
 * on trackpads and touchscreens without breaking normal scrolling.
 */
export default function GestureLock() {
  useEffect(() => {
    // 1. Prevent Pinch Zoom on Trackpads (Ctrl + Wheel)
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // 2. Prevent Pinch Zoom on Touchscreens (Touchmove with 2+ fingers)
    const handleTouchMove = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 3. Prevent Safari-specific Gesture Events
    const handleGestureStart = (e) => {
      e.preventDefault();
    };

    // Add listeners with passive: false to allow e.preventDefault()
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("gesturestart", handleGestureStart, { passive: false });
    window.addEventListener("gesturechange", handleGestureStart, { passive: false });
    window.addEventListener("gestureend", handleGestureStart, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("gesturestart", handleGestureStart);
      window.removeEventListener("gesturechange", handleGestureStart);
      window.removeEventListener("gestureend", handleGestureStart);
    };
  }, []);

  return null; // This component doesn't render anything
}
