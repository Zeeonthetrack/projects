import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = process.env.COZE_PROJECT_NAME || process.env.EXPO_PUBLIC_COZE_PROJECT_NAME || '摇杆·歪比巴卜';
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'myapp';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "owner": "zeeonthetrack",
    "version": "1.0.0",
    "orientation": "landscape",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0B0C0F"
      },
      "permissions": [
        "BLUETOOTH",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN"
      ],
      "package": "com.robotcar.controller"
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "2.1.20"
          }
        }
      ],
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#0B0C0F"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许蓝牙小车控制App访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许蓝牙小车控制App使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许蓝牙小车控制App访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `蓝牙小车控制App需要访问相机以拍摄照片和视频。`,
          "microphonePermission": `蓝牙小车控制App需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ],
      
    ],
    "extra": {
      "eas": {
        "projectId": "a1e9eec6-9358-42f3-a368-74846a0b6906"
      }
    },
    "experiments": {
      "typedRoutes": true
    }
  }
}
