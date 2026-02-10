/**
 * 数据包工具函数
 * 
 * C/Python对应理解：
 * - 相当于C语言的 struct DataPacket { uint8_t bytes[8]; }
 * - 相当于Python的类 DataPacket: ...
 * 
 * 数据包格式（固定8字节）：
 * 字节0：左摇杆数值（0-255）
 * 字节1：右摇杆数值（0-255）
 * 字节2：红色按键状态（0x00/0x01）
 * 字节3：蓝色按键状态（0x00/0x02）
 * 字节4：绿色按键状态（0x00/0x03）
 * 字节5：黄色按键状态（0x00/0x04）
 * 字节6：校验位1（字节0-5的异或结果）
 * 字节7：校验位2（字节6异或固定值0x55）
 * 可选：发送端可在8字节包后单独追加换行分隔符（0x0A 或 0x0D 0x0A），
 *      接收端若支持可忽略或作为分隔符处理。
 */

export interface ControlData {
  leftJoystick: number;    // 左摇杆数值（0-255）
  rightJoystick: number;   // 右摇杆数值（0-255）
  redButton: number;       // 红色按键（0x00/0x01）
  blueButton: number;      // 蓝色按键（0x00/0x02）
  greenButton: number;     // 绿色按键（0x00/0x03）
  yellowButton: number;    // 黄色按键（0x00/0x04）
}

/**
 * 组装数据包
 * 
 * C/Python对应理解：
 * - C语言: void createPacket(ControlData* data, uint8_t* packet)
 * - Python: def create_packet(data: ControlData) -> bytes: ...
 * 
 * 算法说明：
 * 1. 将6个字节数据填充到数据包的前6个字节
 * 2. 计算校验位1：字节0-5的异或结果
 * 3. 计算校验位2：字节6异或固定值0x55
 * 4. 返回8字节数据包
 * 
 * @param data - 控制数据结构
 * @returns 8字节的Uint8Array数据包
 */
export function createDataPacket(data: ControlData): Uint8Array {
  const packet = new Uint8Array(8);

  // 填充数据（字节0-5）
  packet[0] = data.leftJoystick;   // 左摇杆
  packet[1] = data.rightJoystick;  // 右摇杆
  packet[2] = data.redButton;      // 红色按键
  packet[3] = data.blueButton;     // 蓝色按键
  packet[4] = data.greenButton;    // 绿色按键
  packet[5] = data.yellowButton;   // 黄色按键

  // 计算校验位1（字节6）
  // 相当于C语言的: checksum1 = b0 ^ b1 ^ b2 ^ b3 ^ b4 ^ b5;
  // 相当于Python的: checksum1 = bytes[0] ^ bytes[1] ^ bytes[2] ^ bytes[3] ^ bytes[4] ^ bytes[5]
  let checksum1 = 0;
  for (let i = 0; i < 6; i++) {
    checksum1 ^= packet[i];
  }
  packet[6] = checksum1;

  // 计算校验位2（字节7）
  // 相当于C语言的: checksum2 = checksum1 ^ 0x55;
  // 相当于Python的: checksum2 = checksum1 ^ 0x55
  packet[7] = packet[6] ^ 0x55;

  return packet;
}

/**
 * 格式化数据包为十六进制字符串（用于调试日志）
 * 
 * C/Python对应理解：
 * - C语言: void formatPacketHex(uint8_t* packet, char* buffer)
 * - Python: def format_packet_hex(packet: bytes) -> str: ...
 * 
 * @param packet - 8字节数据包
 * @returns 十六进制字符串（例如："7F 7F 00 00 00 00 7F 2A"）
 */
export function formatPacketHex(packet: Uint8Array): string {
  return Array.from(packet)
    .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

/**
 * 验证数据包校验位
 * 
 * C/Python对应理解：
 * - C语言: bool validatePacket(uint8_t* packet)
 * - Python: def validate_packet(packet: bytes) -> bool: ...
 * 
 * 算法说明：
 * 1. 重新计算校验位1
 * 2. 重新计算校验位2
 * 3. 比较计算值与数据包中的值是否一致
 * 
 * @param packet - 8字节数据包
 * @returns true表示校验通过，false表示校验失败
 */
export function validatePacket(packet: Uint8Array): boolean {
  if (packet.length !== 8) {
    return false;
  }

  // 重新计算校验位1
  let checksum1 = 0;
  for (let i = 0; i < 6; i++) {
    checksum1 ^= packet[i];
  }

  // 重新计算校验位2
  const checksum2 = checksum1 ^ 0x55;

  // 比较校验位
  return packet[6] === checksum1 && packet[7] === checksum2;
}

/**
 * 创建默认控制数据（中立位）
 * 
 * C/Python对应理解：
 * - C语言: ControlData getDefaultData() { ... }
 * - Python: def get_default_data() -> ControlData: ...
 * 
 * @returns 默认控制数据（两个摇杆都在中立位127，所有按键未按下）
 */
export function getDefaultControlData(): ControlData {
  return {
    leftJoystick: 127,  // 中立位
    rightJoystick: 127, // 中立位
    redButton: 0x00,    // 未按下
    blueButton: 0x00,   // 未按下
    greenButton: 0x00,  // 未按下
    yellowButton: 0x00, // 未按下
  };
}
