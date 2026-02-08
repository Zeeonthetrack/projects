import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
}: ControlButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const colors = BUTTON_COLORS[colorType];
  
  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.7}  // 按下时的透明度反馈
    >
      <View
        style={[
          styles.button,
          {
            backgroundColor: colors.bg,
            // 按下时的阴影效果（视觉反馈）
            shadowOpacity: isPressed ? 0.4 : 0.2,
            shadowOffset: isPressed ? { width: 0, height: 2 } : { width: 0, height: 4 },
            transform: [{ scale: isPressed ? 0.95 : 1 }],  // 按下时缩小
          },
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// 必须导入useMemo
import { useMemo } from 'react';
