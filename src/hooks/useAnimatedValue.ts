import { useState, useEffect, useRef } from 'react';

/**
 * Smoothly interpolates a numeric value for high-tech telemetry readouts.
 * @param targetValue The target number to animate towards.
 * @param duration Duration of animation in ms (default: 400ms).
 * @param decimals Number of decimal places to format output (default: 1).
 */
export function useAnimatedValue(targetValue: number, duration: number = 400, decimals: number = 1): string {
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const startValueRef = useRef<number>(targetValue);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      
      // Easing: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValueRef.current + (targetValue - startValueRef.current) * ease;
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return isNaN(displayValue) ? '0' : displayValue.toFixed(decimals);
}
