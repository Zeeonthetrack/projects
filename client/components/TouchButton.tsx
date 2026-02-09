import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleProp, View, ViewStyle } from 'react-native';

interface TouchButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  touchId?: number;
}

export function TouchButton({
  children,
  onPress,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
  pressedStyle,
  touchId: _touchId,
}: TouchButtonProps) {
  const [pressed, setPressed] = useState(false);
  const activeTouchIdRef = useRef<number | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && activeTouchIdRef.current === null,
        onStartShouldSetPanResponderCapture: () => !disabled && activeTouchIdRef.current === null,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => false,
        onPanResponderGrant: (evt) => {
          if (disabled) {
            return;
          }
          activeTouchIdRef.current = evt.nativeEvent.identifier ?? null;
          setPressed(true);
          onPressIn?.();
        },
        onPanResponderRelease: (evt) => {
          if (evt.nativeEvent.identifier !== activeTouchIdRef.current) {
            return;
          }
          activeTouchIdRef.current = null;
          setPressed(false);
          onPressOut?.();
          onPress?.();
        },
        onPanResponderTerminate: () => {
          activeTouchIdRef.current = null;
          setPressed(false);
          onPressOut?.();
        },
      }),
    [disabled, onPress, onPressIn, onPressOut]
  );

  const combinedStyle = [style, pressed ? pressedStyle : null];

  return (
    <View style={combinedStyle} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
