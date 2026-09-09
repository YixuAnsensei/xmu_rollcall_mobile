# Zako 签到助手移动端（xmu_rollcall_mobile）工程迁移与开发交接文档

> **文档性质**：跨会话开发迁移、技术架构全景报告与工程技术交接指南  
> **工程基准版本**：v1.2.1（Commit: `ec418f9`）  
> **最后更新日期**：2026-09-09  
> **文档适用对象**：接手本项目继续开发维护的工程师及新 AI 会话（Session）

---

## ⚡【新 Session 必读：接手前置准则与核心现状认知】（TOP PRIORITY）

> **致新接手的开发者 / AI 会话**：在开始执行任何开发、重构或环境变更命令前，**必须逐字阅读并严格遵守以下三大前置准则**：

### 准则一：先完整通读两端项目代码，严禁“未读先写”
- **第一步动作**：进入新会话后，**必须先完整阅读**移动端（`xmu_rollcall_mobile`）全量代码，并深度比对桌面端源码（`xmu_rollcall_zako_Tronclass/zako_app_V3.0.py`）。
- **禁止行为**：严禁在未完整理解现有文件结构、状态机流转与原生模块机制前，凭直觉重写逻辑或盲目新增第三方依赖。

### 准则二：清晰认知当前项目性质与开发进度现状
- **跨平台目标**：本项目是面向 **移动端（iOS / Android 双端）** 的独立便携签到应用开发。
- **Android 端现状（已基本开发完成）**：
  - Android 端核心功能链路**已经大体完成并高度成熟**（版本 `v1.2.1`）：
    1. CAS WebView 自动登录 + 本地原生 Kotlin 模块穿透读取 `HttpOnly` Cookie 已打通；
    2. 枢纽页（HomeScreen）用户信息卡片 + 课程列表（CoursesScreen）+ 签到页（RollcallScreen）分层导航已就绪；
    3. 全面适配 Android 15 / SDK 57 安全区（SafeAreaContext），彻底根除状态栏触摸遮挡；
    4. 四校区两阶段雷达定位算法（含米制切平面逆投影经纬度还原 `xyToLatlon`）与已结束判定已完全对齐；
    5. 15 个离线场景自动化回归测试（`bun test`）全绿通过，TypeScript 类型检查 0 错误；
    6. `nekonn` 猫猫自适应应用图标已配置生成并打包进 APK。
- **后续演进方向**：在确保 Android 端稳定不退化的前提下，推进 iOS 平台原生模块补齐与跨平台完备性。

### 准则三：一切业务细节必须严格以成熟的桌面端源码为唯一权威参考
- **桌面端代码不可动摇**：桌面端 `zako_app_V3.0.py` 经过长期实战检验，是数据结构、API 协议、距离判定、超时重试与状态流转的**唯一 Ground Truth**。
- **禁止自行简化**：任何签到交互、状态流转（例如活动雷达判定、数字签到取码与短路、时间格式化）必须逐行对齐桌面端，严禁私自精简判定分支！

---

## 目录
0. [【新 Session 必读：接手前置准则与核心现状认知】](#-新-session-必读接手前置准则与核心现状认知top-priority)
1. [项目背景、核心目的与硬性开发约束](#1-项目背景核心目的与硬性开发约束)
2. [本地工程与代码资产分布](#2-本地工程与代码资产分布)
3. [开发者凭据与版本控制配置](#3-开发者凭据与版本控制配置)
4. [核心技术架构与业务实现详解](#4-核心技术架构与业务实现详解)
5. [质量保障与自动化测试体系](#5-质量保障与自动化测试体系)
6. [环境依赖、构建管线与已知网络坑点](#6-环境依赖构建管线与已知网络坑点)
7. [历史构建与产物版本档案](#7-历史构建与产物版本档案)
8. [新 Session 无缝接手指南与待办规划](#8-新-session-无缝接手指南与待办规划)

---

## 1. 项目背景、核心目的与硬性开发约束

### 1.1 项目背景与角色定位
- **项目定位**：本项目由学校教师负责人统筹推进，旨在根据便携化教学与出勤管理需求，为学校师生打造一款轻量级、跨平台的独立移动端签到辅助工具。
- **业务对齐标杆**：项目基于已成熟稳定运行的 Windows 桌面客户端（`xmu_rollcall_zako_Tronclass`，基于 Python CustomTkinter 开发），将其功能与交互逻辑 1:1 完整移植至移动端（iOS / Android）。

### 1.2 核心硬性约束（Top Priority）
1. **严禁修改桌面端源码**：
   - 桌面端代码库目录：`D:\claude-code-haha\xmu_rollcall_zako_Tronclass\`
   - 其中的 `zako_app_V3.0.py`、`zako_get_rollcall.py`、`test_radar_scenarios.py` 是整个签到算法、状态机判定、数据协议的**唯一权威事实源（Ground Truth）**。
   - 开发移动端时，只能**单向读取和对齐**桌面端逻辑，绝对禁止向桌面端目录做任何写入、修改或提交。
2. **规范化开发原则**：
   - 采用官方推荐的最佳实践（Expo SDK 57 + CNG 连续原生生成）；
   - 代码变更必须通过类型检查（`tsc --noEmit`）与离线测试套件（`bun test`）；
   - 版本升级必须严格遵守版本号全处同步规范（`package.json`、`app.json`、`CONNECT.txt`）。

---

## 2. 本地工程与代码资产分布

### 2.1 桌面端参考工程（只读基准）
- **根目录**：`D:\claude-code-haha\xmu_rollcall_zako_Tronclass`
- **核心文件清单**：
  - `zako_app_V3.0.py`（52KB）：桌面端 GUI 主程序，包含完整的 CAS 浏览器生命周期、学期与课程获取、数字签到提交、雷达两阶段定位算法（298~516 行）及统一判定状态机（903~984 行）。
  - `test_radar_scenarios.py`：桌面端雷达定位及 UI 决策的单元测试用例（含四校区定位、直接命中、几何发散、状态机判定分支等 11 个场景）。
  - `nekonn.ico`：桌面端原版应用图标（含 16px 至 256px 多尺寸帧）。
  - `zako_get_rollcall.py`：纯 CLI 模式的签到抓取与提交原型。

### 2.2 移动端工程（当前开发目标）
- **根目录**：`D:\claude-code-haha\xmu_rollcall_mobile`
- **目录拓扑结构**：
  ```text
  xmu_rollcall_mobile/
  ├── app/                                # 基于 expo-router 的声明式文件路由系统
  │   ├── _layout.tsx                     # 根导航布局，配置 SafeAreaProvider 与全屏黑底主题
  │   ├── index.tsx                       # 入口重定向，默认跳转至 /screens/HomeScreen
  │   └── screens/
  │       ├── HomeScreen.tsx              # 枢纽主页：展示学生信息卡片、查看课程大按钮、拦截返回
  │       ├── LoginScreen.tsx             # CAS 登录页：WebView 统一认证 + 底部刷新/关闭操作栏
  │       ├── CoursesScreen.tsx           # 课程列表页：按当前学期拉取课程，支持重试与返回
  │       └── RollcallScreen.tsx          # 签到交互页：数字签到展示/提交、雷达探测/提交、历史展示
  ├── lib/                                # 核心业务逻辑与网络协议层
  │   ├── api.ts                          # 接口通信、两阶段雷达算法、统一判定状态机、测试注入点
  │   ├── auth.ts                         # 运行时内存凭据管理（Cookie、StudentId、UserName）
  │   └── __tests__/
  │       └── api.test.ts                 # 离线自动化测试套件（15 个测试用例，覆盖全场景模拟）
  ├── modules/
  │   └── xmu-cookie/                     # 自研本地 Expo 原生模块（读写 HttpOnly Cookie）
  │       ├── expo-module.config.json     # 模块声明（Android 平台挂载）
  │       ├── android/                    # Android Kotlin 实现（CookieManager 桥接）
  │       └── src/                        # TypeScript 声明与原生调用接口
  ├── assets/                             # 视觉资源（nekonn 衍生生成的 1024px 与自适应前景图）
  ├── app.json                            # Expo 工程主配置（版本号、包名、权限、图标等）
  ├── eas.json                            # EAS Build 云端流水线构建预设
  ├── tsconfig.json                       # TypeScript 编译配置（已排除测试与平台原生输出）
  ├── package.json                        # 项目依赖与 npm scripts
  └── CONNECT.txt                         # 云端构建产物链接、版本日志与本地 APK 登记表
  ```

---

## 3. 开发者凭据与版本控制配置

### 3.1 远端代码仓库与账号
- **代码托管平台**：GitHub
- **开发者账号（GitHub ID）**：`YixuAnsensei`
- **移动端仓库 URL**：`https://github.com/YixuAnsensei/xmu_rollcall_mobile.git`
- **主分支**：`main`
- **桌面端仓库 URL**：`https://github.com/YixuAnsensei/xmu_rollcall_zako_Tronclass.git`

### 3.2 GitHub 认证与推送机制（重要）
- **凭据存储位置**：用户本地 Auto-Memory 持久化存储于：
  `C:\Users\yi'xuan\.claude\projects\D--claude-code-haha\memory\reference_github_pat.md`
- **推送安全规范**：
  - 本机 Windows 凭据管理器（GCM）在无交互环境（`GIT_TERMINAL_PROMPT=0`）下无法弹出登录窗口，裸 `git push` 会挂起。
  - 推送时**必须**使用一次性嵌入式 URL，不得将 PAT 持久化写入 `.git/config` 或代码文件中：
    ```bash
    git push "https://x-access-token:<PAT>@github.com/YixuAnsensei/xmu_rollcall_mobile.git" main
    ```
  - 新 Session 在当前工程上下文工作时，系统会自动载入内存索引，可直接按上述规范调用。

---

## 4. 核心技术架构与业务实现详解

### 4.1 技术栈基准
- **运行时 / 打包器**：Bun 1.3.x（严禁使用 npm 12，因其存在 `Cannot convert object to primitive value` 缺陷）
- **跨平台框架**：React Native 0.86.3 + React 19.2.3
- **脚手架与套件**：Expo SDK ~57.0.9（采用 Continuous Native Generation 范式，`android/` 与 `ios/` 由 `expo prebuild` 动态合成，无需人工维系平台代码）
- **路由方案**：`expo-router` ~57.0.20（Stack Navigator）

### 4.2 CAS 统一认证与 HttpOnly Cookie 穿透方案
1. **技术痛点**：
   - 厦门大学畅课系统（`https://lnt.xmu.edu.cn`）登录走学校统一认证（`ids.xmu.edu.cn`）。
   - 身份票据以 `HttpOnly` Cookie 形式下发。标准 React Native `fetch` 及第三方库无法通过 JavaScript 访问 `HttpOnly` Cookie。
2. **解决方案**：
   - 借助 `create-expo-module` 自行封装原生模块 `modules/xmu-cookie`。
   - 原生端（Kotlin）调用 Android 系统底层 `android.webkit.CookieManager`：
     - `getCookieForUrlAsync(url)`：直读目标域名的全量 Cookie 串。
     - `clearCookiesAsync()`：清空 WebView Cookie 缓存，确保换号登录无残留。
3. **认证流程图解**：
   ```text
   用户进入登录页 (LoginScreen) 
     │
     ▼
   启动 WebView 加载 https://lnt.xmu.edu.cn
     │
     ▼ (302 重定向)
   学校 CAS 认证页 (ids.xmu.edu.cn) ──> 用户手动输入统一身份认证账号密码
     │
     ▼ (认证成功回跳)
   拦截 URL: 匹配包含 lnt.xmu.edu.cn 且不含 ids.xmu.edu.cn
     │
     ▼
   原生模块 XmuCookie.getCookieForUrlAsync 提取 Cookie
     │
     ▼ (检测包含 session / token / tronclass)
   请求 GET /api/profile 校验凭据有效性并获取学生 ID 与姓名
     │
     ▼
   写入内存 auth.ts ──> 路由 replace 跳转至 HomeScreen 枢纽页
   ```

### 4.3 UI 导航分层与安全区系统
1. **分层路由设计**：
   - **LoginScreen**：认证中心，支持随时重置会话与取消返回。
   - **HomeScreen**：中枢主页。展示当前已登录学生姓名、ID；登录后核心猫爪大按钮为“查看课程”；支持硬件返回键拦截（返回触发重新登录）。
   - **CoursesScreen**：课程列表页。动态拉取当前学期已开课清单，支持卡片化点击进课。
   - **RollcallScreen**：具体课程签到看板。
2. **Android 状态栏避让修复**：
   - 全面抛弃 React Native 内置仅在 iOS 生效的 `SafeAreaView`，统一换用 `react-native-safe-area-context`。
   - 根节点 `_layout.tsx` 注入 `<SafeAreaProvider>`。
   - 解决了 Android 15+ / SDK 57 在 Edge-to-Edge 沉浸式模式下，顶栏与返回按钮被挖孔屏/系统状态栏吃掉触摸事件的问题。
   - WebView 登录页的“刷新”与“关闭”按钮移至屏幕底部操作栏，保留底端手势避让边距。

### 4.4 签到业务层与算法实现（100% 对齐桌面版）
代码集中于 `D:\claude-code-haha\xmu_rollcall_mobile\lib\api.ts`：

#### A. 学期与课程动态拉取
- 优先访问 `GET /api/current-semester-info` 动态解析当前生效的 `semester_id` 与 `academic_year_id`。
- 请求发生网络异常或状态非 200 时，平滑降级至内置默认值（`semester_id: "29", academic_year_id: "12"`）。
- 携带条件访问 `POST /api/my-courses` 获取当前学期课程，对重复 `id` 进行集合去重。

#### B. 统一签到状态机判定 (`fetchRollcallOutcome`)
获取课程最新一条记录（末项 `rollcalls[-1]`），流转逻辑如下：
1. **雷达探测优先**：
   - 若命中 `isRadarType`（字段 `is_radar` / `isRadar` 或类型字串含 `radar`）：
   - 主动向服务器请求 `GET /api/radar/rollcalls`（`findActiveRadarRecord`）。
   - 若记录在当前活动列表中，或字段显式标注 `status === "active"`，判定为 `radar_active`（展示雷达发射按钮）；否则判定为 `radar_past`（展示“上一次是雷达签到，已结束”）。
2. **数字码签到**：
   - 请求 `GET /api/rollcall/{rid}/student_rollcalls`。
   - 若返回有效 `number_code`，判定为 `digital`，并提取 `status`（`active` 或 `finished`）。
3. **复合兜底机制**：
   - 若未获取到数字码，再次查阅活动雷达列表，若为雷达或非扫码非数字，回退判定为 `radar_active`；否则归类为 `other`。

#### C. 数字签到自动提交
- 调用 `submitNumberCode(cookie, rollcallId)`。
- 若状态为 `finished`，本地短路并返回 `finished` 提示，不发起无效请求。
- 提交请求为 `PUT /api/rollcall/{rid}/answer_number_rollcall`，Body 携带标准的 `{ deviceId, numberCode }`。

#### D. 雷达签到：四校区切平面三边定位引擎
针对历史版本出现的“计算距离出错”及“浮点发散”问题，已完成数学模型重构：
1. **坐标系与常数**：
   - 地球半径常数 $R = 6371000.0\text{ m}$，探针基准精度 $35\text{ m}$。
   - 四校区基准锚点：翔安校区（24.6060, 118.3100）、思明校区（24.4383, 118.0932）、马来西亚校区（2.8327, 101.7028）、漳州校区（24.3400, 117.9300）。
2. **阶段一：校区探针锁定**：
   - 遍历四校区，PUT `/api/rollcall/{rid}/answer` 试探。
   - 若返回 HTTP 200，直接命中校区中心（成功退出）。
   - 若返回距离（字段 `distance` / `dist` / `distance_m`），取距离最小者作为中心校区。
3. **阶段二：局部切平面三角测量（Triangulation）**：
   - 分别在中心基准点偏移 $\Delta\text{lat} = 0.004$ 与 $\Delta\text{lng} = 0.004$ 发射两次探针，获得两个测距半径 $d_1, d_2$。
   - **投影变换**（`latlonToXY`）：
     $$x = \text{radians}(\text{lng} - \text{lng}_0) \cdot R \cdot \cos(\text{radians}(\text{lat}_0))$$
     $$y = \text{radians}(\text{lat} - \text{lat}_0) \cdot R$$
   - **两圆求交**（`circleIntersections`）：
     - 包含外离容差近似（距离超出 50m 内取连线中点）；
     - 包含内含容差近似（较小圆位于大圆内 50m 内沿中心连线外推）；
     - 标准两圆交点方程解出两组候选坐标 $(x, y)$。
   - **逆投影变换还原**（`xyToLatlon`，**核心关键点**）：
     - 将求解出的米制平面位移逆转换为地理经纬度：
       $$\text{lat} = \text{lat}_0 + \frac{y}{R} \cdot \frac{180}{\pi}$$
       $$\text{lng} = \text{lng}_0 + \frac{x}{R \cdot \cos(\text{radians}(\text{lat}_0))} \cdot \frac{180}{\pi}$$
   - 向服务器提交两组候选经纬度，验证 HTTP 200 即完成精准定位。
   - **会话一致性**：雷达探测全程复用单一 `deviceId`，防止被服务端风控判定为多设备并发。

---

## 5. 质量保障与自动化测试体系

### 5.1 离线测试套件 (`lib/__tests__/api.test.ts`)
无需真实校园网络即可在本地快速验证全部算法边界与请求形态：
- **运行命令**：`bun test`
- **用例矩阵覆盖**（15 passed / 48 expect assertions）：
  1. 四校区（思明、翔安、漳州、马来西亚）两阶段定位精度验证（误差严格 $< 50\text{ m}$）；
  2. 校区中心直接命中短路逻辑；
  3. 服务端无距离字段返回时的安全容错；
  4. 探针网络超时（status 0）容错；
  5. 探针几何矛盾（不相交）锁定校区回退；
  6. `isRadarType` 字段别名及多形态识别；
  7. 活动雷达与已结束雷达状态机分支；
  8. 纯二维码签到记录防误判测试；
  9. ISO 时间解析与本地化格式化验证；
  10. 数字签到网络报文结构验证（GET 取码 -> PUT 携带 `deviceId` + `numberCode`）；
  11. 数字签到状态为 `finished` 时的防重提拦截验证；
  12. 数字签到无码时的保护逻辑验证。

### 5.2 静态检查与规范指令
```bash
# 进入工程目录
cd D:\claude-code-haha\xmu_rollcall_mobile

# 1. 运行自动化测试套件
bun test

# 2. TypeScript 全量类型检查
bun run typecheck     # 等价于 bunx tsc --noEmit
```

---

## 6. 环境依赖、构建管线与已知网络坑点

### 6.1 开发环境依赖清单
- **Node.js**：v24.x（本地已安装）
- **Bun 运行时**：`C:\Users\yi'xuan\.bun\bin\bun.exe`（已配置进系统 PATH）
- **Expo CLI / EAS CLI**：通过 `bunx` 调用，缓存于全局，项目无需全局冗余安装

### 6.2 EAS Cloud Build 构建流程
项目无需在本地安装配置庞大的 Android Studio 或 Xcode，采用 EAS 官方云端流水线打包：
- **配置文件**：`eas.json`
- **构建配置文件**：`preview`（生成内部测试用的 APK 安装包）

### 6.3 关键网络代理坑点与解决方案（必须严格遵守）
在境内开发环境中，EAS 构建与产物下载有两处关键网络机制：

1. **EAS 元数据与源码上传阶段（TLS 握手断开问题）**：
   - **现象**：执行 `eas build` 时提示 `Failed to upload the project tarball to EAS Build ... Client network socket disconnected before secure TLS connection was established`。
   - **根因**：`eas-cli` 内部使用 Node.js `node-fetch` 向 Google Cloud Storage（`storage.googleapis.com`）上传打包好的项目归档。Node.js 的 HTTPS 请求**只识别 `HTTPS_PROXY` 环境变量**，而环境中有时仅挂载了 `HTTP_PROXY` 或 `ALL_PROXY`。
   - **规范执行命令**：
     ```bash
     cd /d/claude-code-haha/xmu_rollcall_mobile
     HTTPS_PROXY=http://127.0.0.1:59479 HTTP_PROXY=http://127.0.0.1:59479 bunx eas-cli build --platform android --profile preview --non-interactive
     ```
     *(注：本地代理端口若有浮动，先通过 `env | grep -i proxy` 确认当前活动端口)*。

2. **产物下载阶段（`wf-artifacts.eascdn.net` 域名访问异常）**：
   - **现象**：手机或电脑浏览器直接点击 Expo 提供的安装链接，跳转至 `wf-artifacts.eascdn.net` 报 `ERR_CONNECTION_REFUSED` 或 `ERR_CONNECTION_CLOSED`。
   - **根因**：EAS 产物 CDN 属于海外 AWS S3 / Cloudflare 链路，境内常规网络未命中代理分流规则。
   - **官方规范获取姿势**（直接下载至电脑）：
     ```bash
     # 1. 查询构建产物元数据获取真实下载直链
     HTTPS_PROXY=http://127.0.0.1:59479 bunx eas-cli build:view <BUILD_ID> --json

     # 2. 借助电脑端代理 curl 命令高速拉取到本地工程根目录
     curl -sS -L -o zako-rollcall-vX.X.X.apk "<APPLICATION_ARCHIVE_URL>"
     ```
   - 下载完成后，直接通过微信文件传输助手或 USB 数据线传输至手机安装。

---

## 7. 历史构建与产物版本档案

| 版本号 | Git 提交哈希 | 构建 ID（Expo EAS） | 关键改动摘要 | 本地产物现状 |
|---|---|---|---|---|
| **v1.0.0** | `6ce6c9d` | `23e443eb` | SDK 57 重构基准版本，手动粘贴 Cookie 登录模式 | 归档淘汰 |
| **v1.1.0** | `1421e9d` | `a7cc50f2` | 引入 WebView + 本地原生模块 `xmu-cookie` 自动提取 Cookie | 归档淘汰 |
| **v1.1.1** | `a251fb2` | `eb525a85` | 全页面替换真安全区组件，解决状态栏触摸遮挡；登录成功跳课程列表 | 归档淘汰 |
| **v1.2.0** | `a6437e3` | `3b0bc2a1` | 严格对齐桌面端雷达引擎；恢复枢纽页分层返回；引入 `nekonn` 猫图标 | 归档可用 |
| **v1.2.1** | `ec418f9` | `a349e91e` | 深度对账修复两圆内切近似几何公式；建立 15 项全场景离线回归测试套件 | **当前最新基准** |

> 注：当前工作区与远程 `origin/main` 均已推进至 `ec418f9`。

---

## 8. 新 Session 无缝接手指南与待办规划

### 8.1 新 Session 启动环境检查清单
接手本项目的工程师或 AI 会话，在开始任何新功能开发前，请依序执行以下命令验证环境完整性：
```bash
# 1. 切换至移动端工程工作路径
cd D:\claude-code-haha\xmu_rollcall_mobile

# 2. 确认 git 分支与工作树干净
git status

# 3. 运行离线回归测试套件（必须确保 15/15 全部通过）
bun test

# 4. 执行 TypeScript 静态类型检查（必须确保 0 错误）
bun run typecheck
```

### 8.2 下一步开发建议与演进路线
1. **iOS 平台原生适配与支持**：
   - 当前自研 `xmu-cookie` 模块仅实现了 Android 平台的 Kotlin 桥接。
   - 若需支持 iOS 平台运行与云端构建，需在 `modules/xmu-cookie/ios/` 下补充 Swift 实现（基于 `WKHTTPCookieStore`），并在 `expo-module.config.json` 的 `platforms` 数组中添加 `"apple"`。
2. **多端发布与分发策略说明**：
   - **Android 侧**：当前具备完整的 EAS Preview APK 出包流水线，构建后可直接导出 APK 安装包进行安装测试。
   - **iOS 侧**：在补充 Swift 原生模块后，可通过 EAS Build 配置 Ad-hoc 或 TestFlight 进行内部测试分发，导出安装包供内测体验。
