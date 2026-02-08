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
      padding: Spacing.md,
    },
    
    // 摇杆标签样式
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    
    // 数值显示样式
    valueText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: Spacing.md,
      fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',  // 等宽字体
    },
    
    // 外圈（摇杆底座）
    outerCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 2,
      borderColor: theme.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,  // Android阴影
    },
    
    // 内圈（可拖动的摇杆手柄）
    innerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,  // Android阴影
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
