import BluetoothClassic from 'react-native-bluetooth-classic';
import { BluetoothDevice } from '@/utils/bluetoothTypes';

/**
 * 数据包参数接口
 * 定义摇杆和按键的状态
 */
export interface ControlData {
  leftJoystick: number;    // 左摇杆数值（0-255，127为中立位）
  rightJoystick: number;   // 右摇杆数值（0-255，127为中立位）
  redButton: number;       // 红色按键状态（0x00/0x01）
  blueButton: number;      // 蓝色按键状态（0x00/0x02）
  greenButton: number;     // 绿色按键状态（0x00/0x03）
  yellowButton: number;    // 黄色按键状态（0x00/0x04）
}

/**
 * 蓝牙服务类
 * 功能：管理蓝牙连接、数据传输、断线重连
 * 
 * 类似于Python中的类，用于封装蓝牙相关操作
 */
class BluetoothServiceClass {
  private connectedDevice: BluetoothDevice | null = null;  // 当前连接的设备
  private isConnected: boolean = false;  // 连接状态
  private sendTimer: ReturnType<typeof setInterval> | null = null;  // 发送定时器
  private reconnectAttempts: number = 0;  // 重连尝试次数
  private maxReconnectAttempts: number = 3;  // 最大重连次数（3次）
  private controlData: ControlData = {  // 当前控制数据
    leftJoystick: 127,
    rightJoystick: 127,
    redButton: 0x00,
    blueButton: 0x00,
    greenButton: 0x00,
    yellowButton: 0x00,
  };
  private logCallback: ((message: string) => void) | null = null;  // 日志回调
  
  constructor() {
    this.log('蓝牙服务已初始化');
  }
  
  /**
   * 设置日志回调函数
   * 用于将日志输出到UI界面
   */
  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback;
  }
  
  /**
   * 记录日志
   * 类似于Python中的print()函数
   */
  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);  // 输出到控制台
    if (this.logCallback) {
      this.logCallback(logMessage);  // 输出到UI
    }
  }
  
  /**
   * 扫描蓝牙设备
   * 类似于C语言中的函数，扫描周围的蓝牙设备
   * 
   * @param duration 扫描时长（毫秒）
   * @returns 设备列表
   */
  async scanDevices(duration: number = 5000): Promise<BluetoothDevice[]> {
    try {
      this.log('开始扫描蓝牙设备...');
      
      const discovered = await this.discoverDevices(duration);
      const devices: BluetoothDevice[] = [];

      discovered.forEach((device) => {
        const normalized = this.normalizeDevice(device);
        if (!normalized) {
          return;
        }

        if (!devices.find(d => d.id === normalized.id)) {
          devices.push(normalized);
          if (normalized.name?.includes('HC')) {
            this.log(`发现设备: ${normalized.name} (${normalized.id})`);
          }
        }
      });

      this.log(`扫描完成，共发现 ${devices.length} 个设备`);
      return devices;
    } catch (error: any) {
      this.log(`扫描失败: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 连接蓝牙设备
   * 类似于C语言中的函数，连接指定的蓝牙设备
   * 
   * @param device 要连接的设备
   */
  async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      this.log(`正在连接设备: ${device.name} (${device.id})...`);
      
      const connected = await this.tryConnect(device.id);
      this.connectedDevice = connected || { id: device.id, name: device.name };
      this.log('设备连接成功');

      this.isConnected = true;
      this.reconnectAttempts = 0;  // 重置重连次数
      
      // 启动周期性数据发送（5ms周期）
      this.startPeriodicSend();
      
      return true;
    } catch (error: any) {
      this.log(`连接失败: ${error.message}`);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * 断开连接
   */
  async disconnect() {
    try {
      // 停止周期性发送
      this.stopPeriodicSend();
      
      if (this.connectedDevice) {
        await this.tryDisconnect(this.connectedDevice.id);
        this.log('已断开连接');
      }
      
      this.connectedDevice = null;
      this.isConnected = false;
    } catch (error: any) {
      this.log(`断开连接失败: ${error.message}`);
    }
  }
  
  /**
   * 更新控制数据
   * 由UI组件调用，更新摇杆和按键状态
   */
  updateControlData(data: Partial<ControlData>) {
    this.controlData = { ...this.controlData, ...data };
  }
  
  /**
   * 生成8字节数据包
   * 数据包格式：
   * 字节0: 左摇杆数值（0-255）
   * 字节1: 右摇杆数值（0-255）
   * 字节2: 红色按键状态（0x00/0x01）
   * 字节3: 蓝色按键状态（0x00/0x02）
   * 字节4: 绿色按键状态（0x00/0x03）
   * 字节5: 黄色按键状态（0x00/0x04）
   * 字节6: 校验位1（字节0-5的异或结果）
   * 字节7: 校验位2（字节6异或0x55）
   */
  private generateDataPacket(): Uint8Array {
    const { leftJoystick, rightJoystick, redButton, blueButton, greenButton, yellowButton } = this.controlData;
    
    // 字节0-5：控制数据
    const byte0 = leftJoystick;
    const byte1 = rightJoystick;
    const byte2 = redButton;
    const byte3 = blueButton;
    const byte4 = greenButton;
    const byte5 = yellowButton;
    
    // 字节6：校验位1（字节0-5的异或结果）
    // 类似于C语言中的按位异或操作 (^)
    const byte6 = byte0 ^ byte1 ^ byte2 ^ byte3 ^ byte4 ^ byte5;
    
    // 字节7：校验位2（字节6异或固定值0x55）
    const byte7 = byte6 ^ 0x55;
    
    // 组装8字节数据包
    const packet = new Uint8Array([byte0, byte1, byte2, byte3, byte4, byte5, byte6, byte7]);
    
    return packet;
  }
  
  /**
   * 发送数据包
   * 类似于C语言中的串口发送函数
   */
  private async sendData() {
    if (!this.isConnected || !this.connectedDevice) {
      return;
    }
    
    try {
      const packet = this.generateDataPacket();
      
      // 将字节数组转换为16进制字符串（用于调试日志）
      const hexString = Array.from(packet)
        .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      this.log(`发送数据: ${hexString}`);
      
      const payload = this.uint8ArrayToBinaryString(packet);
      await this.tryWrite(this.connectedDevice.id, payload);
    } catch (error: any) {
      this.log(`发送数据失败: ${error.message}`);
      this.handleDisconnection();
    }
  }
  
  /**
   * 启动周期性数据发送（5ms周期）
   * 类似于C语言中的定时器中断
   */
  private startPeriodicSend() {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
    }
    
    // 每5ms发送一次数据
    // 类似于C语言中的setInterval()函数
    this.sendTimer = setInterval(() => {
      this.sendData();
    }, 5);
    
    this.log('已启动周期性数据发送（5ms）');
  }
  
  /**
   * 停止周期性数据发送
   */
  private stopPeriodicSend() {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
      this.log('已停止周期性数据发送');
    }
  }
  
  /**
   * 处理断线重连
   * 类似于C语言中的错误处理和重试逻辑
   */
  private async handleDisconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('断线重连失败，已达到最大重连次数（3次）');
      this.isConnected = false;
      this.stopPeriodicSend();
      return;
    }
    
    this.reconnectAttempts++;
    this.log(`蓝牙断线，正在尝试重连（第 ${this.reconnectAttempts} 次）...`);
    
    // 等待1秒后重连
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (this.connectedDevice) {
      try {
        const success = await this.connectToDevice(this.connectedDevice);
        if (success) {
          this.log('重连成功');
        } else {
          this.handleDisconnection();  // 继续重连
        }
      } catch (error) {
        this.handleDisconnection();  // 继续重连
      }
    }
  }
  
  /**
   * 获取连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  /**
   * Uint8Array转Base64字符串
   * 类似于C语言中的base64编码函数
   * 
   * @param data 字节数组
   * @returns Base64字符串
   */
  private normalizeDevice(device: any): BluetoothDevice | null {
    if (!device) {
      return null;
    }

    const id = device.id || device.address || device.macAddress || device.identifier;
    if (!id) {
      return null;
    }

    return {
      id,
      name: device.name || device.deviceName,
      address: device.address || device.macAddress,
    };
  }

  private async discoverDevices(duration: number): Promise<any[]> {
    if (typeof BluetoothClassic.startDiscovery === 'function') {
      return await BluetoothClassic.startDiscovery();
    }

    if (typeof BluetoothClassic.getBondedDevices === 'function') {
      return await BluetoothClassic.getBondedDevices();
    }

    if (typeof BluetoothClassic.getPairedDevices === 'function') {
      return await BluetoothClassic.getPairedDevices();
    }

    await new Promise(resolve => setTimeout(resolve, duration));
    return [];
  }

  private async tryConnect(deviceId: string): Promise<BluetoothDevice | null> {
    if (typeof BluetoothClassic.connectToDevice === 'function') {
      return await BluetoothClassic.connectToDevice(deviceId);
    }

    if (typeof BluetoothClassic.connect === 'function') {
      return await BluetoothClassic.connect(deviceId);
    }

    if (typeof BluetoothClassic.connectToDeviceAddress === 'function') {
      return await BluetoothClassic.connectToDeviceAddress(deviceId);
    }

    throw new Error('当前蓝牙库不支持连接方法');
  }

  private async tryDisconnect(deviceId: string): Promise<void> {
    if (typeof BluetoothClassic.disconnectFromDevice === 'function') {
      await BluetoothClassic.disconnectFromDevice(deviceId);
      return;
    }

    if (typeof BluetoothClassic.disconnect === 'function') {
      await BluetoothClassic.disconnect(deviceId);
      return;
    }
  }

  private async tryWrite(deviceId: string, payload: string): Promise<void> {
    const connectedDevice = this.connectedDevice as any;
    if (connectedDevice && typeof connectedDevice.write === 'function') {
      await connectedDevice.write(payload);
      return;
    }

    if (typeof BluetoothClassic.writeToDevice === 'function') {
      await BluetoothClassic.writeToDevice(deviceId, payload);
      return;
    }

    if (typeof BluetoothClassic.write === 'function') {
      await BluetoothClassic.write(payload);
      return;
    }

    throw new Error('当前蓝牙库不支持写入方法');
  }

  private uint8ArrayToBinaryString(data: Uint8Array): string {
    return Array.from(data)
      .map((byte) => String.fromCharCode(byte))
      .join('');
  }
  
  /**
   * 销毁蓝牙管理器
   * 类似于C语言中的资源释放函数
   */
  destroy() {
    this.disconnect();
  }
}

// 导出单例实例
// 类似于Python中的单例模式
export const BluetoothService = new BluetoothServiceClass();
