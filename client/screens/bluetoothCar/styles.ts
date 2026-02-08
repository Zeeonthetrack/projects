import { StyleSheet } from 'react-native';

/**
 * 蓝牙遥控小车主界面样式
 * 
 * C/Python对应理解：
 * - 相当于C语言的样式结构体
 * - 相当于Python的字典定义样式
 * 
 * 注意：这里定义的样式会自动应用到 index.tsx 中的组件
 * 如果需要添加新的样式，请在这里定义并在组件中使用
 */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  bluetoothControls: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectButton: {
    backgroundColor: '#00AA00',
  },
  disconnectButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  joystickArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 30,
  },
  joystickWrapper: {
    alignItems: 'center',
  },
  joystickLabel: {
    marginBottom: 10,
  },
  joystick: {
    margin: 10,
  },
  buttonArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
});
