import { LayoutElement } from '@/components/LayoutEditor';

/**
 * 元素布局方案
 */
export interface ElementLayoutScheme {
  id: string;
  name: string;
  description?: string;
  elements: LayoutElement[];
  isPreset?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 预设方案
 */
export const DEFAULT_LAYOUT_SCHEMES: Record<string, ElementLayoutScheme> = {
  default: {
    id: 'default',
    name: '默认布局',
    isPreset: true,
    description: '标准键位布局',
    elements: [
      // 左摇杆
      {
        id: 'joystick-left',
        x: 5,
        y: 35,
        width: 35,
        height: 40,
        type: 'joystick',
        label: '左摇杆',
      },
      // 右摇杆
      {
        id: 'joystick-right',
        x: 60,
        y: 35,
        width: 35,
        height: 40,
        type: 'joystick',
        label: '右摇杆',
      },
      // 按键行
      {
        id: 'button-red',
        x: 10,
        y: 5,
        width: 12,
        height: 12,
        type: 'button',
        label: '红灯',
      },
      {
        id: 'button-blue',
        x: 28,
        y: 5,
        width: 12,
        height: 12,
        type: 'button',
        label: '蓝灯',
      },
      {
        id: 'button-green',
        x: 46,
        y: 5,
        width: 12,
        height: 12,
        type: 'button',
        label: '绿灯',
      },
      {
        id: 'button-yellow',
        x: 64,
        y: 5,
        width: 12,
        height: 12,
        type: 'button',
        label: '黄灯',
      },
      // 数据包显示
      {
        id: 'packet-display',
        x: 5,
        y: 20,
        width: 90,
        height: 10,
        type: 'packet',
        label: '数据包',
      },
      // 调试日志
      {
        id: 'debug-log',
        x: 5,
        y: 80,
        width: 90,
        height: 15,
        type: 'log',
        label: '调试日志',
      },
    ],
  },

  compact: {
    id: 'compact',
    name: '紧凑布局',
    isPreset: true,
    description: '节省空间的布局',
    elements: [
      // 缩小的摇杆
      {
        id: 'joystick-left',
        x: 3,
        y: 40,
        width: 28,
        height: 32,
        type: 'joystick',
        label: '左摇杆',
      },
      {
        id: 'joystick-right',
        x: 69,
        y: 40,
        width: 28,
        height: 32,
        type: 'joystick',
        label: '右摇杆',
      },
      // 紧凑的按键
      {
        id: 'button-red',
        x: 35,
        y: 5,
        width: 10,
        height: 10,
        type: 'button',
        label: '红灯',
      },
      {
        id: 'button-blue',
        x: 48,
        y: 5,
        width: 10,
        height: 10,
        type: 'button',
        label: '蓝灯',
      },
      {
        id: 'button-green',
        x: 35,
        y: 18,
        width: 10,
        height: 10,
        type: 'button',
        label: '绿灯',
      },
      {
        id: 'button-yellow',
        x: 48,
        y: 18,
        width: 10,
        height: 10,
        type: 'button',
        label: '黄灯',
      },
      // 压缩的数据包显示
      {
        id: 'packet-display',
        x: 3,
        y: 30,
        width: 94,
        height: 8,
        type: 'packet',
        label: '数据包',
      },
      // 隐藏日志（左下角）
      {
        id: 'debug-log',
        x: 3,
        y: 75,
        width: 20,
        height: 22,
        type: 'log',
        label: '日志',
      },
    ],
  },

  spacious: {
    id: 'spacious',
    name: '宽敞布局',
    isPreset: true,
    description: '更大的控件，易于点击',
    elements: [
      {
        id: 'joystick-left',
        x: 2,
        y: 30,
        width: 40,
        height: 50,
        type: 'joystick',
        label: '左摇杆',
      },
      {
        id: 'joystick-right',
        x: 58,
        y: 30,
        width: 40,
        height: 50,
        type: 'joystick',
        label: '右摇杆',
      },
      {
        id: 'button-red',
        x: 8,
        y: 3,
        width: 14,
        height: 14,
        type: 'button',
        label: '红灯',
      },
      {
        id: 'button-blue',
        x: 28,
        y: 3,
        width: 14,
        height: 14,
        type: 'button',
        label: '蓝灯',
      },
      {
        id: 'button-green',
        x: 58,
        y: 3,
        width: 14,
        height: 14,
        type: 'button',
        label: '绿灯',
      },
      {
        id: 'button-yellow',
        x: 78,
        y: 3,
        width: 14,
        height: 14,
        type: 'button',
        label: '黄灯',
      },
      {
        id: 'packet-display',
        x: 2,
        y: 22,
        width: 96,
        height: 6,
        type: 'packet',
        label: '数据包',
      },
      {
        id: 'debug-log',
        x: 2,
        y: 83,
        width: 96,
        height: 15,
        type: 'log',
        label: '调试日志',
      },
    ],
  },
};

/**
 * 获取默认方案
 */
export function getDefaultLayoutScheme(): ElementLayoutScheme {
  return DEFAULT_LAYOUT_SCHEMES.default;
}

/**
 * 验证布局方案
 */
export function validateLayoutScheme(scheme: any): scheme is ElementLayoutScheme {
  return (
    scheme &&
    typeof scheme.id === 'string' &&
    typeof scheme.name === 'string' &&
    Array.isArray(scheme.elements) &&
    scheme.elements.every((el: any) =>
      typeof el.id === 'string' &&
      typeof el.x === 'number' &&
      typeof el.y === 'number' &&
      typeof el.width === 'number' &&
      typeof el.height === 'number' &&
      ['joystick', 'button', 'packet', 'log'].includes(el.type) &&
      typeof el.label === 'string'
    )
  );
}

/**
 * 克隆方案（用于自定义）
 */
export function cloneLayoutScheme(scheme: ElementLayoutScheme, newName: string): ElementLayoutScheme {
  return {
    ...scheme,
    id: `custom-${Date.now()}`,
    name: newName,
    isPreset: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: scheme.elements.map(el => ({ ...el })),
  };
}
