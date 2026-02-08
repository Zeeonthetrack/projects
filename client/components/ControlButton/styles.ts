import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 控制按键样式定义
 */
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // 按键容器样式
    button: {
      width: 120,
      height: 80,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowRadius: 8,
      elevation: 5,  // Android阴影
    },
    
    // 按键文字样式
    buttonText: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
};
