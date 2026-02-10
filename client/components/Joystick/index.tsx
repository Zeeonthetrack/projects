import React, { useRef, useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
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
  
  // 使用 Reanimated shared values 替代 useState
  const offsetY = useSharedValue(0);
  const activeTouchId = useSharedValue<number | null>(null);
  
  // 上一次发送的数值（用于防抖）
  const lastValueRef = useRef(127);
  
  // 摇杆配置参数
  const JOYSTICK_MAX_OFFSET = 60;    // 最大偏移量

  const resolveJoystickName = () => {
    if (touchId === 0) return '左摇杆';
    if (touchId === 1) return '右摇杆';
    return '摇杆';
  };

  // 数值更新回调 - 使用 useCallback 避免闭包问题
  const emitValue = useCallback((clampedValue: number) => {
    if (Math.abs(clampedValue - lastValueRef.current) >= 3) {
      lastValueRef.current = clampedValue;
      console.log(`${resolveJoystickName()} touchID:${touchId ?? 'unknown'} 数值：${clampedValue}`);
      onChange(clampedValue);
    }
  }, [onChange, touchId]);
  
  /**
   * 使用 gesture-handler 的 Pan 手势
   * 支持真正的多点触控，每个摇杆独立处理
   */
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(0)
      .enableTrackpadTwoFingerGesture(false)
      .onBegin((event) => {
        // 只有当前摇杆空闲时才接受新触摸
        if (activeTouchId.value !== null) {
          return;
        }
        const pointerId = (event as any).pointerId ?? (event as any).id ?? null;
        activeTouchId.value = pointerId;
      })
      .onUpdate((event) => {
        // 验证触摸ID匹配
        const pointerId = (event as any).pointerId ?? (event as any).id ?? null;
        if (activeTouchId.value !== pointerId) {
          return;
        }
        
        // 限制最大偏移量
        const dy = event.translationY;
        const clampedY = Math.max(-JOYSTICK_MAX_OFFSET, Math.min(JOYSTICK_MAX_OFFSET, dy));
        offsetY.value = clampedY;
        
        // 映射到0-255范围
        const normalizedValue = Math.round(127 - (clampedY / JOYSTICK_MAX_OFFSET) * 127);
        const clampedValue = Math.max(0, Math.min(255, normalizedValue));
        
        // 使用 runOnJS 在 JS 线程中调用回调
        runOnJS(emitValue)(clampedValue);
      })
      .onFinalize((event) => {
        // 验证触摸ID匹配
        const pointerId = (event as any).pointerId ?? (event as any).id ?? null;
        if (activeTouchId.value !== pointerId) {
          return;
        }
        
        activeTouchId.value = null;
        
        // 平滑回弹到中心
        offsetY.value = withTiming(0, {
          duration: 150,
          easing: Easing.out(Easing.cubic),
        });
        
        // 恢复中立位
        if (lastValueRef.current !== 127) {
          lastValueRef.current = 127;
          runOnJS(onChange)(127);
          console.log(`${resolveJoystickName()} touchID:${touchId ?? 'unknown'} 数值：127`);
        }
      });
  }, [touchId, emitValue, onChange]);

  // 动画样式 - 拖动时颜色渐变，增强视觉反馈
  const animatedStyle = useAnimatedStyle(() => {
    // 计算拖动距离比例
    const progress = Math.abs(offsetY.value) / JOYSTICK_MAX_OFFSET;
    
    // 颜色从 #42A5F5 渐变到 #7BC4F7 (拖动时变亮)
    const baseR = 66, baseG = 165, baseB = 245;
    const targetR = 123, targetG = 196, targetB = 247;
    
    const r = Math.round(baseR + (targetR - baseR) * progress);
    const g = Math.round(baseG + (targetG - baseG) * progress);
    const b = Math.round(baseB + (targetB - baseB) * progress);
    
    return {
      transform: [{ translateY: offsetY.value }],
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
    };
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
      
      {/* 摇杆外圈 */}
      <View style={styles.outerCircle}>
        {/* 摇杆内圈（可触摸） - 使用 GestureDetector */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.innerCircle, animatedStyle]}>
            {/* 摇杆中心点 */}
            <View style={styles.centerDot} />
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}
