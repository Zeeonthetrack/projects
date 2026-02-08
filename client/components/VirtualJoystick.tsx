import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { ThemedView } from '@/components/ThemedView';

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
  size?: number;                          // 摇杆直径（自适应布局用）
  knobSize?: number;                      // 摇杆头直径（自适应布局用）
  style?: any;                           // 自定义样式
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onChange,
  neutralValue = 127,
  maxValue = 255,
  minValue = 0,
  debounceThreshold = 3,
  size,
  knobSize,
  style,
}) => {
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });  // 摇杆头位置
  const [isActive, setIsActive] = useState(false);
  const baseDiameter = size ?? 160;
  const knobDiameter = knobSize ?? Math.round(baseDiameter * 0.42);
  const baseRadius = baseDiameter / 2;
  const knobRadius = knobDiameter / 2;
  const maxOffset = Math.max(1, baseRadius - knobRadius);
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
    const normalizedOffset = offset / maxOffset;  // 归一化偏移量（-1 到 1）
    
    // 上滑增加数值，下滑减小数值
    let value = neutralValue - (normalizedOffset * (range / 2));
    
    // 限制数值范围（类似C语言的 if (value > maxValue) value = maxValue;）
    value = Math.max(minValue, Math.min(maxValue, value));
    
    return Math.round(value);  // 四舍五入取整
  };

  const updateValue = useCallback((offsetY: number) => {
    const newValue = calculateValue(offsetY);
    if (Math.abs(newValue - previousValue.current) >= debounceThreshold) {
      onChange(newValue);
      previousValue.current = newValue;
    }
  }, [calculateValue, debounceThreshold, onChange]);

  const handleGestureEvent = useCallback((event: any) => {
    const { translationX, translationY } = event.nativeEvent;
    const distance = Math.sqrt(translationX * translationX + translationY * translationY);

    let limitedX = translationX;
    let limitedY = translationY;

    if (distance > maxOffset) {
      const ratio = maxOffset / distance;
      limitedX = translationX * ratio;
      limitedY = translationY * ratio;
    }

    setKnobPosition({ x: limitedX, y: limitedY });
    updateValue(limitedY);
  }, [maxOffset, updateValue]);

  const handleStateChange = useCallback((event: any) => {
    const { state } = event.nativeEvent;

    if (state === State.BEGAN) {
      setIsActive(true);
      setKnobPosition({ x: 0, y: 0 });
      onChange(neutralValue);
      previousValue.current = neutralValue;
      return;
    }

    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      setIsActive(false);
      setKnobPosition({ x: 0, y: 0 });
      if (previousValue.current !== neutralValue) {
        previousValue.current = neutralValue;
        onChange(neutralValue);
      }
    }
  }, [neutralValue, onChange]);

  return (
    <ThemedView style={[styles.container, style]}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        shouldCancelWhenOutside={false}
      >
        <View
          style={[
            styles.base,
            {
              width: baseDiameter,
              height: baseDiameter,
              borderRadius: baseRadius,
              backgroundColor: isActive ? 'rgba(210, 210, 210, 0.6)' : 'rgba(200, 200, 200, 0.45)',
            },
          ]}
        >
          <View
            style={[
              styles.neutralMarker,
              {
                width: knobDiameter * 0.32,
                height: knobDiameter * 0.32,
                borderRadius: (knobDiameter * 0.32) / 2,
              },
            ]}
          />
          <View
            style={[
              styles.knob,
              {
                width: knobDiameter,
                height: knobDiameter,
                borderRadius: knobRadius,
                backgroundColor: isActive ? '#F0F0F0' : '#FFFFFF',
                transform: [
                  { translateX: knobPosition.x },
                  { translateY: knobPosition.y },
                ],
              },
            ]}
          />
        </View>
      </PanGestureHandler>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  neutralMarker: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  knob: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});
