import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 控制按键样式定义
 * 方案B：完全移除文字，仅保留彩色圆形，用颜色标识功能（手游风格）
 */
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // 按键容器样式 - 圆形按钮（手游风格）
    button: {
      width: 80,
      height: 80,
      borderRadius: 40,  // 圆形
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 10,  // Android阴影
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',  // 添加白色边框增强质感
    },
  });
};
