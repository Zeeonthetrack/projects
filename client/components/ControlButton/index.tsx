import React, { useMemo, useRef } from 'react';
import { View, Text, PanResponder, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';

/**
 * 控制按键组件
 * 功能：模拟物理按键，按下时触发功能，松开时复位
 * 
 * 参数说明：
 * - label: 按键名称
 * - colorType: 按键颜色类型（"red" | "blue" | "green" | "yellow"）
 * - isPressed: 按键状态（是否被按下）
 * - onPressIn: 按下时的回调函数
 * - onPressOut: 松开时的回调函数
 */
interface ControlButtonProps {
  label: string;           // 按键名称
  colorType: 'red' | 'blue' | 'green' | 'yellow';  // 颜色类型
  isPressed: boolean;      // 是否被按下
  onPressIn: () => void;   // 按下回调
  onPressOut: () => void;  // 松开回调
  size?: number;           // 按键尺寸
  style?: ViewStyle;       // 自定义样式
  touchId?: number;        // 触摸ID
}

// 颜色映射表（按键颜色配置）
const BUTTON_COLORS = {
  red: { bg: '#EF4444', text: '#FFFFFF' },    // 红色：激光
  blue: { bg: '#3B82F6', text: '#FFFFFF' },   // 蓝色：夹子闭合
  green: { bg: '#10B981', text: '#FFFFFF' },  // 绿色：夹子张开
  yellow: { bg: '#F59E0B', text: '#FFFFFF' }, // 黄色：紧急停止
};

export function ControlButton({
  label,
  colorType,
  isPressed,
  onPressIn,
  onPressOut,
  size = 120,
  style,
  touchId,
}: ControlButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const activeTouchIdRef = useRef<number | null>(null);

  void touchId;
  
  const colors = BUTTON_COLORS[colorType];
  
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
          onPressIn();
        },
        onPanResponderRelease: (evt) => {
          if (evt.nativeEvent.identifier !== activeTouchIdRef.current) {
            return;
          }
          activeTouchIdRef.current = null;
          onPressOut();
        },
        onPanResponderTerminate: () => {
          activeTouchIdRef.current = null;
          onPressOut();
        },
      }),
    [onPressIn, onPressOut]
  );

  // 按钮尺寸可以通过size参数调整
  const dynamicStyle: ViewStyle = {
    width: size,
    height: size,
  };

  return (
    <View
      style={[
        styles.button,
        dynamicStyle,
        style,
        {
          backgroundColor: colors.bg,
          shadowOpacity: isPressed ? 0.2 : 0.35,
          shadowOffset: isPressed ? { width: 0, height: 2 } : { width: 0, height: 6 },
          shadowRadius: isPressed ? 6 : 10,
          elevation: isPressed ? 4 : 10,
          transform: [{ scale: isPressed ? 0.88 : 1 }],
          borderColor: isPressed ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
        },
      ]}
      {...panResponder.panHandlers}
    />
  );
}