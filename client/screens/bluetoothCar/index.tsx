import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, Text, useWindowDimensions, Modal, TextInput, Switch, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { VirtualJoystick } from '@/components/VirtualJoystick';
import { FunctionButton } from '@/components/FunctionButton';
import { DebugLog } from '@/components/DebugLog';
import { TouchButton } from '@/components/TouchButton';
import { BluetoothManager } from '@/utils/bluetoothManager';
import { ControlData, createDataPacket, formatPacketHex, getDefaultControlData } from '@/utils/dataPacket';
import { BluetoothDevice } from '@/utils/bluetoothTypes';

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

const SETTINGS_STORAGE_KEY = 'bluetoothCarSettings';

type TextEncoding = 'GBK' | 'UTF-8';
type NewlineFormat = '\r\n' | '\n' | '\r';

interface ControlSettings {
  textEncoding: TextEncoding;
  newlineFormat: NewlineFormat;
  receiveBufferSize: number;
  sendAreaIntervalMs: number;
  dataPacketIntervalMs: number;
  dataPacketAppendNewline: boolean;
  joystickSensitivity: number;
}

const defaultSettings: ControlSettings = {
  textEncoding: 'UTF-8',
  newlineFormat: '\n',
  receiveBufferSize: 100,
  sendAreaIntervalMs: 50,
  dataPacketIntervalMs: 5,
  dataPacketAppendNewline: false,
  joystickSensitivity: 5,
};

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeSettings = (partial?: Partial<ControlSettings>): ControlSettings => {
  if (!partial) return defaultSettings;
  const textEncoding = partial.textEncoding === 'GBK' || partial.textEncoding === 'UTF-8'
    ? partial.textEncoding
    : defaultSettings.textEncoding;
  const newlineFormat = partial.newlineFormat === '\r\n' || partial.newlineFormat === '\n' || partial.newlineFormat === '\r'
    ? partial.newlineFormat
    : defaultSettings.newlineFormat;

  return {
    textEncoding,
    newlineFormat,
    receiveBufferSize: clampNumber(Number(partial.receiveBufferSize ?? defaultSettings.receiveBufferSize), 10, 500),
    sendAreaIntervalMs: clampNumber(Number(partial.sendAreaIntervalMs ?? defaultSettings.sendAreaIntervalMs), 1, 100),
    dataPacketIntervalMs: clampNumber(Number(partial.dataPacketIntervalMs ?? defaultSettings.dataPacketIntervalMs), 1, 20),
    dataPacketAppendNewline: Boolean(partial.dataPacketAppendNewline),
    joystickSensitivity: clampNumber(Number(partial.joystickSensitivity ?? defaultSettings.joystickSensitivity), 1, 10),
  };
};

export default function BluetoothCarScreen() {
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

  const currentPacket = useMemo(() => formatPacketHex(createDataPacket(controlData)), [controlData]);

  // 设置相关状态
  const [settings, setSettings] = useState<ControlSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 定时器引用（用于5ms周期发送）
  const sendDataTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSendAtRef = useRef(0);

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

    const now = Date.now();
    const minInterval = clampNumber(settings.sendAreaIntervalMs, 1, 100);
    if (now - lastSendAtRef.current < minInterval) {
      return;
    }
    lastSendAtRef.current = now;

    try {
      // 创建数据包
      const packet = createDataPacket(controlData);
      // 保持控制包固定8字节，避免与协议冲突
      const finalPacket = packet;

      const newlineBytes = settings.newlineFormat === '\r\n'
        ? [0x0d, 0x0a]
        : settings.newlineFormat === '\n'
          ? [0x0a]
          : [0x0d];
      const logPacket = settings.dataPacketAppendNewline
        ? new Uint8Array([...packet, ...newlineBytes])
        : packet;
      
      // 格式化为十六进制字符串（用于日志）
      const hexString = formatPacketHex(logPacket);
      
      // 添加到日志（受缓存大小控制）
      const bufferSize = clampNumber(settings.receiveBufferSize, 10, 500);
      setPackets(prev => [...prev.slice(-(bufferSize - 1)), hexString]);
      
      // 发送数据（固定8字节包）
      await bluetoothManager.sendData(finalPacket);
      if (settings.dataPacketAppendNewline) {
        const newlinePayload = new Uint8Array(newlineBytes);
        await bluetoothManager.sendData(newlinePayload);
      }
      
    } catch (error) {
      console.error('[数据发送] 发送失败:', error);
    }
  }, [
    isConnected,
    controlData,
    bluetoothManager,
    settings.receiveBufferSize,
    settings.sendAreaIntervalMs,
    settings.dataPacketAppendNewline,
    settings.newlineFormat,
  ]);

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
    sendDataTimer.current = setInterval(() => {
      sendDataPacket();
    }, settings.dataPacketIntervalMs);

    console.log(`[数据发送] 已启动，周期：${settings.dataPacketIntervalMs}ms`);
  }, [sendDataPacket, settings.dataPacketIntervalMs]);

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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<ControlSettings>;
          setSettings(normalizeSettings(parsed));
        }
      } catch (error) {
        console.warn('[设置] 读取失败，使用默认值', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch((error) => {
      console.warn('[设置] 保存失败', error);
    });
  }, [settings]);

  useEffect(() => {
    if (isConnected) {
      stopDataSending();
      startDataSending();
    }
  }, [isConnected, settings.dataPacketIntervalMs, startDataSending, stopDataSending]);

  const { width, height } = useWindowDimensions();
  const screenWidth = Math.max(width, height);
  const screenHeight = Math.min(width, height);

  const layout = useMemo(() => {
    const baseJoystickSize = screenWidth * 0.25;
    const baseButtonSize = screenWidth * 0.1;
    const baseGap = screenWidth * 0.05;
    const totalRowWidth = baseJoystickSize * 2 + baseButtonSize * 4 + baseGap * 5;
    const scale = Math.min(1, screenWidth / totalRowWidth);
    const joystickSize = baseJoystickSize * scale;
    const buttonSize = baseButtonSize * scale;
    const buttonGap = baseGap * scale;
    const controlGap = baseGap * scale;
    const bottomOffset = screenHeight * 0.06;
    const rowWidth = joystickSize * 2 + buttonSize * 4 + buttonGap * 3 + controlGap * 2;
    const rowLeft = Math.max(0, (screenWidth - rowWidth) / 2);
    const headerTop = screenHeight * 0.03;
    const headerSide = screenWidth * 0.02;
    const headerHeight = screenHeight * 0.12;
    const headerPaddingX = screenWidth * 0.02;
    const headerPaddingY = screenHeight * 0.01;
    const headerRadius = screenWidth * 0.015;
    const headerGap = screenWidth * 0.015;
    const buttonPaddingX = screenWidth * 0.014;
    const buttonPaddingY = screenHeight * 0.01;
    const buttonRadius = screenWidth * 0.012;
    const buttonTextSize = screenWidth * 0.015;
    const joystickLabelGap = screenHeight * 0.01;
    const joystickValueSize = screenWidth * 0.04;
    const buttonLabelSize = screenWidth * 0.04;
    const settingsButtonSize = headerHeight * 0.8;
    const modalWidth = screenWidth * 0.7;
    const modalHeight = screenHeight * 0.7;
    const rootPaddingX = screenWidth * 0.02;
    const rootPaddingY = screenHeight * 0.02;
    const packetWidth = screenWidth * 0.48;
    const packetLeft = Math.max(0, (screenWidth - packetWidth) / 2);
    const packetTop = headerTop + headerHeight + screenHeight * 0.15;
    const packetPaddingX = screenWidth * 0.018;
    const packetPaddingY = screenHeight * 0.012;
    const packetRadius = screenWidth * 0.012;

    return {
      joystickSize,
      buttonSize,
      buttonGap,
      controlGap,
      bottomOffset,
      rowWidth,
      rowLeft,
      headerTop,
      headerSide,
      headerHeight,
      headerPaddingX,
      headerPaddingY,
      headerRadius,
      headerGap,
      buttonPaddingX,
      buttonPaddingY,
      buttonRadius,
      buttonTextSize,
      joystickLabelGap,
      joystickValueSize,
      buttonLabelSize,
      settingsButtonSize,
      modalWidth,
      modalHeight,
      rootPaddingX,
      rootPaddingY,
      packetWidth,
      packetLeft,
      packetTop,
      packetPaddingX,
      packetPaddingY,
      packetRadius,
    };
  }, [screenHeight, screenWidth]);

  const joystickSmoothing = useMemo(() => {
    const min = 0.08;
    const max = 0.5;
    const factor = (clampNumber(settings.joystickSensitivity, 1, 10) - 1) / 9;
    return min + (max - min) * factor;
  }, [settings.joystickSensitivity]);

  const joystickResponseCurve = useMemo(() => {
    const min = 1.4;
    const max = 0.7;
    const factor = (clampNumber(settings.joystickSensitivity, 1, 10) - 1) / 9;
    return min + (max - min) * factor;
  }, [settings.joystickSensitivity]);

  const joystickDeadZone = useMemo(() => {
    const min = 0.12;
    const max = 0.04;
    const factor = (clampNumber(settings.joystickSensitivity, 1, 10) - 1) / 9;
    return min + (max - min) * factor;
  }, [settings.joystickSensitivity]);

  const updateNumberSetting = useCallback(
    (key: keyof ControlSettings, value: string, min: number, max: number) => {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        return;
      }
      setSettings((prev) => ({
        ...prev,
        [key]: clampNumber(Math.round(numeric), min, max),
      }));
    },
    []
  );

  return (
    <Screen backgroundColor="#1a1a2e" statusBarStyle="light" safeAreaEdges={['left', 'right']}>
      <ThemedView
        style={[
          styles.container,
          {
            width: screenWidth,
            height: screenHeight,
            paddingHorizontal: layout.rootPaddingX,
            paddingVertical: layout.rootPaddingY,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              top: layout.headerTop,
              left: layout.headerSide,
              right: layout.headerSide,
              height: layout.headerHeight,
              paddingHorizontal: layout.headerPaddingX,
              paddingVertical: layout.headerPaddingY,
              borderRadius: layout.headerRadius,
            },
          ]}
        >
          <View style={styles.headerColumnLeft}>
            <TouchButton
              onPress={() => setIsSettingsOpen(true)}
              style={[
                styles.settingsButton,
                {
                  width: layout.settingsButtonSize,
                  height: layout.settingsButtonSize,
                  borderRadius: layout.settingsButtonSize / 2,
                },
              ]}
            >
              <Text style={[styles.settingsButtonText, { fontSize: layout.settingsButtonSize * 0.5 }]}>⚙️</Text>
            </TouchButton>
          </View>
          <View style={styles.headerColumnCenter}>
            <ThemedText variant="h3" color="#ffffff">🚗 蓝牙遥控小车</ThemedText>
            <ThemedText variant="caption" color="rgba(255,255,255,0.6)" style={{ marginTop: 4 }}>v1.12</ThemedText>
          </View>
          <View style={[styles.headerColumnRight, { gap: layout.headerGap }]}
          >
            {!isConnected ? (
              <TouchButton
                onPress={scanDevices}
                style={[
                  styles.button,
                  styles.connectButton,
                  {
                    paddingHorizontal: layout.buttonPaddingX,
                    paddingVertical: layout.buttonPaddingY,
                    borderRadius: layout.buttonRadius,
                  },
                ]}
                pressedStyle={styles.buttonPressed}
              >
                <Text style={[styles.buttonText, { fontSize: layout.buttonTextSize }]}>
                  {isScanning ? '扫描中...' : '🔍 扫描设备'}
                </Text>
              </TouchButton>
            ) : (
              <TouchButton
                onPress={disconnectDevice}
                style={[
                  styles.button,
                  styles.disconnectButton,
                  {
                    paddingHorizontal: layout.buttonPaddingX,
                    paddingVertical: layout.buttonPaddingY,
                    borderRadius: layout.buttonRadius,
                  },
                ]}
                pressedStyle={styles.buttonPressed}
              >
                <Text style={[styles.buttonText, { fontSize: layout.buttonTextSize }]}>
                  🔌 断开连接
                </Text>
              </TouchButton>
            )}
          </View>
        </View>

        <View
          style={[
            styles.packetPanel,
            {
              top: layout.packetTop,
              left: layout.packetLeft,
              width: layout.packetWidth,
              paddingVertical: layout.packetPaddingY,
              paddingHorizontal: layout.packetPaddingX,
              borderRadius: layout.packetRadius,
            },
          ]}
        >
          <ThemedText variant="caption" color="rgba(255,255,255,0.65)" style={styles.packetLabel}>
            当前数据包 (8字节)
          </ThemedText>
          <ThemedText variant="h4" color="#5A96FF" style={styles.packetValue}>
            {currentPacket}
          </ThemedText>
          <ThemedText variant="caption" color="rgba(255,255,255,0.45)" style={styles.packetLegend}>
            左轮 右轮 红灯 蓝灯 绿灯 黄灯 校验1 校验2
          </ThemedText>
        </View>

        <View
          style={[
            styles.controlRow,
            {
              left: layout.rowLeft,
              bottom: layout.bottomOffset,
              width: layout.rowWidth,
            },
          ]}
        >
          <View style={[styles.joystickWrapper, { width: layout.joystickSize }]}>
            <ThemedText
              variant="small"
              color="#ffffff"
              style={[styles.joystickLabel, { marginBottom: layout.joystickLabelGap, fontSize: layout.joystickValueSize }]}
            >
              左摇杆
            </ThemedText>
            <VirtualJoystick
              onChange={(value) => handleJoystickChange('left', value)}
              size={layout.joystickSize}
              debounceThreshold={1}
              smoothing={joystickSmoothing}
              responseCurve={joystickResponseCurve}
              deadZone={joystickDeadZone}
              returnDurationMs={50}
              touchId={0}
            />
          </View>

          <View style={[styles.buttonRow, { marginHorizontal: layout.controlGap }]}>
            <FunctionButton
              type="red"
              label="红灯"
              onPress={(value) => handleButtonPress('red', value)}
              onRelease={(value) => handleButtonRelease('red', value)}
              size={layout.buttonSize}
              labelSize={layout.buttonLabelSize}
              style={{ marginRight: layout.buttonGap }}
              touchId={2}
            />
            <FunctionButton
              type="blue"
              label="蓝灯"
              onPress={(value) => handleButtonPress('blue', value)}
              onRelease={(value) => handleButtonRelease('blue', value)}
              size={layout.buttonSize}
              labelSize={layout.buttonLabelSize}
              style={{ marginRight: layout.buttonGap }}
              touchId={3}
            />
            <FunctionButton
              type="green"
              label="绿灯"
              onPress={(value) => handleButtonPress('green', value)}
              onRelease={(value) => handleButtonRelease('green', value)}
              size={layout.buttonSize}
              labelSize={layout.buttonLabelSize}
              style={{ marginRight: layout.buttonGap }}
              touchId={4}
            />
            <FunctionButton
              type="yellow"
              label="黄灯"
              onPress={(value) => handleButtonPress('yellow', value)}
              onRelease={(value) => handleButtonRelease('yellow', value)}
              size={layout.buttonSize}
              labelSize={layout.buttonLabelSize}
              touchId={5}
            />
          </View>

          <View style={[styles.joystickWrapper, { width: layout.joystickSize }]}>
            <ThemedText
              variant="small"
              color="#ffffff"
              style={[styles.joystickLabel, { marginBottom: layout.joystickLabelGap, fontSize: layout.joystickValueSize }]}
            >
              右摇杆
            </ThemedText>
            <VirtualJoystick
              onChange={(value) => handleJoystickChange('right', value)}
              size={layout.joystickSize}
              debounceThreshold={1}
              smoothing={joystickSmoothing}
              responseCurve={joystickResponseCurve}
              deadZone={joystickDeadZone}
              returnDurationMs={50}
              touchId={1}
            />
          </View>
        </View>

        <Modal
          transparent
          visible={isSettingsOpen}
          animationType="fade"
          onRequestClose={() => setIsSettingsOpen(false)}
        >
          <View style={styles.settingsOverlay}>
            <View
              style={[
                styles.settingsModal,
                {
                  width: layout.modalWidth,
                  maxHeight: layout.modalHeight,
                  borderRadius: layout.headerRadius,
                },
              ]}
            >
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>⚙️ 设置</Text>
                <TouchButton onPress={() => setIsSettingsOpen(false)} style={styles.settingsCloseButton}>
                  <Text style={styles.settingsCloseText}>关闭</Text>
                </TouchButton>
              </View>

              <ScrollView style={styles.settingsBody} contentContainerStyle={styles.settingsBodyContent}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>文本编码</Text>
                  <View style={styles.settingsOptions}>
                    <TouchButton
                      onPress={() => setSettings((prev) => ({ ...prev, textEncoding: 'GBK' }))}
                      style={[
                        styles.optionButton,
                        settings.textEncoding === 'GBK' ? styles.optionButtonActive : null,
                      ]}
                    >
                      <Text style={styles.optionText}>GBK</Text>
                    </TouchButton>
                    <TouchButton
                      onPress={() => setSettings((prev) => ({ ...prev, textEncoding: 'UTF-8' }))}
                      style={[
                        styles.optionButton,
                        settings.textEncoding === 'UTF-8' ? styles.optionButtonActive : null,
                      ]}
                    >
                      <Text style={styles.optionText}>UTF-8</Text>
                    </TouchButton>
                  </View>
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>换行格式</Text>
                  <View style={styles.settingsOptions}>
                    <TouchButton
                      onPress={() => setSettings((prev) => ({ ...prev, newlineFormat: '\r\n' }))}
                      style={[
                        styles.optionButton,
                        settings.newlineFormat === '\r\n' ? styles.optionButtonActive : null,
                      ]}
                    >
                      <Text style={styles.optionText}>\r\n</Text>
                    </TouchButton>
                    <TouchButton
                      onPress={() => setSettings((prev) => ({ ...prev, newlineFormat: '\n' }))}
                      style={[
                        styles.optionButton,
                        settings.newlineFormat === '\n' ? styles.optionButtonActive : null,
                      ]}
                    >
                      <Text style={styles.optionText}>\n</Text>
                    </TouchButton>
                    <TouchButton
                      onPress={() => setSettings((prev) => ({ ...prev, newlineFormat: '\r' }))}
                      style={[
                        styles.optionButton,
                        settings.newlineFormat === '\r' ? styles.optionButtonActive : null,
                      ]}
                    >
                      <Text style={styles.optionText}>\r</Text>
                    </TouchButton>
                  </View>
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>接收区缓存大小</Text>
                  <TextInput
                    value={String(settings.receiveBufferSize)}
                    onChangeText={(text) => updateNumberSetting('receiveBufferSize', text, 10, 500)}
                    keyboardType="number-pad"
                    style={styles.settingsInput}
                  />
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>发送区发送间隔 (ms)</Text>
                  <TextInput
                    value={String(settings.sendAreaIntervalMs)}
                    onChangeText={(text) => updateNumberSetting('sendAreaIntervalMs', text, 1, 100)}
                    keyboardType="number-pad"
                    style={styles.settingsInput}
                  />
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>数据包发送间隔 (ms)</Text>
                  <TextInput
                    value={String(settings.dataPacketIntervalMs)}
                    onChangeText={(text) => updateNumberSetting('dataPacketIntervalMs', text, 1, 20)}
                    keyboardType="number-pad"
                    style={styles.settingsInput}
                  />
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>数据包末尾换行</Text>
                  <Switch
                    value={settings.dataPacketAppendNewline}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, dataPacketAppendNewline: value }))}
                  />
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>摇杆灵敏度 ({settings.joystickSensitivity})</Text>
                  <View style={styles.sliderContainer}>
                    <Slider
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={settings.joystickSensitivity}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, joystickSensitivity: Math.round(value) }))
                      }
                      minimumTrackTintColor="#5A96FF"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#5A96FF"
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerColumnLeft: {
    width: '20%',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerColumnCenter: {
    width: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerColumnRight: {
    width: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  settingsButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingsButtonText: {
    color: '#ffffff',
  },
  bluetoothControls: {
    flexDirection: 'row',
  },
  button: {
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  connectButton: {
    backgroundColor: '#00AA00',
  },
  disconnectButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  controlRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packetPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(90, 150, 255, 0.35)',
    alignItems: 'center',
  },
  packetLabel: {
    marginBottom: 6,
  },
  packetValue: {
    fontFamily: 'Courier New',
    letterSpacing: 2,
  },
  packetLegend: {
    marginTop: 6,
  },
  joystickWrapper: {
    alignItems: 'center',
  },
  joystickLabel: {
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: '#1e1e2e',
    padding: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
  },
  settingsCloseText: {
    color: '#ffffff',
  },
  settingsBody: {
    flexGrow: 0,
  },
  settingsBodyContent: {
    gap: 12,
    paddingBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    color: '#ffffff',
    flex: 1,
  },
  settingsOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(90, 150, 255, 0.6)',
  },
  optionText: {
    color: '#ffffff',
  },
  settingsInput: {
    minWidth: 90,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
  },
});
