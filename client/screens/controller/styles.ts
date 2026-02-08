import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 主页面样式定义
 */
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    
    // 顶部标题区域
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    // 摇杆容器
    joystickContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.xl,
    },
    
    // 功能按键容器
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    
    // 蓝牙控制区域
    bluetoothContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      minHeight: 80,
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
