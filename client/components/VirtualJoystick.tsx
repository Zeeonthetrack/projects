import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  const knobRadius = size * 0.28;
  const maxOffset = Math.max(1, baseRadius - knobRadius);

  const lastSentValueRef = useRef(neutralValue);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const smoothingFactor = Math.max(0, Math.min(1, smoothing));

  const emitValue = useCallback(
    (value: number) => {
      if (Math.abs(value - lastSentValueRef.current) >= debounceThreshold) {
        lastSentValueRef.current = value;
        onChange(value);
      }
    },
    [debounceThreshold, onChange]
  );

  const panGesture = useMemo(() => {
    const clampToCircle = (dx: number, dy: number) => {
      'worklet';
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= maxOffset) {
        return { x: dx, y: dy };
      }
      const scale = maxOffset / distance;
      return { x: dx * scale, y: dy * scale };
    };

    const computeValue = (offsetY: number) => {
      'worklet';
      const range = maxValue - minValue;
      const normalized = offsetY / maxOffset;
      const value = neutralValue - normalized * (range / 2);
      return Math.round(Math.max(minValue, Math.min(maxValue, value)));
    };

    return Gesture.Pan()
      .minDistance(0)
      .onBegin(() => {
        cancelAnimation(x);
        cancelAnimation(y);
      })
      .onUpdate((event) => {
        const clamped = clampToCircle(event.translationX, event.translationY);
        const nextX = x.value + (clamped.x - x.value) * smoothingFactor;
        const nextY = y.value + (clamped.y - y.value) * smoothingFactor;
        x.value = nextX;
        y.value = nextY;
        const value = computeValue(nextY);
        runOnJS(emitValue)(value);
      })
      .onFinalize(() => {
        x.value = withTiming(0, { duration: returnDurationMs });
        y.value = withTiming(0, { duration: returnDurationMs });
        runOnJS(emitValue)(neutralValue);
      });
  }, [
    debounceThreshold,
    emitValue,
    maxOffset,
    maxValue,
    minValue,
    neutralValue,
    returnDurationMs,
    smoothingFactor,
    x,
    y,
  ]);

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  const baseBorderWidth = size * 0.012;
  const knobBorderWidth = size * 0.018;
  const shadowOffsetY = size * 0.02;
  const shadowRadius = size * 0.05;
  const elevation = Math.max(1, Math.round(size * 0.04));

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: baseRadius,
    borderWidth: baseBorderWidth,
    borderColor: '#a0a0a0',
  };
  const knobStyle = {
    width: knobRadius * 2,
    height: knobRadius * 2,
    borderRadius: knobRadius,
    borderWidth: knobBorderWidth,
    borderColor: '#2a5cb8',
    shadowOffset: { width: 0, height: shadowOffsetY },
    shadowOpacity: 0.3,
    shadowRadius,
    elevation,
  };

  return (
    <GestureDetector gesture={panGesture}>
      <ThemedView style={[styles.container, style]}>
        <View style={[styles.base, baseStyle]}>
          <Animated.View style={[styles.knob, knobStyle, knobAnimatedStyle]} />
        </View>
      </ThemedView>
    </GestureDetector>
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
  },
  knob: {
    backgroundColor: '#4a90e2',
    position: 'absolute',
    shadowColor: '#000',
  },
});
