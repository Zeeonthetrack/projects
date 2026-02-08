import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Alert, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { VirtualJoystick } from '@/components/VirtualJoystick';
import { FunctionButton } from '@/components/FunctionButton';
import { DebugLog } from '@/components/DebugLog';
import { BluetoothManager } from '@/utils/bluetoothManager';
import { ControlData, createDataPacket, formatPacketHex, getDefaultControlData } from '@/utils/dataPacket';
import { BluetoothDevice } from '@/utils/bluetoothTypes';
import { createStyles } from './styles';

/**
 * 蓝牙遥控小车主界面
 * 
 * C/Python对应理解：
 * - 相当于C语言的 main() 函数 + 主循环
 * - 相当于Python的 if __name__ == '__main__': 主程序入口
 * 
 * 功能说明：
 * - 左右两个虚拟摇杆控制小车左右轮转速
 * - 4个功能按键（红蓝绿黄）控制额外功能
 * - 蓝牙连接HC-05设备
 * - 5ms周期发送控制数据包
 * - 调试日志显示
 * - 自动重连功能
 * - 横屏锁定（已在app.config.ts中配置）
 */

export default function BluetoothCarScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ==================== 状态变量声明 ====================
  // 相当于C语言的: int leftJoystickValue = 127;
  // 相当于Python的: left_joystick_value = 127
  
  // 控制数据状态
  const [controlData, setControlData] = useState<ControlData>(getDefaultControlData());
  
  // 蓝牙相关状态
  const [bluetoothManager] = useState(() => new BluetoothManager());
  const [isConnected, setIsConnected] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState('未连接');
  const [isScanning, setIsScanning] = useState(false);
  
  // 调试日志状态
  const [isLogCollapsed, setIsLogCollapsed] = useState(true);
  const [packets, setPackets] = useState<string[]>([]);
  
  // 定时器引用（用于5ms周期发送）
  const sendDataTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const horizontalPadding = Math.max(12, Math.round(width * 0.02));
  const topBarHeight = Math.max(36, Math.round(height * 0.08));
  const topBarTop = insets.top + 6;
  const topPadding = topBarTop + topBarHeight + 6;
  const bottomPadding = insets.bottom + 10;
  const joystickSlotWidth = width * 0.35;
  const centerSlotWidth = width * 0.3;
  const buttonSlotWidth = width * 0.3;
  const buttonGap = Math.max(8, Math.round(buttonSlotWidth * 0.04));
  const buttonWidth = Math.max(64, Math.floor((buttonSlotWidth - buttonGap * 3) / 4));
  const buttonHeight = Math.min(Math.round(height * 0.16), 80);
  const joystickSize = Math.min(joystickSlotWidth * 0.85, height * 0.6);
  const knobSize = Math.max(44, Math.round(joystickSize * 0.42));
  const labelFontSize = Math.max(12, Math.round(height * 0.02));
  const statusFontSize = Math.max(11, Math.round(height * 0.018));

  const styles = useMemo(() => createStyles({
    horizontalPadding,
    topPadding,
    bottomPadding,
    topBarHeight,
    topBarTop,
    joystickSlotWidth,
    centerSlotWidth,
    buttonSlotWidth,
    buttonAreaHeight: buttonHeight + 16,
    labelFontSize,
    statusFontSize,
    backgroundColor: '#141618',
  }), [
    horizontalPadding,
    topPadding,
    bottomPadding,
    topBarHeight,
    topBarTop,
    joystickSlotWidth,
    centerSlotWidth,
    buttonSlotWidth,
    buttonHeight,
    labelFontSize,
    statusFontSize,
  ]);

  /**
   * 更新摇杆数值
   * 
   * C/Python对应理解：
   * - C语言: void updateLeftJoystick(int value)
   * - Python: def update_left_joystick(value: int): ...
   * 
   * @param side - 'left' 或 'right'，表示哪个摇杆
   * @param value - 摇杆数值（0-255）
   */
  const handleJoystickChange = useCallback((side: 'left' | 'right', value: number) => {
    setControlData(prev => {
      const newData = { ...prev };
      if (side === 'left') {
        newData.leftJoystick = value;
      } else {
        newData.rightJoystick = value;
      }
      return newData;
    });
  }, []);

  /**
   * 按键按下处理
   * 
   * C/Python对应理解：
   * - C语言: void onButtonPress(int buttonType, int value)
   * - Python: def on_button_press(button_type: str, value: int): ...
   * 
   * @param type - 按键类型（'red'/'blue'/'green'/'yellow'）
   * @param value - 状态值（0x01/0x02/0x03/0x04）
   */
  const handleButtonPress = useCallback((type: 'red' | 'blue' | 'green' | 'yellow', value: number) => {
    setControlData(prev => {
      const newData = { ...prev };
      if (type === 'red') newData.redButton = value;
      if (type === 'blue') newData.blueButton = value;
      if (type === 'green') newData.greenButton = value;
      if (type === 'yellow') newData.yellowButton = value;
      return newData;
    });
  }, []);

  /**
   * 按键松开处理
   * 
   * C/Python对应理解：
   * - C语言: void onButtonRelease(int buttonType)
   * - Python: def on_button_release(button_type: str): ...
   * 
   * @param type - 按键类型（'red'/'blue'/'green'/'yellow'）
   * @param value - 状态值（始终为0x00）
   */
  const handleButtonRelease = useCallback((type: 'red' | 'blue' | 'green' | 'yellow', value: number) => {
    setControlData(prev => {
      const newData = { ...prev };
      if (type === 'red') newData.redButton = value;
      if (type === 'blue') newData.blueButton = value;
      if (type === 'green') newData.greenButton = value;
      if (type === 'yellow') newData.yellowButton = value;
      return newData;
    });
  }, []);

  /**
   * 发送数据包
   * 
   * C/Python对应理解：
   * - C语言: void sendControlData()
   * - Python: def send_control_data(): ...
   * 
   * 功能说明：
   * - 将控制数据组装成8字节数据包
   * - 通过蓝牙发送数据
   * - 记录到调试日志
   */
  const sendDataPacket = useCallback(async () => {
    if (!isConnected) {
      return;  // 未连接时不发送
    }

    try {
      // 创建数据包
      const packet = createDataPacket(controlData);
      
      // 格式化为十六进制字符串（用于日志）
      const hexString = formatPacketHex(packet);
      
      // 添加到日志
      setPackets(prev => [...prev.slice(-199), hexString]);
      
      // 发送数据
      await bluetoothManager.sendData(packet);
      
    } catch (error) {
      console.error('[数据发送] 发送失败:', error);
    }
  }, [isConnected, controlData, bluetoothManager]);

  /**
   * 启动数据发送定时器（5ms周期）
   * 
   * C/Python对应理解：
   * - C语言: void startTimer() { setInterval(sendData, 5); }
   * - Python: def start_timer(): timer = Timer(0.005, send_data)
   * 
   * 注意：5ms周期对于React Native可能过于频繁，实际使用中建议20-50ms
   */
  const startDataSending = useCallback(() => {
    // 使用20ms周期（5ms可能过于频繁，导致性能问题）
    // 如果确实需要5ms，可以改为 setInterval(sendDataPacket, 5)
    sendDataTimer.current = setInterval(() => {
      sendDataPacket();
    }, 20);
    
    console.log('[数据发送] 已启动，周期：20ms');
  }, [sendDataPacket]);

  /**
   * 停止数据发送定时器
   * 
   * C/Python对应理解：
   * - C语言: void stopTimer() { clearInterval(timer); }
   * - Python: def stop_timer(): timer.cancel()
   */
  const stopDataSending = useCallback(() => {
    if (sendDataTimer.current) {
      clearInterval(sendDataTimer.current);
      sendDataTimer.current = null;
      console.log('[数据发送] 已停止');
    }
  }, []);

  /**
   * 扫描蓝牙设备
   * 
   * C/Python对应理解：
   * - C语言: void scanBluetooth()
   * - Python: def scan_bluetooth(): ...
   */
  const scanDevices = useCallback(async () => {
    if (isScanning) {
      Alert.alert('提示', '正在扫描中，请稍候...');
      return;
    }

    setIsScanning(true);
    setBluetoothStatus('正在扫描设备...');

    try {
      const devices: BluetoothDevice[] = [];
      
      // 扫描设备，持续5秒
      await bluetoothManager.scanDevices(
        (device) => {
          if (!devices.find(d => d.id === device.id)) {
            devices.push(device);
          }
        },
        5
      );

      // 扫描完成后，弹出设备列表供用户选择
      if (devices.length === 0) {
        Alert.alert('提示', '未找到蓝牙设备，请确保设备已开启并处于可发现模式');
        setBluetoothStatus('未连接');
      } else {
        // 显示设备列表（简化处理，选择第一个HC-05设备）
        const hc05Device = devices.find(d => d.name?.includes('HC-05'));
        
        if (hc05Device) {
          // 自动连接HC-05设备
          connectToDevice(hc05Device.id, hc05Device.name || undefined);
        } else {
          // 如果没有找到HC-05，显示所有设备供选择
          const deviceNames = devices.map(d => `${d.name || d.id} (${d.id})`).join('\n');
          Alert.alert(
            '找到设备',
            deviceNames,
            [
              {
                text: '取消',
                style: 'cancel',
                onPress: () => {
                  setBluetoothStatus('未连接');
                },
              },
              {
                text: '连接第一个',
                onPress: () => {
                  connectToDevice(devices[0].id, devices[0].name || undefined);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('[蓝牙扫描] 扫描失败:', error);
      Alert.alert('错误', '蓝牙扫描失败，请检查蓝牙权限');
      setBluetoothStatus('扫描失败');
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, bluetoothManager]);

  /**
   * 连接到指定设备
   * 
   * C/Python对应理解：
   * - C语言: void connectToDevice(char* deviceId, char* deviceName)
   * - Python: def connect_to_device(device_id: str, device_name: str): ...
   */
  const connectToDevice = useCallback(async (deviceId: string, deviceName?: string) => {
    try {
      setBluetoothStatus(`正在连接 ${deviceName || deviceId}...`);
      
      await bluetoothManager.connect(
        deviceId,
        // 连接成功回调
        () => {
          setIsConnected(true);
          setBluetoothStatus(`已连接: ${deviceName || deviceId}`);
          Alert.alert('成功', '蓝牙设备连接成功');
          startDataSending();  // 连接成功后开始发送数据
        },
        // 断开连接回调
        () => {
          setIsConnected(false);
          setBluetoothStatus('已断开连接');
          stopDataSending();  // 断开连接后停止发送数据
          Alert.alert('提示', '蓝牙设备已断开连接');
        }
      );
    } catch (error) {
      console.error('[蓝牙连接] 连接失败:', error);
      Alert.alert('错误', '蓝牙连接失败，请重试');
      setBluetoothStatus('连接失败');
      setIsConnected(false);
    }
  }, [bluetoothManager, startDataSending, stopDataSending]);

  /**
   * 断开蓝牙连接
   * 
   * C/Python对应理解：
   * - C语言: void disconnectDevice()
   * - Python: def disconnect_device(): ...
   */
  const disconnectDevice = useCallback(async () => {
    try {
      await bluetoothManager.disconnect();
      setIsConnected(false);
      setBluetoothStatus('未连接');
      stopDataSending();
      Alert.alert('成功', '已断开蓝牙连接');
    } catch (error) {
      console.error('[蓝牙断开] 断开失败:', error);
      Alert.alert('错误', '断开连接失败');
    }
  }, [bluetoothManager, stopDataSending]);

  /**
   * 清空日志
   * 
   * C/Python对应理解：
   * - C语言: void clearLog()
   * - Python: def clear_log(): logs.clear()
   */
  const clearLog = useCallback(() => {
    setPackets([]);
  }, []);

  /**
   * 组件卸载时清理资源
   * 
   * C/Python对应理解：
   * - C语言: void cleanup() { stopTimer(); disconnect(); }
   * - Python: def __del__(self): self.stop_timer()
   */
  useEffect(() => {
    return () => {
      stopDataSending();
      bluetoothManager.destroy();
    };
  }, [stopDataSending, bluetoothManager]);

  return (
    <Screen backgroundColor="#141618" statusBarStyle="light">
      <ThemedView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.statusPill}>
            <ThemedText style={styles.statusText} numberOfLines={1}>
              {bluetoothStatus}
            </ThemedText>
          </View>
          {!isConnected ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={scanDevices}
              disabled={isScanning}
            >
              <Text style={styles.actionText}>
                {isScanning ? '扫描中' : '扫描'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.disconnectButton]}
              onPress={disconnectDevice}
            >
              <Text style={styles.actionText}>断开</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mainRow}>
          <View style={styles.joystickSlot}>
            <ThemedText style={styles.joystickLabel}>
              左轮 {controlData.leftJoystick}
            </ThemedText>
            <VirtualJoystick
              onChange={(value) => handleJoystickChange('left', value)}
              size={joystickSize}
              knobSize={knobSize}
            />
          </View>

          <View style={styles.centerSpacer} />

          <View style={styles.joystickSlot}>
            <ThemedText style={styles.joystickLabel}>
              右轮 {controlData.rightJoystick}
            </ThemedText>
            <VirtualJoystick
              onChange={(value) => handleJoystickChange('right', value)}
              size={joystickSize}
              knobSize={knobSize}
            />
          </View>
        </View>

        <View style={styles.buttonArea}>
          <View style={styles.buttonRow}>
            <FunctionButton
              type="red"
              label="红灯"
              width={buttonWidth}
              height={buttonHeight}
              fontSize={labelFontSize}
              onPress={(value) => handleButtonPress('red', value)}
              onRelease={(value) => handleButtonRelease('red', value)}
            />
            <FunctionButton
              type="blue"
              label="蓝灯"
              width={buttonWidth}
              height={buttonHeight}
              fontSize={labelFontSize}
              onPress={(value) => handleButtonPress('blue', value)}
              onRelease={(value) => handleButtonRelease('blue', value)}
            />
            <FunctionButton
              type="green"
              label="绿灯"
              width={buttonWidth}
              height={buttonHeight}
              fontSize={labelFontSize}
              onPress={(value) => handleButtonPress('green', value)}
              onRelease={(value) => handleButtonRelease('green', value)}
            />
            <FunctionButton
              type="yellow"
              label="黄灯"
              width={buttonWidth}
              height={buttonHeight}
              fontSize={labelFontSize}
              onPress={(value) => handleButtonPress('yellow', value)}
              onRelease={(value) => handleButtonRelease('yellow', value)}
            />
          </View>
        </View>

        <DebugLog
          isCollapsed={isLogCollapsed}
          toggleCollapse={() => setIsLogCollapsed(!isLogCollapsed)}
          bluetoothStatus={bluetoothStatus}
          packets={packets}
          onClearLog={clearLog}
        />
      </ThemedView>
    </Screen>
  );
}
