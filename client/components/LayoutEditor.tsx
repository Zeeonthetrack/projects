import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ViewStyle,
  Text,
  ScrollView,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { TouchButton } from './TouchButton';
import { useTheme } from '@/hooks/useTheme';
import Slider from '@react-native-community/slider';

/**
 * 布局元素定义
 */
export interface LayoutElement {
  id: string;
  x: number;              // 相对百分比 0-100
  y: number;              // 相对百分比 0-100
  width: number;          // 相对百分比 0-100
  height: number;         // 相对百分比 0-100
  type: 'joystick' | 'button' | 'packet' | 'log';
  label: string;
  isLocked?: boolean;
}

/**
 * 布局编辑器配置
 */
export interface LayoutEditorConfig {
  elements: LayoutElement[];
  name: string;
  isEditing: boolean;
}

interface LayoutEditorProps {
  elements: LayoutElement[];
  onElementsChange: (elements: LayoutElement[]) => void;
  isEditing: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  previewOnly?: boolean;
}

const ELEMENT_COLORS: Record<string, string> = {
  joystick: '#3B82F6',
  button: '#EF4444',
  packet: '#10B981',
  log: '#F59E0B',
};

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  joystick: '摇杆',
  button: '按钮',
  packet: '数据包',
  log: '日志',
};

/**
 * 游戏式键位编辑器
 * 支持拖拽调整位置和大小
 */
export function LayoutEditor({
  elements,
  onElementsChange,
  isEditing,
  onEditingChange,
  previewOnly = false,
}: LayoutEditorProps) {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  
  // 拖拽时的起始坐标
  const dragStartRef = useRef({ x: 0, y: 0, elementX: 0, elementY: 0, elementWidth: 0, elementHeight: 0 });
  
  const selectedElement = useMemo(
    () => elements.find(el => el.id === selectedElementId),
    [elements, selectedElementId]
  );

  /**
   * 处理元素被点击（选中）
   */
  const handleElementPress = useCallback((elementId: string) => {
    if (!isEditing) return;
    setSelectedElementId(elementId);
  }, [isEditing]);

  /**
   * 处理拖拽开始
   */
  const handleResizeHandlePress = useCallback((handle: 'tl' | 'tr' | 'bl' | 'br') => {
    if (!selectedElement || !isEditing) return;
    
    return {
      onPressIn: () => {
        setDragMode('resize');
        setResizeHandle(handle);
        dragStartRef.current = {
          x: 0,
          y: 0,
          elementX: selectedElement.x,
          elementY: selectedElement.y,
          elementWidth: selectedElement.width,
          elementHeight: selectedElement.height,
        };
      },
    };
  }, [selectedElement, isEditing]);

  /**
   * 转换屏幕坐标到百分比坐标
   */
  const convertToPercent = useCallback((screenCoord: number, screenSize: number): number => {
    return Math.max(0, Math.min(100, (screenCoord / screenSize) * 100));
  }, []);

  /**
   * 转换百分比坐标到屏幕坐标
   */
  const convertToScreen = useCallback((percentCoord: number, screenSize: number): number => {
    return (percentCoord / 100) * screenSize;
  }, []);

  /**
   * 处理元素被拖拽移动
   */
  const handleElementDrag = useCallback(
    (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (!selectedElement || !isEditing) return;

      const { dx, dy } = gestureState;
      const deltaX = convertToPercent(dx, screenWidth);
      const deltaY = convertToPercent(dy, screenHeight);

      const updatedElement: LayoutElement = {
        ...selectedElement,
        x: Math.max(0, Math.min(100 - selectedElement.width, selectedElement.x + deltaX)),
        y: Math.max(0, Math.min(100 - selectedElement.height, selectedElement.y + deltaY)),
      };

      const updatedElements = elements.map(el => el.id === selectedElement.id ? updatedElement : el);
      onElementsChange(updatedElements);
    },
    [selectedElement, isEditing, elements, onElementsChange, convertToPercent, screenWidth, screenHeight]
  );

  /**
   * 调整元素大小
   */
  const handleResizeDrag = useCallback(
    (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (!selectedElement || !resizeHandle || !isEditing) return;

      const { dx, dy } = gestureState;
      const deltaX = convertToPercent(dx, screenWidth);
      const deltaY = convertToPercent(dy, screenHeight);

      let newX = selectedElement.x;
      let newY = selectedElement.y;
      let newWidth = selectedElement.width;
      let newHeight = selectedElement.height;

      const minSize = 5; // 最小尺寸（百分比）

      if (resizeHandle.includes('l')) {
        newX = Math.max(0, selectedElement.x + deltaX);
        newWidth = selectedElement.width - deltaX;
      } else if (resizeHandle.includes('r')) {
        newWidth = Math.max(minSize, selectedElement.width + deltaX);
      }

      if (resizeHandle.includes('t')) {
        newY = Math.max(0, selectedElement.y + deltaY);
        newHeight = selectedElement.height - deltaY;
      } else if (resizeHandle.includes('b')) {
        newHeight = Math.max(minSize, selectedElement.height + deltaY);
      }

      // 确保元素不超出边界
      newX = Math.max(0, Math.min(100 - newWidth, newX));
      newY = Math.max(0, Math.min(100 - newHeight, newY));
      newWidth = Math.max(minSize, Math.min(100 - newX, newWidth));
      newHeight = Math.max(minSize, Math.min(100 - newY, newHeight));

      const updatedElement: LayoutElement = {
        ...selectedElement,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };

      const updatedElements = elements.map(el => el.id === selectedElement.id ? updatedElement : el);
      onElementsChange(updatedElements);
    },
    [selectedElement, resizeHandle, isEditing, elements, onElementsChange, convertToPercent, screenWidth, screenHeight]
  );

  /**
   * 使用滑块调整位置
   */
  const handlePositionChange = useCallback(
    (coordinate: 'x' | 'y', value: number) => {
      if (!selectedElement) return;

      const updatedElement = { ...selectedElement, [coordinate]: value };
      const updatedElements = elements.map(el => el.id === selectedElement.id ? updatedElement : el);
      onElementsChange(updatedElements);
    },
    [selectedElement, elements, onElementsChange]
  );

  /**
   * 使用滑块调整大小
   */
  const handleSizeChange = useCallback(
    (dimension: 'width' | 'height', value: number) => {
      if (!selectedElement) return;

      const updatedElement = { ...selectedElement, [dimension]: value };
      const updatedElements = elements.map(el => el.id === selectedElement.id ? updatedElement : el);
      onElementsChange(updatedElements);
    },
    [selectedElement, elements, onElementsChange]
  );

  // 编辑模式下的UI
  if (previewOnly) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      {/* 编辑器画布 */}
      <View
        style={{
          flex: 1,
          backgroundColor: theme.backgroundDefault,
          borderWidth: 1,
          borderColor: theme.borderLight,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 网格背景 */}
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* 布局元素 */}
        {elements.map((element) => {
          const elementX = convertToScreen(element.x, screenWidth);
          const elementY = convertToScreen(element.y, screenHeight);
          const elementWidth = convertToScreen(element.width, screenWidth);
          const elementHeight = convertToScreen(element.height, screenHeight);
          const isSelected = element.id === selectedElementId;
          const color = ELEMENT_COLORS[element.type];

          return (
            <View
              key={element.id}
              style={{
                position: 'absolute',
                left: elementX,
                top: elementY,
                width: elementWidth,
                height: elementHeight,
                borderWidth: isSelected ? 3 : 2,
                borderColor: isSelected ? '#FF00FF' : color,
                backgroundColor: color + '20',
                borderRadius: 8,
              }}
            >
              {/* 元素内容 */}
              <TouchButton onPress={() => handleElementPress(element.id)}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                  }}
                >
                  <ThemedText variant="caption" color={color}>
                    {element.label}
                  </ThemedText>
                </View>
              </TouchButton>

              {/* 选中时显示四角调整手柄 */}
              {isSelected && (
                <>
                  {(['tl', 'tr', 'bl', 'br'] as const).map((handle) => {
                    const positions: Record<string, ViewStyle> = {
                      tl: { top: -6, left: -6 },
                      tr: { top: -6, right: -6 },
                      bl: { bottom: -6, left: -6 },
                      br: { bottom: -6, right: -6 },
                    };

                    return (
                      <View
                        key={handle}
                        style={{
                          position: 'absolute',
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: '#FF00FF',
                          ...positions[handle],
                        }}
                      />
                    );
                  })}
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* 编辑控制面板 */}
      {selectedElement && (
        <ThemedView level="default" style={{ padding: 12, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
          <ThemedText variant="h4" style={{ marginBottom: 12 }}>
            编辑: {selectedElement.label} ({ELEMENT_TYPE_LABELS[selectedElement.type]})
          </ThemedText>

          <ScrollView horizontal style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* 位置X */}
              <View style={{ minWidth: 200 }}>
                <ThemedText variant="caption">X: {selectedElement.x.toFixed(1)}%</ThemedText>
                <Slider
                  style={{ height: 30 }}
                  minimumValue={0}
                  maximumValue={100 - selectedElement.width}
                  value={selectedElement.x}
                  onValueChange={(value) => handlePositionChange('x', value)}
                />
              </View>

              {/* 位置Y */}
              <View style={{ minWidth: 200 }}>
                <ThemedText variant="caption">Y: {selectedElement.y.toFixed(1)}%</ThemedText>
                <Slider
                  style={{ height: 30 }}
                  minimumValue={0}
                  maximumValue={100 - selectedElement.height}
                  value={selectedElement.y}
                  onValueChange={(value) => handlePositionChange('y', value)}
                />
              </View>

              {/* 宽度 */}
              <View style={{ minWidth: 200 }}>
                <ThemedText variant="caption">W: {selectedElement.width.toFixed(1)}%</ThemedText>
                <Slider
                  style={{ height: 30 }}
                  minimumValue={5}
                  maximumValue={100 - selectedElement.x}
                  value={selectedElement.width}
                  onValueChange={(value) => handleSizeChange('width', value)}
                />
              </View>

              {/* 高度 */}
              <View style={{ minWidth: 200 }}>
                <ThemedText variant="caption">H: {selectedElement.height.toFixed(1)}%</ThemedText>
                <Slider
                  style={{ height: 30 }}
                  minimumValue={5}
                  maximumValue={100 - selectedElement.y}
                  value={selectedElement.height}
                  onValueChange={(value) => handleSizeChange('height', value)}
                />
              </View>
            </View>
          </ScrollView>
        </ThemedView>
      )}
    </View>
  );
}
