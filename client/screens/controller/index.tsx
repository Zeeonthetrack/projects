import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Joystick } from '@/components/Joystick';
import { ControlButton } from '@/components/ControlButton';
import { TouchButton } from '@/components/TouchButton';
import { BluetoothService } from '@/services/BluetoothService';
import { BluetoothDevice } from '@/utils/bluetoothTypes';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { createDataPacket, formatPacketHex } from '@/utils/dataPacket';

/**
 * 主页面：游戏手柄控制器
 * 功能：
 * 1. 左右虚拟摇杆控制车轮转速
 * 2. 4个功能按键（激光、夹子闭合、夹子张开、紧急停止）
 * 3. 蓝牙连接管理（HC-05/HC-06）
 * 4. 调试日志显示
 */
export default function ControllerScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // 摇杆数值状态（0-255，127为中立位）
  const [leftJoystick, setLeftJoystick] = useState(127);
  const [rightJoystick, setRightJoystick] = useState(127);
  
  // 按键状态
  const [buttonStates, setButtonStates] = useState({
    red: false,      // 激光
    blue: false,     // 夹子闭合
    green: false,    // 夹子张开
    yellow: false,   // 紧急停止
  });
  
  // 蓝牙连接状态
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // 调试日志
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // 计算当前数据包
  const currentPacket = useMemo(() => {
    const packet = createDataPacket({
      leftJoystick,
      rightJoystick,
      redButton: buttonStates.red ? 0x01 : 0x00,
      blueButton: buttonStates.blue ? 0x02 : 0x00,
      greenButton: buttonStates.green ? 0x03 : 0x00,
      yellowButton: buttonStates.yellow ? 0x04 : 0x00,
    });
    return formatPacketHex(packet);
  }, [leftJoystick, rightJoystick, buttonStates]);
  
  // 初始化：设置日志回调
  useEffect(() => {
    BluetoothService.setLogCallback((message) => {
      setLogs(prev => [...prev.slice(-99), message]);  // 保留最近100条日志
    });
    
    // 清理函数（组件卸载时执行）
    return () => {
      BluetoothService.disconnect();
    };
  }, []);
  
  // 监听摇杆变化，更新蓝牙数据
  useEffect(() => {
    BluetoothService.updateControlData({
      leftJoystick,
      rightJoystick,
    });
  }, [leftJoystick, rightJoystick]);
  
  // 监听按键变化，更新蓝牙数据
  useEffect(() => {
    BluetoothService.updateControlData({
      redButton: buttonStates.red ? 0x01 : 0x00,
      blueButton: buttonStates.blue ? 0x02 : 0x00,
      greenButton: buttonStates.green ? 0x03 : 0x00,
      yellowButton: buttonStates.yellow ? 0x04 : 0x00,
    });
  }, [buttonStates]);
  
  /**
   * 扫描蓝牙设备
   * 类似于C语言中的函数，扫描周围的蓝牙设备
   */
  const handleScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setDevices([]);
    
    try {
      const foundDevices = await BluetoothService.scanDevices(5000);  // 扫描5秒
      setDevices(foundDevices);
      
      if (foundDevices.length === 0) {
        Alert.alert('提示', '未发现HC-05/HC-06设备，请确保设备已开启蓝牙');
      }
    } catch (error: any) {
      Alert.alert('错误', `扫描失败: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };
  
  /**
   * 连接设备
   */
  const handleConnect = async (device: BluetoothDevice) => {
    try {
      const success = await BluetoothService.connectToDevice(device);
      if (success) {
        setIsConnected(true);
        Alert.alert('成功', `已连接到 ${device.name}`);
      } else {
        Alert.alert('失败', '连接设备失败');
      }
    } catch (error: any) {
      Alert.alert('错误', `连接失败: ${error.message}`);
    }
  };
  
  /**
   * 断开连接
   */
  const handleDisconnect = async () => {
    await BluetoothService.disconnect();
    setIsConnected(false);
    Alert.alert('提示', '已断开连接');
  };
  
  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView level="root" style={styles.container}>
        {/* 顶部标题和连接状态 */}
        <View style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary}>
            STM32小车控制器
          </ThemedText>
          <View style={styles.statusRow}>
            <ThemedText
              variant="caption"
              style={{ marginRight: 12, color: theme.textSecondary }}
            >
              v1.10
            </ThemedText>
            <ThemedText
              variant="caption"
              color={isConnected ? theme.success : theme.error}
            >
              {isConnected ? '● 已连接' : '○ 未连接'}
            </ThemedText>
          </View>
        </View>
        
        {/* 摇杆区域 */}
        <View style={styles.joystickContainer}>
          {/* 左摇杆 */}
          <Joystick
            value={leftJoystick}
            onChange={setLeftJoystick}
            label="左轮"
            touchId={0}
          />
          
          {/* 右摇杆 */}
          <Joystick
            value={rightJoystick}
            onChange={setRightJoystick}
            label="右轮"
            touchId={1}
          />
        </View>
        
        {/* 数据包显示区域 */}
        <ThemedView level="elevated" style={styles.packetContainer}>
          <ThemedText variant="caption" color={theme.textSecondary} style={styles.packetLabel}>
            当前数据包 (8字节)
          </ThemedText>
          <ThemedText variant="h4" color={theme.primary} style={styles.packetValue}>
            {currentPacket}
          </ThemedText>
          <View style={styles.packetLegend}>
            <ThemedText variant="caption" color={theme.textMuted}>
              左轮 右轮 激光 夹闭 夹开 停止 校验1 校验2
            </ThemedText>
          </View>
        </ThemedView>
        
        {/* 功能按键区域 */}
        <View style={styles.buttonContainer}>
          <ControlButton
            label="激光"
            colorType="red"
            isPressed={buttonStates.red}
            onPressIn={() => setButtonStates({ ...buttonStates, red: true })}
            onPressOut={() => setButtonStates({ ...buttonStates, red: false })}
          />
          <ControlButton
            label="夹子闭合"
            colorType="blue"
            isPressed={buttonStates.blue}
            onPressIn={() => setButtonStates({ ...buttonStates, blue: true })}
            onPressOut={() => setButtonStates({ ...buttonStates, blue: false })}
          />
          <ControlButton
            label="夹子张开"
            colorType="green"
            isPressed={buttonStates.green}
            onPressIn={() => setButtonStates({ ...buttonStates, green: true })}
            onPressOut={() => setButtonStates({ ...buttonStates, green: false })}
          />
          <ControlButton
            label="紧急停止"
            colorType="yellow"
            isPressed={buttonStates.yellow}
            onPressIn={() => setButtonStates({ ...buttonStates, yellow: true })}
            onPressOut={() => setButtonStates({ ...buttonStates, yellow: false })}
          />
        </View>
        
        {/* 蓝牙控制区域 */}
        <View style={styles.bluetoothContainer}>
          {!isConnected ? (
            <>
              <ThemedText style={styles.bluetoothTitle}>蓝牙连接</ThemedText>
              <TouchButton onPress={handleScan} style={styles.scanButton}>
                <ThemedText color={theme.primary}>
                  {isScanning ? '扫描中...' : '扫描设备'}
                </ThemedText>
              </TouchButton>
              
              {/* 设备列表 */}
              {devices.length > 0 && (
                <View style={styles.deviceList}>
                  {devices.map((device) => (
                    <ThemedView
                      key={device.id}
                      level="default"
                      style={styles.deviceItem}
                    >
                      <ThemedText variant="caption">{device.name}</ThemedText>
                      <TouchButton onPress={() => handleConnect(device)}>
                        <ThemedText variant="smallMedium" color={theme.primary}>
                          连接
                        </ThemedText>
                      </TouchButton>
                    </ThemedView>
                  ))}
                </View>
              )}
            </>
          ) : (
            <TouchButton onPress={handleDisconnect} style={styles.disconnectButton}>
              <ThemedText color={theme.error}>断开连接</ThemedText>
            </TouchButton>
          )}
        </View>
        
        {/* 调试日志切换按钮 */}
        <TouchButton onPress={() => setShowLogs(!showLogs)} style={styles.logToggleButton}>
          <ThemedText color={theme.primary}>
            {showLogs ? '▼ 隐藏日志' : '▶ 显示日志'}
          </ThemedText>
        </TouchButton>
        
        {/* 调试日志区域（可折叠） */}
        {showLogs && (
          <View style={styles.logContainer}>
            <ScrollView style={styles.logScroll}>
              {logs.length === 0 ? (
                <ThemedText variant="caption" color={theme.textMuted}>
                  暂无日志
                </ThemedText>
              ) : (
                logs.map((log, index) => (
                  <ThemedText key={index} variant="caption" color={theme.textSecondary}>
                    {log}
                  </ThemedText>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </ThemedView>
    </Screen>
  );
}

// 必须导入useTheme
import { useTheme } from '@/hooks/useTheme';
