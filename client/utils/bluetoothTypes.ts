export interface BluetoothDevice {
  id: string;           // 设备唯一标识（常见为MAC地址）
  name?: string;        // 设备名称
  address?: string;     // 设备地址（部分库会提供）
}
