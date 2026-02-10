import AsyncStorage from '@react-native-async-storage/async-storage';
import { ElementLayoutScheme, DEFAULT_LAYOUT_SCHEMES, validateLayoutScheme } from './layoutSchemes';

const LAYOUT_SCHEMES_STORAGE_KEY = 'bluetoothCar_layoutSchemes';
const CURRENT_SCHEME_ID_KEY = 'bluetoothCar_currentSchemeId';

/**
 * 布局方案管理器
 * 负责保存、加载、删除布局方案
 */
export class LayoutSchemeManager {
  /**
   * 获取所有布局方案（包括预设和自定义）
   */
  static async getAllSchemes(): Promise<ElementLayoutScheme[]> {
    try {
      // 获取自定义方案
      const customSchemesJson = await AsyncStorage.getItem(LAYOUT_SCHEMES_STORAGE_KEY);
      const customSchemes: ElementLayoutScheme[] = customSchemesJson ? JSON.parse(customSchemesJson) : [];

      // 验证自定义方案
      const validCustomSchemes = customSchemes.filter(scheme => validateLayoutScheme(scheme));

      // 合并预设方案和自定义方案
      const presetSchemes = Object.values(DEFAULT_LAYOUT_SCHEMES);
      return [...presetSchemes, ...validCustomSchemes];
    } catch (error) {
      console.warn('[LayoutSchemeManager] 获取方案失败，返回预设方案', error);
      return Object.values(DEFAULT_LAYOUT_SCHEMES);
    }
  }

  /**
   * 根据ID获取方案
   */
  static async getSchemeById(id: string): Promise<ElementLayoutScheme | null> {
    const schemes = await this.getAllSchemes();
    return schemes.find(s => s.id === id) || null;
  }

  /**
   * 获取当前活跃的方案
   */
  static async getCurrentScheme(): Promise<ElementLayoutScheme> {
    try {
      const currentId = await AsyncStorage.getItem(CURRENT_SCHEME_ID_KEY);
      if (currentId) {
        const scheme = await this.getSchemeById(currentId);
        if (scheme) return scheme;
      }
    } catch (error) {
      console.warn('[LayoutSchemeManager] 获取当前方案失败', error);
    }

    // 返回默认方案
    return DEFAULT_LAYOUT_SCHEMES.default;
  }

  /**
   * 保存新方案或更新现有方案
   */
  static async saveScheme(scheme: ElementLayoutScheme): Promise<void> {
    if (!validateLayoutScheme(scheme)) {
      throw new Error('无效的方案格式');
    }

    try {
      // 如果是预设方案，不允许修改
      if (scheme.isPreset) {
        throw new Error('无法修改预设方案，请创建新的自定义方案');
      }

      // 获取现有的自定义方案
      const customSchemesJson = await AsyncStorage.getItem(LAYOUT_SCHEMES_STORAGE_KEY);
      const customSchemes: ElementLayoutScheme[] = customSchemesJson ? JSON.parse(customSchemesJson) : [];

      // 检查是否已存在相同ID的方案
      const existingIndex = customSchemes.findIndex(s => s.id === scheme.id);
      if (existingIndex >= 0) {
        customSchemes[existingIndex] = {
          ...scheme,
          updatedAt: Date.now(),
        };
      } else {
        customSchemes.push({
          ...scheme,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // 保存回storage
      await AsyncStorage.setItem(LAYOUT_SCHEMES_STORAGE_KEY, JSON.stringify(customSchemes));
    } catch (error) {
      console.error('[LayoutSchemeManager] 保存方案失败', error);
      throw error;
    }
  }

  /**
   * 删除自定义方案
   */
  static async deleteScheme(id: string): Promise<void> {
    try {
      // 不允许删除预设方案
      if (Object.keys(DEFAULT_LAYOUT_SCHEMES).includes(id)) {
        throw new Error('无法删除预设方案');
      }

      // 获取自定义方案
      const customSchemesJson = await AsyncStorage.getItem(LAYOUT_SCHEMES_STORAGE_KEY);
      let customSchemes: ElementLayoutScheme[] = customSchemesJson ? JSON.parse(customSchemesJson) : [];

      // 删除指定ID的方案
      customSchemes = customSchemes.filter(s => s.id !== id);

      // 保存回storage
      await AsyncStorage.setItem(LAYOUT_SCHEMES_STORAGE_KEY, JSON.stringify(customSchemes));

      // 如果删除的是当前方案，切换到默认方案
      const currentId = await AsyncStorage.getItem(CURRENT_SCHEME_ID_KEY);
      if (currentId === id) {
        await this.setCurrentScheme(DEFAULT_LAYOUT_SCHEMES.default.id);
      }
    } catch (error) {
      console.error('[LayoutSchemeManager] 删除方案失败', error);
      throw error;
    }
  }

  /**
   * 设置当前活跃方案
   */
  static async setCurrentScheme(id: string): Promise<void> {
    try {
      const scheme = await this.getSchemeById(id);
      if (!scheme) {
        throw new Error(`方案ID不存在: ${id}`);
      }

      await AsyncStorage.setItem(CURRENT_SCHEME_ID_KEY, id);
    } catch (error) {
      console.error('[LayoutSchemeManager] 设置当前方案失败', error);
      throw error;
    }
  }

  /**
   * 获取自定义方案列表（不包括预设）
   */
  static async getCustomSchemes(): Promise<ElementLayoutScheme[]> {
    const allSchemes = await this.getAllSchemes();
    return allSchemes.filter(s => !s.isPreset);
  }

  /**
   * 获取预设方案列表
   */
  static async getPresetSchemes(): Promise<ElementLayoutScheme[]> {
    return Object.values(DEFAULT_LAYOUT_SCHEMES);
  }

  /**
   * 清空所有自定义方案
   */
  static async clearCustomSchemes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LAYOUT_SCHEMES_STORAGE_KEY);
      await AsyncStorage.removeItem(CURRENT_SCHEME_ID_KEY);
    } catch (error) {
      console.error('[LayoutSchemeManager] 清空自定义方案失败', error);
      throw error;
    }
  }

  /**
   * 导出方案为JSON
   */
  static exportSchemeAsJson(scheme: ElementLayoutScheme): string {
    return JSON.stringify(scheme, null, 2);
  }

  /**
   * 从JSON导入方案
   */
  static importSchemeFromJson(json: string): ElementLayoutScheme {
    try {
      const scheme = JSON.parse(json);
      if (!validateLayoutScheme(scheme)) {
        throw new Error('无效的方案格式');
      }
      // 确保是自定义方案
      scheme.isPreset = false;
      scheme.id = `custom-${Date.now()}`;
      return scheme;
    } catch (error) {
      console.error('[LayoutSchemeManager] 导入方案失败', error);
      throw error;
    }
  }
}
