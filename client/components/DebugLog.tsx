import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';

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
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + 6;
  const panelWidth = Math.min(width - 24, Math.round(width * 0.92));
  const panelHeight = Math.min(Math.round(height * 0.35), 320);
  const collapsedWidth = Math.min(width - 24, Math.round(width * 0.9));

  const styles = useMemo(
    () => createStyles(panelWidth, panelHeight, collapsedWidth, topOffset),
    [panelWidth, panelHeight, collapsedWidth, topOffset]
  );

  const scrollViewRef = useRef<ScrollView>(null);  // ScrollView引用（用于自动滚动）

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
      <ThemedView style={styles.collapsedContainer}>
        <TouchableOpacity onPress={toggleCollapse} style={styles.toggleButton}>
          <Text style={styles.toggleText}>调试日志 (点击展开)</Text>
          <Text style={styles.statusText}>{bluetoothStatus}</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // 展开状态，显示完整日志面板
  return (
    <ThemedView style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleCollapse} style={styles.toggleButton}>
          <Text style={styles.toggleText}>调试日志 (点击折叠)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClearLog} style={styles.clearButton}>
          <Text style={styles.clearText}>清空</Text>
        </TouchableOpacity>
      </View>

      {/* 蓝牙状态 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusLabel}>蓝牙状态：</Text>
        <Text style={[styles.statusValue, { color: bluetoothStatus.includes('已连接') ? '#4ADE80' : '#F87171' }]}>
          {bluetoothStatus}
        </Text>
      </View>

      {/* 日志内容区域 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.logArea}
        nestedScrollEnabled={true}
      >
        {/* 显示最近的数据包（最多显示50条） */}
        {packets.slice(-50).map((packet, index) => (
          <Text key={index} style={styles.logText}>
            [{String(index + 1).padStart(3, '0')}] {packet}
          </Text>
        ))}
        
        {/* 如果没有日志 */}
        {packets.length === 0 && (
          <Text style={styles.emptyText}>暂无日志数据</Text>
        )}
      </ScrollView>

      {/* 底部统计信息 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          共 {packets.length} 条数据包 | 显示最近 50 条
        </Text>
      </View>
    </ThemedView>
  );
};

const createStyles = (
  panelWidth: number,
  panelHeight: number,
  collapsedWidth: number,
  topOffset: number
) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: topOffset,
    alignSelf: 'center',
    width: panelWidth,
    height: panelHeight,
    backgroundColor: 'rgba(18, 18, 20, 0.94)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1000,
  },
  collapsedContainer: {
    position: 'absolute',
    top: topOffset,
    alignSelf: 'center',
    width: collapsedWidth,
    backgroundColor: 'rgba(18, 18, 20, 0.75)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleButton: {
    flex: 1,
  },
  toggleText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#991B1B',
    borderRadius: 6,
  },
  clearText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginRight: 6,
  },
  statusValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 4,
  },
  logArea: {
    flex: 1,
    padding: 10,
  },
  logText: {
    color: '#D1FAE5',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginBottom: 2,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
  },
});
