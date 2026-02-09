import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
        <TouchButton onPress={toggleCollapse} style={styles.toggleButton}>
          <Text style={styles.toggleText}>🔧 调试日志 (点击展开)</Text>
          <Text style={styles.statusText}>{bluetoothStatus}</Text>
        </TouchButton>
      </ThemedView>
    );
  }

  // 展开状态，显示完整日志面板
  return (
    <ThemedView style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchButton onPress={toggleCollapse} style={styles.toggleButton}>
          <Text style={styles.toggleText}>🔧 调试日志 (点击折叠)</Text>
        </TouchButton>
        <TouchButton onPress={onClearLog} style={styles.clearButton}>
          <Text style={styles.clearText}>清空</Text>
        </TouchButton>
      </View>

      {/* 蓝牙状态 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusLabel}>蓝牙状态：</Text>
        <Text style={[styles.statusValue, { color: bluetoothStatus.includes('已连接') ? '#00FF00' : '#FF0000' }]}>
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 320,
    height: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    zIndex: 1000,
  },
  collapsedContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  toggleButton: {
    flex: 1,
  },
  toggleText: {
    color: '#00FF00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FF0000',
    borderRadius: 5,
  },
  clearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginRight: 5,
  },
  statusValue: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#CCCCCC',
    fontSize: 11,
    marginTop: 5,
  },
  logArea: {
    flex: 1,
    padding: 10,
    maxHeight: 280,
  },
  logText: {
    color: '#00FF00',
    fontSize: 11,
    fontFamily: 'Courier New',  // 等宽字体，方便查看十六进制数据
    marginBottom: 2,
  },
  emptyText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    color: '#888888',
    fontSize: 10,
    textAlign: 'center',
  },
});
