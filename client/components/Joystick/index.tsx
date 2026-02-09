import React, { useState, useRef } from 'react';
import { View, PanResponder, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';

/**
 * 摇杆组件
 * 功能：模拟游戏手柄摇杆，控制车轮转速
 * 
 * 参数说明（类似Python函数的参数）：
 * - value: 当前摇杆数值（0-255，127为中立位）
 * - onChange: 数值变化时的回调函数
 * - label: 摇杆标签（"左轮" 或 "右轮"）
 */
interface JoystickProps {
  value: number;        // 当前数值（0-255）
  onChange: (value: number) => void;  // 数值变化回调
  label: string;        // 标签
  touchId?: number;     // 绑定的触摸ID
}

export function Joystick({ value, onChange, label, touchId }: JoystickProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // 摇杆位置状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // 上一次发送的数值（用于防抖）
  const lastValueRef = useRef(127);
  const activeTouchIdRef = useRef<number | null>(null);
  
  // 摇杆配置参数
  const JOYSTICK_RADIUS = 80;        // 摇杆半径
  const JOYSTICK_MAX_OFFSET = 60;    // 最大偏移量

  const resolveJoystickName = () => {
    if (touchId === 0) return '左摇杆';
    if (touchId === 1) return '右摇杆';
    return '摇杆';
  };

  const matchesTouchId = (identifier?: number | null) => {
    if (touchId === undefined) return true;
    return identifier === touchId;
  };
  
  /**
   * PanResponder 处理触摸手势
   * 类似于C语言中的触摸事件处理函数
   */
  const panResponder = useRef(
    PanResponder.create({
      // 允许响应手势
      onStartShouldSetPanResponder: (evt) =>
        activeTouchIdRef.current === null && matchesTouchId(evt.nativeEvent.identifier),
      onMoveShouldSetPanResponder: (evt) =>
        activeTouchIdRef.current === null && matchesTouchId(evt.nativeEvent.identifier),
      
      // 触摸开始
      onPanResponderGrant: (evt) => {
        // 可以在这里添加触摸开始的逻辑（如震动反馈）
        if (!matchesTouchId(evt.nativeEvent.identifier)) {
          return;
        }
        activeTouchIdRef.current = evt.nativeEvent.identifier ?? null;
      },
      
      // 触摸移动（核心逻辑）
      onPanResponderMove: (event, gestureState) => {
        if (event.nativeEvent.identifier !== activeTouchIdRef.current) {
          return;
        }
        const { dy } = gestureState;  // dy: Y轴移动距离（正数向下，负数向上）
        
        // 限制最大偏移量
        const clampedY = Math.max(-JOYSTICK_MAX_OFFSET, Math.min(JOYSTICK_MAX_OFFSET, dy));
        
        // 更新摇杆位置
        setPosition({ x: 0, y: clampedY });
        
        // 将偏移量映射到0-255范围
        // -60 (最上) → 255 (前进)
        // 0 (中心)  → 127 (停止)
        // +60 (最下) → 0 (后退)
        const normalizedValue = Math.round(127 - (clampedY / JOYSTICK_MAX_OFFSET) * 127);
        const clampedValue = Math.max(0, Math.min(255, normalizedValue));
        
        // 防抖处理：数值变化幅度<3时不更新
        // 类似于C语言中的if判断
        if (Math.abs(clampedValue - lastValueRef.current) >= 3) {
          lastValueRef.current = clampedValue;
          console.log(`${resolveJoystickName()} touchID:${touchId ?? 'unknown'} 数值：${clampedValue}`);
          onChange(clampedValue);  // 回调通知父组件
        }
      },
      
      // 触摸结束
      onPanResponderRelease: (evt) => {
        if (evt.nativeEvent.identifier !== activeTouchIdRef.current) {
          return;
        }
        activeTouchIdRef.current = null;
        // 复位到中心位置
        setPosition({ x: 0, y: 0 });
        
        // 恢复中立位（127）
        if (lastValueRef.current !== 127) {
          lastValueRef.current = 127;
          console.log(`${resolveJoystickName()} touchID:${touchId ?? 'unknown'} 数值：127`);
          onChange(127);
        }
      },
      onPanResponderTerminate: () => {
        activeTouchIdRef.current = null;
      },
    })
  ).current;
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
      
      {/* 摇杆外圈 */}
      <View style={styles.outerCircle}>
        {/* 摇杆内圈（可触摸） */}
        <View
          style={[
            styles.innerCircle,
            {
              transform: [{ translateY: position.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* 摇杆中心点 */}
          <View style={styles.centerDot} />
        </View>
      </View>
    </View>
  );
}

// 必须导入useMemo
import { useMemo } from 'react';
