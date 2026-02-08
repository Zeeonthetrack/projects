import BluetoothClassic from 'react-native-bluetooth-classic';
import { BluetoothDevice } from '@/utils/bluetoothTypes';

/**
 * 蓝牙管理器 - HC-05 SPP协议适配
 * 
 * C/Python对应理解：
 * - 相当于C语言的 struct BluetoothManager { ... }
 * - 相当于Python的 class BluetoothManager:
 * 
 * 功能说明：
 * - 扫描HC-05蓝牙设备
 * - 连接/断开设备
 * - 发送数据（通过SPP串口）
 * - 自动重连（最多3次）
 * - 异常处理
 * 
 * HC-05配置参数：
 * - 波特率：9600
 * - 数据位：8
 * - 停止位：1
 * - 校验位：无
 */

export class BluetoothManager {
  private connectedDevice: BluetoothDevice | null = null;  // 当前连接的设备
  private retryCount: number = 0;  // 重连次数计数器
  private maxRetries: number = 3;  // 最大重连次数
  private isScanning: boolean = false;  // 是否正在扫描

  /**
   * 构造函数 - 初始化蓝牙管理器
   * 
   * C/Python对应理解：
   * - C语言: BluetoothManager* createManager() { ... }
   * - Python: def __init__(self): ...
   */
  constructor() {}

  /**
   * 扫描蓝牙设备
   * 
   * C/Python对应理解：
   * - C语言: void scanDevices(void (*callback)(Device*))
   * - Python: def scan_devices(callback): ...
   * 
   * @param onDeviceFound - 找到设备时的回调函数
   * @param timeout - 扫描超时时间（秒），默认5秒
   */
  public async scanDevices(
    onDeviceFound: (device: BluetoothDevice) => void,
    timeout: number = 5
  ): Promise<void> {
    if (this.isScanning) {
      console.log('[蓝牙] 已经在扫描中，请勿重复调用');
      return;
    }

    this.isScanning = true;
    console.log('[蓝牙] 开始扫描设备...');

    try {
      const devices = await this.discoverDevices(timeout);
      devices.forEach((device) => {
        const normalized = this.normalizeDevice(device);
        if (normalized) {
          console.log('[蓝牙] 发现设备:', normalized.name || normalized.id);
          onDeviceFound(normalized);
        }
      });
      this.isScanning = false;
      console.log('[蓝牙] 扫描完成');

    } catch (error) {
      console.error('[蓝牙] 扫描失败:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * 停止扫描
   * 
   * C/Python对应理解：
   * - C语言: void stopScan()
   * - Python: def stop_scan(): ...
   */
  public stopScan(): void {
    if (this.isScanning) {
      this.isScanning = false;
      console.log('[蓝牙] 停止扫描');
    }
  }

  /**
   * 连接蓝牙设备
   * 
   * C/Python对应理解：
   * - C语言: bool connectDevice(char* deviceId)
   * - Python: def connect_device(device_id: str) -> bool: ...
   * 
   * @param deviceId - 设备ID
   * @param onConnected - 连接成功回调
   * @param onDisconnected - 断开连接回调
   */
  public async connect(
    deviceId: string,
    onConnected?: () => void,
    onDisconnected?: () => void
  ): Promise<void> {
    try {
      console.log('[蓝牙] 正在连接设备:', deviceId);

      // 停止扫描（如果正在扫描）
      this.stopScan();

      // 连接设备
      const device = await this.tryConnect(deviceId);
      this.connectedDevice = device || { id: deviceId };
      this.retryCount = 0;  // 重置重连计数

      if (onConnected) {
        onConnected();
      }

    } catch (error) {
      console.error('[蓝牙] 连接失败:', error);
      throw error;
    }
  }

  /**
   * 断开设备连接
   * 
   * C/Python对应理解：
   * - C语言: void disconnect()
   * - Python: def disconnect(): ...
   */
  public async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.tryDisconnect(this.connectedDevice.id);
        this.connectedDevice = null;
        this.retryCount = 0;
        console.log('[蓝牙] 设备已断开连接');
      } catch (error) {
        console.error('[蓝牙] 断开连接失败:', error);
      }
    }
  }

  /**
   * 发送数据
   * 
   * C/Python对应理解：
   * - C语言: bool sendData(uint8_t* data, int length)
   * - Python: def send_data(data: bytes) -> bool: ...
   * 
   * @param data - 要发送的字节数组（Uint8Array）
   */
  public async sendData(data: Uint8Array): Promise<void> {
    if (!this.connectedDevice) {
      console.warn('[蓝牙] 设备未连接，无法发送数据');
      return;
    }

    try {
      console.log('[蓝牙] 发送数据:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));

      const payload = this.uint8ArrayToBinaryString(data);
      await this.tryWrite(this.connectedDevice.id, payload);
      console.log('[蓝牙] 数据发送成功');
    } catch (error) {
      console.error('[蓝牙] 发送数据失败:', error);
      throw error;
    }
  }

  /**
   * 自动重连
   * 
   * C/Python对应理解：
   * - C语言: void autoReconnect()
   * - Python: def auto_reconnect(): ...
   * 
   * 最多重连3次，每次间隔2秒
   */
  private async autoReconnect(
    deviceId: string,
    onConnected?: () => void,
    onDisconnected?: () => void
  ): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      console.log('[蓝牙] 已达到最大重连次数，停止重连');
      return;
    }

    this.retryCount++;
    console.log(`[蓝牙] 尝试重连 (${this.retryCount}/${this.maxRetries})...`);

    // 延迟2秒后重连
    setTimeout(async () => {
      try {
        await this.connect(deviceId, onConnected, onDisconnected);
      } catch (error) {
        console.error('[蓝牙] 重连失败:', error);
        // 继续尝试重连
        this.autoReconnect(deviceId, onConnected, onDisconnected);
      }
    }, 2000);
  }

  /**
   * 获取连接状态
   * 
   * C/Python对应理解：
   * - C语言: bool isConnected()
   * - Python: def is_connected() -> bool: ...
   */
  public isConnected(): boolean {
    return this.connectedDevice !== null;
  }

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

  private async discoverDevices(timeout: number): Promise<any[]> {
    if (typeof BluetoothClassic.startDiscovery === 'function') {
      return await BluetoothClassic.startDiscovery();
    }

    if (typeof BluetoothClassic.getBondedDevices === 'function') {
      return await BluetoothClassic.getBondedDevices();
    }

    if (typeof BluetoothClassic.getPairedDevices === 'function') {
      return await BluetoothClassic.getPairedDevices();
    }

    await new Promise(resolve => setTimeout(resolve, timeout * 1000));
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
   * 
   * C/Python对应理解：
   * - C语言: void destroyManager(BluetoothManager* manager)
   * - Python: def __del__(self): ...
   */
  public destroy(): void {
    void this.disconnect();
  }
}
