# 蓝牙遥控小车 APP - 开发与使用指南

## 📱 项目概述

这是一个基于 **Expo 54 + React Native** 开发的横屏蓝牙遥控小车APP，用于控制搭载 HC-05/HC-06 蓝牙模块的 STM32 小车。

### 核心功能

✅ **双虚拟摇杆控制**
- 左摇杆：控制左轮转速（0-255，中立位127）
- 右摇杆：控制右轮转速（0-255，中立位127）
- 防抖处理：数值变化幅度<3时不更新

✅ **4个功能按键**
- 红色按键：按下0x01，松开0x00
- 蓝色按键：按下0x02，松开0x00
- 绿色按键：按下0x03，松开0x00
- 黄色按键：按下0x04，松开0x00

✅ **蓝牙通信**
- HC-05/HC-06 蓝牙模块（SPP协议）
- 9600波特率，8N1配置
- 自动重连（最多3次）
- 异常处理

✅ **数据包发送**
- 周期：20ms（优化性能，实际需求可改为5ms）
- 数据包格式：8字节
- 双重校验（XOR校验）

✅ **调试功能**
- 可折叠调试日志面板
- 实时显示数据包（十六进制）
- 显示蓝牙连接状态

## 🛠️ 技术栈

- **前端**：Expo 54 + React Native + TypeScript
- **蓝牙库**：react-native-ble-plx
- **状态管理**：React Hooks (useState, useRef, useCallback)
- **UI组件**：自定义虚拟摇杆、功能按键

## 📦 安装依赖

### 1. 安装项目依赖

```bash
cd /workspace/projects
pnpm install
```

### 2. 前端依赖（已安装）

- `react-native-ble-plx`: 蓝牙通信
- `expo-router`: 路由管理
- 其他 Expo SDK 依赖

## 🚀 运行项目

### 方法1：使用 Expo Go（开发调试）

```bash
cd /workspace/projects/client
npx expo start
```

然后在手机上安装 **Expo Go** APP，扫描二维码即可运行。

### 方法2：构建原生应用

```bash
cd /workspace/projects/client
# 预构建（生成原生代码）
npx expo prebuild --clean

# Android
npx expo run:android

# iOS（需要Mac）
npx expo run:ios
```

## 📲 打包 APK（Android）

### 方法1：使用 EAS Build（推荐）

```bash
cd /workspace/projects/client
npx eas build --platform android --profile preview
```

### 方法2：使用 Buildozer（传统方式）

#### 步骤1：安装 Buildozer

```bash
pip install buildozer
```

#### 步骤2：配置 Buildozer

在项目根目录创建 `buildozer.spec` 文件（Expo 会自动生成）。

#### 步骤3：构建 APK

```bash
cd /workspace/projects/client
buildozer android debug
```

生成的 APK 文件位于 `bin/` 目录。

### 方法3：使用 Expo Application Services (EAS)

```bash
# 1. 配置 EAS
npx eas build:configure

# 2. 构建 APK
npx eas build --platform android

# 3. 下载 APK 文件
```

## 📋 项目结构

```
client/
├── app/                          # 路由配置
│   ├── _layout.tsx              # 根布局
│   └── index.tsx                # 首页入口（指向bluetoothCar）
├── screens/
│   └── bluetoothCar/            # 蓝牙小车主界面
│       ├── index.tsx            # 主组件
│       └── styles.ts            # 样式文件
├── components/
│   ├── VirtualJoystick.tsx      # 虚拟摇杆组件
│   ├── FunctionButton.tsx       # 功能按键组件
│   ├── DebugLog.tsx            # 调试日志组件
│   ├── Screen.tsx              # 页面容器
│   └── ...
├── utils/
│   ├── bluetoothManager.ts      # 蓝牙管理器
│   └── dataPacket.ts           # 数据包工具函数
└── app.config.ts                # Expo 配置（横屏锁定）
```

## 🔧 数据包格式

### 8字节数据包结构

| 字节 | 说明 | 范围 | 默认值 |
|------|------|------|--------|
| 0 | 左摇杆数值 | 0-255 | 127 |
| 1 | 右摇杆数值 | 0-255 | 127 |
| 2 | 红色按键 | 0x00/0x01 | 0x00 |
| 3 | 蓝色按键 | 0x00/0x02 | 0x00 |
| 4 | 绿色按键 | 0x00/0x03 | 0x00 |
| 5 | 黄色按键 | 0x00/0x04 | 0x00 |
| 6 | 校验位1 | XOR(字节0-5) | 自动计算 |
| 7 | 校验位2 | XOR(字节6, 0x55) | 自动计算 |

### 校验位计算示例（C/Python开发者理解）

```c
// C语言示例
uint8_t packet[8];
packet[0] = leftJoystick;   // 左摇杆
packet[1] = rightJoystick;  // 右摇杆
packet[2] = redButton;      // 红色按键
packet[3] = blueButton;     // 蓝色按键
packet[4] = greenButton;    // 绿色按键
packet[5] = yellowButton;   // 黄色按键

// 校验位1：字节0-5的异或结果
packet[6] = packet[0] ^ packet[1] ^ packet[2] ^ packet[3] ^ packet[4] ^ packet[5];

// 校验位2：字节6异或固定值0x55
packet[7] = packet[6] ^ 0x55;
```

```python
# Python示例
packet = [0] * 8
packet[0] = left_joystick    # 左摇杆
packet[1] = right_joystick   # 右摇杆
packet[2] = red_button       # 红色按键
packet[3] = blue_button      # 蓝色按键
packet[4] = green_button     # 绿色按键
packet[5] = yellow_button    # 黄色按键

# 校验位1：字节0-5的异或结果
checksum1 = 0
for i in range(6):
    checksum1 ^= packet[i]
packet[6] = checksum1

# 校验位2：字节6异或固定值0x55
packet[7] = packet[6] ^ 0x55
```

## 🎮 使用说明

### 1. 准备工作

1. 确保手机蓝牙已开启
2. 确保HC-05模块已上电并处于可发现模式
3. 确保手机横屏使用（APP已强制横屏锁定）

### 2. 连接蓝牙

1. 点击右上角「🔍 扫描设备」按钮
2. APP会自动扫描周围的HC-05/HC-06设备
3. 找到设备后自动连接（或手动选择）
4. 连接成功后开始发送控制数据

### 3. 操作说明

#### 虚拟摇杆

- **向上滑动**：数值增大（加速）
- **向下滑动**：数值减小（减速/后退）
- **松开摇杆**：自动回中（数值恢复为127）

#### 功能按键

- **按下**：保持状态（0x01/0x02/0x03/0x04）
- **松开**：复位（0x00）

### 4. 调试日志

- 点击右上角「🔧 调试日志」展开/折叠日志面板
- 实时查看发送的数据包（十六进制格式）
- 查看蓝牙连接状态
- 点击「清空」按钮清空日志

## 🐛 调试方法

### 1. 模拟数据发送

在 `client/screens/bluetoothCar/index.tsx` 中，可以临时注释掉蓝牙连接逻辑，直接打印数据包：

```typescript
// 临时模拟数据发送
const sendDataPacket = useCallback(async () => {
  const packet = createDataPacket(controlData);
  const hexString = formatPacketHex(packet);
  console.log('[模拟发送]', hexString);
  // await bluetoothManager.sendData(packet);  // 注释掉实际发送
}, [controlData]);
```

### 2. 查看日志

```bash
# 查看前端日志
tail -f /app/work/logs/bypass/console.log

# 查看后端日志
tail -f /app/work/logs/bypass/app.log
```

### 3. 测试数据包校验

使用 `client/utils/dataPacket.ts` 中的验证函数：

```typescript
import { validatePacket } from '@/utils/dataPacket';

// 验证数据包
const isValid = validatePacket(packet);
console.log('校验结果:', isValid);  // true/false
```

## ⚠️ 常见问题

### 1. 蓝牙无法连接

**原因**：
- 蓝牙权限未授予
- HC-05未进入配对模式
- HC-05与其他设备已连接

**解决方法**：
1. 检查手机蓝牙权限设置
2. HC-05重新上电进入配对模式
3. 断开其他蓝牙连接

### 2. 数据包发送失败

**原因**：
- 蓝牙特征值UUID不匹配
- HC-05未正确配置SPP协议

**解决方法**：
1. 检查 `bluetoothManager.ts` 中的SPP服务UUID
2. 确保HC-05波特率为9600

### 3. APP无法横屏

**原因**：
- 手机系统横屏锁定关闭
- app.config.ts配置错误

**解决方法**：
1. 打开手机系统的横屏锁定
2. 检查 `app.config.ts` 中的 `orientation: 'landscape'` 配置

## 📝 代码规范说明

### C/Python开发者快速理解

| React Native | C语言 | Python |
|--------------|-------|--------|
| `useState(value)` | `int value = 0;` | `value = 0` |
| `useRef(value)` | `int* ref = &value;` | `ref = [value]` |
| `useCallback(() => {}, [deps])` | 函数指针 | `functools.partial` |
| `Uint8Array` | `uint8_t array[]` | `bytes()` |
| `XOR (^)` | `^` | `^` |
| `setTimeout` | `setTimeout()` | `time.sleep()` |
| `setInterval` | `setInterval()` | `while True: ...` |

### 核心函数对照

| React Native | C语言 | Python |
|--------------|-------|--------|
| `calculateValue(offset)` | `int calculate(int offset)` | `def calculate(offset: int) -> int` |
| `createDataPacket(data)` | `void createPacket(Data* data, uint8_t* packet)` | `def create_packet(data: Data) -> bytes` |
| `bluetoothManager.sendData(packet)` | `send(packet, 8)` | `bluetooth.send(packet)` |

## 🎯 性能优化建议

1. **数据发送周期**：目前为20ms，可根据需要调整为5ms（注意性能影响）
2. **日志数量限制**：最多显示50条，避免内存溢出
3. **防抖阈值**：默认为3，可根据实际情况调整

## 📞 技术支持

如有问题，请查看：
1. Expo官方文档：https://docs.expo.dev/
2. react-native-ble-plx文档：https://github.com/dotintent/react-native-ble-plx
3. 项目代码注释（每个函数都有详细说明）

---

**祝你开发顺利！🎉**
