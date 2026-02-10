import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 摇杆组件样式定义
 * 类似于CSS中的样式类
 */
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
      minHeight: 120,  // 增加最小高度，确保文字有充分空间
    },
    
    // 摇杆标签样式
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
      lineHeight: 24,  // 增加行高，避免文字拥挤
      height: 26,      // 固定高度确保完整显示，留出上下空间
      textAlign: 'center',
    },
    
    // 数值显示样式
    valueText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: Spacing.md + 2,
      lineHeight: 32,  // 增加行高，垂直居中
      height: 34,      // 固定高度确保完整显示
      fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',  // 等宽字体
      textAlign: 'center',
    },
    
    // 外圈（摇杆底座）- 仿手游风格
    outerCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(50, 50, 50, 0.7)',  // 半透明深灰色
      borderWidth: 2,
      borderColor: 'rgba(100, 100, 100, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 4,  // Android阴影
    },
    
    // 内圈（可拖动的摇杆手柄）- 主色带悬浮感
    innerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#42A5F5',  // 主色
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#42A5F5',  // 彩色阴影增强悬浮感
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,  // Android阴影
    },
    
    // 中心点（装饰用）
    centerDot: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
  });
};
