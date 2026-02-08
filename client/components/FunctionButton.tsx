import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';

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
  width?: number;                      // 按键宽度
  height?: number;                     // 按键高度
  fontSize?: number;                   // 文字大小
}

export const FunctionButton: React.FC<FunctionButtonProps> = ({
  type,
  onPress,
  onRelease,
  label,
  width,
  height,
  fontSize,
}) => {
  const [isPressed, setIsPressed] = useState(false);  // 按键按下状态

  const colors = {
    red: { base: '#FF0000', pressed: '#CC0000' },
    blue: { base: '#0066FF', pressed: '#0047B3' },
    green: { base: '#00C853', pressed: '#00963F' },
    yellow: { base: '#FFD400', pressed: '#C7A400' },
  }[type];

  /**
   * 获取按键颜色
   * 
   * C/Python对应理解：
   * - 相当于C语言的 switch-case 语句
   * - 相当于Python的字典查找或if-elif语句
   */
  const getButtonColor = (): string => (isPressed ? colors.pressed : colors.base);

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

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getButtonColor(),
          width,
          height,
          transform: [{ scale: isPressed ? 0.95 : 1 }],  // 按下时缩小效果
        },
      ]}
      onPressIn={handlePressIn}    // 按下时触发
      onPressOut={handlePressOut}  // 松开时触发
      activeOpacity={0.85}
    >
      <Text style={[styles.label, fontSize ? { fontSize } : null]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 120,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
