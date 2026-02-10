import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 主页面样式定义
 */
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.sm,
      paddingTop: Spacing.md,
    },
    
    // 顶部标题区域
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    // 摇杆容器 - 优化间距，更协调的布局
    joystickContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: Spacing.lg + 4,
      paddingHorizontal: Spacing.xs,
    },
    
    // 功能按键容器 - 优化间距，紧凑排列
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.sm,
      gap: 16,  // 按钮之间16像素间距
      flexWrap: 'wrap',  // 允许换行以适应小屏幕
    },
    
    // 蓝牙控制区域 - 优化布局
    bluetoothContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      marginHorizontal: Spacing.sm,
      minHeight: 70,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    bluetoothTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    
    // 扫描按钮
    scanButton: {
      fontSize: 16,
      fontWeight: 'bold',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    
    // 断开连接按钮
    disconnectButton: {
      fontSize: 16,
      fontWeight: 'bold',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.error,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    
    // 设备列表
    deviceList: {
      width: '100%',
      marginTop: Spacing.md,
    },
    
    deviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
    
    // 日志切换按钮
    logToggleButton: {
      fontSize: 14,
      paddingVertical: Spacing.sm,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    
    // 日志容器
    logContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      height: 200,
    },
    
    // 日志滚动区域
    logScroll: {
      flex: 1,
    },
  });
};
