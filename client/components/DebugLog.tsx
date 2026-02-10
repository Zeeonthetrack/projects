import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { TouchButton } from '@/components/TouchButton';

/**
 * 调试日志组件
 * 
 * C/Python对应理解：
 * - 相当于C语言的 void debug_log(char* message)
 * - 相当于Python的 print() 函数的图形化界面
 * 
 * 功能说明：
 * - 可折叠/展开日志面板
 * - 显示蓝牙连接状态
 * - 实时显示发送的数据包（十六进制格式）
 * - 自动滚动到最新日志
 * - 支持手动清空日志
 */

interface DebugLogProps {
  isCollapsed: boolean;              // 是否折叠
  toggleCollapse: () => void;        // 切换折叠状态的回调
  bluetoothStatus: string;           // 蓝牙连接状态文字
  packets: string[];                 // 数据包列表（十六进制字符串）
  onClearLog: () => void;            // 清空日志的回调
}

export const DebugLog: React.FC<DebugLogProps> = ({
  isCollapsed,
  toggleCollapse,
  bluetoothStatus,
  packets,
  onClearLog,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);  // ScrollView引用（用于自动滚动）
  const { width, height } = useWindowDimensions();
  const screenWidth = Math.max(width, height);
  const screenHeight = Math.min(width, height);
  const panelWidth = screenWidth * 0.32;
  const panelHeight = screenHeight * 0.55;
  const panelTop = screenHeight * 0.42;
  const panelLeft = Math.max(0, (screenWidth - panelWidth) / 2);
  const collapsedWidth = screenWidth * 0.22;
  const collapsedTop = screenHeight * 0.38;
  const collapsedLeft = Math.max(0, (screenWidth - collapsedWidth) / 2);
  const borderRadius = screenWidth * 0.015;
  const borderWidth = screenWidth * 0.002;
  const headerPadding = screenWidth * 0.012;
  const statusPadding = screenWidth * 0.01;
  const logPadding = screenWidth * 0.012;
  const footerPadding = screenWidth * 0.01;
  const toggleTextSize = screenWidth * 0.013;
  const statusTextSize = screenWidth * 0.012;
  const logTextSize = screenWidth * 0.011;
  const emptyTextSize = screenWidth * 0.012;
  const footerTextSize = screenWidth * 0.01;
  const clearPaddingX = screenWidth * 0.01;
  const clearPaddingY = screenHeight * 0.008;
  const clearRadius = screenWidth * 0.008;
  const statusGap = screenWidth * 0.006;
  const statusTopMargin = screenHeight * 0.006;
  const logMaxHeight = panelHeight * 0.7;
  const logLineGap = screenHeight * 0.003;
  const emptyTopMargin = screenHeight * 0.02;

  /**
   * 当有新日志时，自动滚动到底部
   * 
   * C/Python对应理解：
   * - 相当于C语言的: scroll_to_bottom();
   * - 相当于Python的: scroll_view.scrollToEnd()
   */
  useEffect(() => {
    if (!isCollapsed && packets.length > 0) {
      // 延迟一点滚动，确保新内容已经渲染
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [packets, isCollapsed]);

  // 如果折叠了，显示一个小的状态栏
  if (isCollapsed) {
    return (
      <ThemedView
        style={[
          styles.collapsedContainer,
          {
            top: collapsedTop,
            left: collapsedLeft,
            width: collapsedWidth,
            borderRadius,
            borderWidth,
          },
        ]}
      >
        <TouchButton onPress={toggleCollapse} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { fontSize: toggleTextSize }]}>🔧 调试日志 (点击展开)</Text>
          <Text style={[styles.statusText, { fontSize: statusTextSize, marginTop: statusTopMargin }]}>
            {bluetoothStatus}
          </Text>
        </TouchButton>
      </ThemedView>
    );
  }

  // 展开状态，显示完整日志面板
  return (
    <ThemedView
      style={[
        styles.container,
        {
          top: panelTop,
          left: panelLeft,
          width: panelWidth,
          height: panelHeight,
          borderRadius,
          borderWidth,
        },
      ]}
    >
      {/* 标题栏 */}
      <View style={[styles.header, { padding: headerPadding, borderBottomWidth: borderWidth }] }>
        <TouchButton onPress={toggleCollapse} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { fontSize: toggleTextSize }]}>🔧 调试日志 (点击折叠)</Text>
        </TouchButton>
        <TouchButton
          onPress={onClearLog}
          style={[
            styles.clearButton,
            {
              paddingHorizontal: clearPaddingX,
              paddingVertical: clearPaddingY,
              borderRadius: clearRadius,
            },
          ]}
        >
          <Text style={[styles.clearText, { fontSize: statusTextSize }]}>清空</Text>
        </TouchButton>
      </View>

      {/* 蓝牙状态 */}
      <View style={[styles.statusBar, { padding: statusPadding }]}>
        <Text style={[styles.statusLabel, { fontSize: statusTextSize, marginRight: statusGap }]}>蓝牙状态：</Text>
        <Text
          style={[
            styles.statusValue,
            {
              fontSize: statusTextSize,
              color: bluetoothStatus.includes('已连接') ? '#00FF00' : '#FF0000',
            },
          ]}
        >
          {bluetoothStatus}
        </Text>
      </View>

      {/* 日志内容区域 */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.logArea, { padding: logPadding, maxHeight: logMaxHeight }]}
        nestedScrollEnabled={true}
      >
        {/* 显示最近的数据包（最多显示50条） */}
        {packets.slice(-50).map((packet, index) => (
          <Text key={index} style={[styles.logText, { fontSize: logTextSize, marginBottom: logLineGap }]}>
            [{String(index + 1).padStart(3, '0')}] {packet}
          </Text>
        ))}
        
        {/* 如果没有日志 */}
        {packets.length === 0 && (
          <Text style={[styles.emptyText, { fontSize: emptyTextSize, marginTop: emptyTopMargin }]}>
            暂无日志数据
          </Text>
        )}
      </ScrollView>

      {/* 底部统计信息 */}
      <View style={[styles.footer, { padding: footerPadding, borderTopWidth: borderWidth }]}>
        <Text style={[styles.footerText, { fontSize: footerTextSize }]}>
          共 {packets.length} 条数据包 | 显示最近 50 条
        </Text>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderColor: '#444',
    zIndex: 1000,
  },
  collapsedContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: '#666',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#666',
  },
  toggleButton: {
    flex: 1,
  },
  toggleText: {
    color: '#00FF00',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF0000',
  },
  clearText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusLabel: {
    color: '#CCCCCC',
  },
  statusValue: {
    color: '#00FF00',
    fontWeight: 'bold',
  },
  statusText: {
    color: '#CCCCCC',
  },
  logArea: {
    flex: 1,
  },
  logText: {
    color: '#00FF00',
    fontFamily: 'Courier New',  // 等宽字体，方便查看十六进制数据
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
  },
  footer: {
    borderTopColor: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    color: '#888888',
    textAlign: 'center',
  },
});
