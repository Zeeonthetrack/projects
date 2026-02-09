import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

interface VirtualJoystickProps {
  onChange: (value: number) => void;
  neutralValue?: number;
  maxValue?: number;
  minValue?: number;
  debounceThreshold?: number;
  smoothing?: number;
  returnDurationMs?: number;
  size?: number;
  touchId?: number;
  style?: any;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onChange,
  neutralValue = 127,
  maxValue = 255,
  minValue = 0,
  debounceThreshold = 1,
  smoothing = 0.1,
  returnDurationMs = 50,
  size = 160,
  touchId,
  style,
}) => {
  void touchId;
  const baseRadius = size / 2;
  const knobRadius = Math.max(16, size * 0.25);
  const maxOffset = Math.max(1, baseRadius - knobRadius);

  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });

  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentValueRef = useRef(neutralValue);
  const targetValueRef = useRef(neutralValue);
  const lastSentValueRef = useRef(neutralValue);
  const activeTouchIdRef = useRef<number | null>(null);

  const returningRef = useRef(false);
  const returnStartRef = useRef(0);
  const returnFromPosRef = useRef({ x: 0, y: 0 });
  const returnFromValueRef = useRef(neutralValue);
  const rafRef = useRef<number | null>(null);

  const clampToCircle = (dx: number, dy: number) => {
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= maxOffset) {
      return { x: dx, y: dy };
    }
    const scale = maxOffset / distance;
    return { x: dx * scale, y: dy * scale };
  };

  const computeValue = (offsetY: number) => {
    const range = maxValue - minValue;
    const normalized = offsetY / maxOffset;
    const value = neutralValue - normalized * (range / 2);
    return Math.round(Math.max(minValue, Math.min(maxValue, value)));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => activeTouchIdRef.current === null,
        onStartShouldSetPanResponderCapture: () => activeTouchIdRef.current === null,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => false,
        onPanResponderGrant: (evt) => {
          activeTouchIdRef.current = evt.nativeEvent.identifier ?? null;
          returningRef.current = false;
        },
        onPanResponderMove: (evt, gestureState) => {
          if (evt.nativeEvent.identifier !== activeTouchIdRef.current) {
            return;
          }
          const clamped = clampToCircle(gestureState.dx, gestureState.dy);
          targetRef.current = clamped;
          targetValueRef.current = computeValue(clamped.y);
        },
        onPanResponderRelease: (evt) => {
          if (evt.nativeEvent.identifier !== activeTouchIdRef.current) {
            return;
          }
          activeTouchIdRef.current = null;
          returningRef.current = true;
          returnStartRef.current = Date.now();
          returnFromPosRef.current = { ...positionRef.current };
          returnFromValueRef.current = currentValueRef.current;
          targetRef.current = { x: 0, y: 0 };
          targetValueRef.current = neutralValue;
        },
        onPanResponderTerminate: () => {
          activeTouchIdRef.current = null;
          returningRef.current = true;
          returnStartRef.current = Date.now();
          returnFromPosRef.current = { ...positionRef.current };
          returnFromValueRef.current = currentValueRef.current;
          targetRef.current = { x: 0, y: 0 };
          targetValueRef.current = neutralValue;
        },
      }),
    [maxOffset, neutralValue]
  );

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let nextPos = positionRef.current;
      let nextValue = currentValueRef.current;

      if (returningRef.current) {
        const elapsed = now - returnStartRef.current;
        const t = Math.min(1, elapsed / returnDurationMs);
        nextPos = {
          x: returnFromPosRef.current.x * (1 - t),
          y: returnFromPosRef.current.y * (1 - t),
        };
        nextValue = Math.round(
          returnFromValueRef.current + (neutralValue - returnFromValueRef.current) * t
        );
        if (t >= 1) {
          returningRef.current = false;
        }
      } else {
        nextPos = {
          x: positionRef.current.x + (targetRef.current.x - positionRef.current.x) * smoothing,
          y: positionRef.current.y + (targetRef.current.y - positionRef.current.y) * smoothing,
        };
        nextValue = Math.round(
          currentValueRef.current + (targetValueRef.current - currentValueRef.current) * smoothing
        );
      }

      positionRef.current = nextPos;
      currentValueRef.current = nextValue;
      setKnobPosition(nextPos);

      if (Math.abs(nextValue - lastSentValueRef.current) >= debounceThreshold) {
        lastSentValueRef.current = nextValue;
        onChange(nextValue);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [debounceThreshold, neutralValue, onChange, returnDurationMs, smoothing]);

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: baseRadius,
  };
  const knobStyle = {
    width: knobRadius * 2,
    height: knobRadius * 2,
    borderRadius: knobRadius,
    transform: [{ translateX: knobPosition.x }, { translateY: knobPosition.y }],
  };

  return (
    <ThemedView style={[styles.container, style]} {...panResponder.panHandlers}>
      <View style={[styles.base, baseStyle]}>
        <View style={[styles.knob, knobStyle]} />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  base: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a0a0a0',
  },
  knob: {
    backgroundColor: '#4a90e2',
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#2a5cb8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
