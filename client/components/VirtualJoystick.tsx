import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

// 模块级常量（定义在组件外部，方便样式使用）
const KNOB_RADIUS = 30;  // 摇杆头半径
const BASE_RADIUS = 80;  // 摇杆底座半径

/**
 * 虚拟摇杆组件
 * 
 * 功能说明：
 * - 通过触摸控制摇杆移动
 * - 上下滑动控制数值变化（0-255，中立位127）
 * - 防抖处理：数值变化幅度<3时不更新
 * - 摇杆有视觉反馈
 * 
 * 参数说明（C/Python开发者理解）：
 * - onChange: 类似回调函数，当摇杆数值变化时调用
 * - neutralValue: 中立位数值（默认127，相当于C语言的 int neutralValue = 127;）
 * - range: 数值范围（0-255，相当于C语言的 int range = 255;）
 */
interface VirtualJoystickProps {
  onChange: (value: number) => void;    // 回调函数，当摇杆数值变化时调用
  neutralValue?: number;                 // 中立位数值（默认127）
  maxValue?: number;                     // 最大值（默认255）
  minValue?: number;                     // 最小值（默认0）
  debounceThreshold?: number;            // 防抖阈值（默认3，变化幅度<3不更新）
  style?: any;                           // 自定义样式
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onChange,
  neutralValue = 127,
  maxValue = 255,
  minValue = 0,
  debounceThreshold = 3,
  style,
}) => {
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });  // 摇杆头位置
  const [currentValue, setCurrentValue] = useState(neutralValue);    // 当前数值
  const knobRadius = 30;  // 摇杆头半径
  const baseRadius = 80;  // 摇杆底座半径
  const previousValue = useRef(neutralValue);  // 上一次的数值（用于防抖）

  /**
   * 计算摇杆数值
   * 
   * C/Python对应理解：
   * - C语言: int calculateValue(float offset)
   * - Python: def calculate_value(offset: float) -> int
   * 
   * 算法逻辑：
   * - offset: 摇杆相对于中心的垂直偏移量
   * - 上滑（offset < 0）-> 数值增大（加速）
   * - 下滑（offset > 0）-> 数值减小（减速/后退）
   */
  const calculateValue = (offset: number): number => {
    const range = maxValue - minValue;
    const normalizedOffset = offset / BASE_RADIUS;  // 归一化偏移量（-1 到 1）
    
    // 上滑增加数值，下滑减小数值
    let value = neutralValue - (normalizedOffset * (range / 2));
    
    // 限制数值范围（类似C语言的 if (value > maxValue) value = maxValue;）
    value = Math.max(minValue, Math.min(maxValue, value));
    
    return Math.round(value);  // 四舍五入取整
  };

  /**
   * PanResponder：处理触摸手势
   * 
   * C/Python对应理解：
   * - 相当于C语言的 touch事件处理函数
   * - 相当于Python的触摸事件监听器
   */
  const panResponder = useRef(
    PanResponder.create({
      // 允许响应触摸
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      // 触摸开始
      onPanResponderGrant: () => {
        setKnobPosition({ x: 0, y: 0 });
        onChange(neutralValue);
        setCurrentValue(neutralValue);
        previousValue.current = neutralValue;
      },

      // 触摸移动
      onPanResponderMove: (_, gestureState) => {
        // 获取垂直方向的偏移量
        const { dy } = gestureState;
        
        // 计算摇杆数值
        const newValue = calculateValue(dy);
        
        // 防抖处理：变化幅度<3不更新
        // 相当于C语言的: if (abs(newValue - previousValue) < threshold) return;
        if (Math.abs(newValue - previousValue.current) >= debounceThreshold) {
          setCurrentValue(newValue);
          onChange(newValue);
          previousValue.current = newValue;
        }
        
        // 限制摇杆头的移动范围（圆形区域）
        const distance = Math.sqrt(gestureState.dx * gestureState.dx + dy * dy);
        const maxDistance = BASE_RADIUS - KNOB_RADIUS;
        
        let limitedDx = gestureState.dx;
        let limitedDy = dy;
        
        if (distance > maxDistance) {
          const angle = Math.atan2(dy, gestureState.dx);
          limitedDx = Math.cos(angle) * maxDistance;
          limitedDy = Math.sin(angle) * maxDistance;
        }
        
        setKnobPosition({ x: limitedDx, y: limitedDy });
      },

      // 触摸结束
      onPanResponderRelease: () => {
        // 摇杆回中
        setKnobPosition({ x: 0, y: 0 });
        setCurrentValue(neutralValue);
        onChange(neutralValue);
        previousValue.current = neutralValue;
      },
    })
  ).current;

  return (
    <ThemedView style={[styles.container, style]}>
      {/* 摇杆底座 */}
      <View style={[styles.base]} {...panResponder.panHandlers}>
        {/* 摇杆头 */}
        <View
          style={[
            styles.knob,
            {
              transform: [
                { translateX: knobPosition.x },
                { translateY: knobPosition.y },
              ],
            },
          ]}
        />
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
    width: BASE_RADIUS * 2,
    height: BASE_RADIUS * 2,
    borderRadius: BASE_RADIUS,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a0a0a0',
  },
  knob: {
    width: KNOB_RADIUS * 2,
    height: KNOB_RADIUS * 2,
    borderRadius: KNOB_RADIUS,
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
