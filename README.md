# Zako 签到助手 移动端 (Expo + React Native)

基于 [xmu_rollcall_zako_Tronclass](https://github.com/YixuAnsensei/xmu_rollcall_zako_Tronclass) 的 React Native 移动端实现，支持 Android 和 iOS。

## 功能

- **CAS WebView 登录**：App 内置 WebView，自动拦截学生 ID 并保存 Cookie
- **数字签到码查询**：获取最新签到码、状态（进行中/已结束）
- **一键数字签到**：自动取码并提交，完成签到
- **雷达签到**：四校区探针锁定校区 + 三边定位反解教师坐标
- **持久化登录**：Cookie 使用 AsyncStorage 本地存储，下次免登录

## 技术栈

- Expo (managed workflow)
- React Native 0.76
- TypeScript
- expo-router (文件路由)
- react-native-webview (CAS 登录)
- @react-native-async-storage/async-storage (凭证持久化)

## 运行方式

### 1. 安装依赖（已完成）

```bash
cd D:\claude-code-haha\xmu_rollcall_mobile
npm install
```

### 2. 启动开发服务器

```bash
npx expo start
```

### 3. 在手机上运行

- **Android**：安装 [Expo Go](https://expo.dev/go) App，扫码连接
- **iOS**：同样安装 Expo Go，扫码连接
- **EAS Build（推荐）**：构建正式 APK/IPA 安装包

```bash
# 构建 Android APK
npx eas build --platform android --profile preview

# 构建 iOS
npx eas build --platform ios --profile preview
```

## 与桌面版的差异

| 功能 | 桌面版 (Python) | 移动版 (React Native) |
|------|----------------|----------------------|
| CAS 登录 | Playwright 浏览器自动化 | WebView 内嵌登录 |
| 网络请求 | requests 库 | fetch API |
| 持久化 | 无（每次重新登录） | AsyncStorage Cookie 持久化 |
| 界面框架 | CustomTkinter | React Native StyleSheet |
| 打包 | PyInstaller .exe | EAS Build APK/IPA |

## 项目结构

```
xmu_rollcall_mobile/
├── app/
│   ├── _layout.tsx          # 根布局（路由导航）
│   ├── index.tsx            # 重定向到首页
│   └── screens/
│       ├── HomeScreen.tsx   # 主页（猫爪按钮）
│       ├── LoginScreen.tsx  # CAS WebView 登录
│       ├── CoursesScreen.tsx # 课程列表
│       └── RollcallScreen.tsx # 签到结果页
├── lib/
│   ├── api.ts               # 所有后端 API 逻辑（从 Python 移植）
│   └── auth.ts              # AsyncStorage 凭证管理
├── app.json                 # Expo 配置
└── package.json
```

## 注意事项

- CAS 登录使用 WebView，需在 App 内完成登录，登录后 Cookie 自动保存
- 雷达签到需要网络请求多个探测点，建议在校园网环境下使用
- 首次使用需在手机上安装 Expo Go App
