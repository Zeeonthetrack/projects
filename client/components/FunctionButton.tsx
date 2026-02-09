import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, ViewStyle } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

/**
 * 功能按键类型定义
 * 
 * C/Python对应理解：
 * - 相当于C语言的枚举类型：enum ButtonType { RED, BLUE, GREEN, YELLOW };
 * - 相当于Python的枚举类：class ButtonType(Enum): RED=0, BLUE=1, ...
 */
export type ButtonType = 'red' | 'blue' | 'green' | 'yellow';

/**
 * 功能按键组件
 * 
 * 功能说明：
 * - 支持4种颜色：红、蓝、绿、黄
 * - 按下时改变视觉状态（缩小、变色）
 * - 松开时恢复原状
 * - 支持回调函数，按下/松开时通知父组件
 * 
 * 状态位说明（十六进制）：
 * - 红色按键：按下0x01，松开0x00（相当于C语言的 #define RED_BUTTON_PRESSED 0x01）
 * - 蓝色按键：按下0x02，松开0x00
 * - 绿色按键：按下0x03，松开0x00
 * - 黄色按键：按下0x04，松开0x00
 */
interface FunctionButtonProps {
  type: ButtonType;                    // 按键类型（红/蓝/绿/黄）
  onPress: (value: number) => void;    // 按下回调函数（传递状态值）
  onRelease: (value: number) => void;  // 松开回调函数（传递状态值）
  label: string;                       // 按键标签文字
  size?: number;                       // 按键尺寸（默认80）
  style?: ViewStyle;                   // 自定义样式
  touchId?: number;                    // 触摸ID
}

export const FunctionButton: React.FC<FunctionButtonProps> = ({
  type,
  onPress,
  onRelease,
  label,
  size = 80,
  style,
  touchId,
}) => {
  const [isPressed, setIsPressed] = useState(false);  // 按键按下状态
  const activeTouchIdRef = useRef<number | null>(null);

  void touchId;

  /**
   * 获取按键颜色
   * 
   * C/Python对应理解：
   * - 相当于C语言的 switch-case 语句
   * - 相当于Python的字典查找或if-elif语句
   */
  const getButtonColor = (): string => {
    if (isPressed) {
      // 按下状态：颜色变深
      switch (type) {
        case 'red': return '#8B0000';    // 深红（相当于C语言: 0x8B0000）
        case 'blue': return '#00008B';   // 深蓝
        case 'green': return '#006400';  // 深绿
        case 'yellow': return '#B8860B'; // 深黄
      }
    } else {
      // 松开状态：正常颜色
      switch (type) {
        case 'red': return '#FF0000';    // 红色（相当于C语言: 0xFF0000）
        case 'blue': return '#0000FF';   // 蓝色
        case 'green': return '#00FF00';  // 绿色
        case 'yellow': return '#FFFF00'; // 黄色
      }
    }
  };

  /**
   * 获取状态值（十六进制）
   * 
   * C/Python对应理解：
   * - 相当于C语言的 return (isPressed) ? 0x01 : 0x00;
   * - 相当于Python的 return 0x01 if is_pressed else 0x00
   */
  const getButtonValue = (): number => {
    if (isPressed) {
      // 按下时返回对应的状态值
      switch (type) {
        case 'red': return 0x01;  // 红色按下：0x01（十六进制）
        case 'blue': return 0x02; // 蓝色按下：0x02
        case 'green': return 0x03; // 绿色按下：0x03
        case 'yellow': return 0x04; // 黄色按下：0x04
      }
    }
    return 0x00;  // 松开时返回0x00
  };

  /**
   * 处理按下事件
   * 
   * C/Python对应理解：
   * - 相当于C语言的 void onButtonPress() { setIsPressed(true); }
   * - 相当于Python的 def on_button_press(): is_pressed = True
   */
  const handlePressIn = () => {
    setIsPressed(true);
    onPress(getButtonValue());  // 通知父组件按键状态变化
  };

  /**
   * 处理松开事件
   * 
   * C/Python对应理解：
   * - 相当于C语言的 void onButtonRelease() { setIsPressed(false); }
   * - 相当于Python的 def on_button_release(): is_pressed = False
   */
  const handlePressOut = () => {
    setIsPressed(false);
    onRelease(0x00);  // 通知父组件按键复位为0x00
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
          handlePressIn();
        },
        onPanResponderRelease: (evt) => {
          if (evt.nativeEvent.identifier !== activeTouchIdRef.current) {
            return;
          }
          activeTouchIdRef.current = null;
          handlePressOut();
        },
        onPanResponderTerminate: () => {
          activeTouchIdRef.current = null;
          handlePressOut();
        },
      }),
    []
  );

  const dynamicStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <ThemedView
      style={[
        styles.button,
        dynamicStyle,
        style,
        {
          backgroundColor: getButtonColor(),
          transform: [{ scale: isPressed ? 0.95 : 1 }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <ThemedView style={styles.buttonContent}>
        <Text style={styles.label}>{label}</Text>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
