# iOS 与 Android 构建手册

更新时间：2026-07-27

## 工程版本

- Capacitor Core、CLI、iOS、Android：8.4.2
- iOS Deployment Target：15.0
- Android minSdk：24
- Android compileSdk / targetSdk：36
- Android Gradle Plugin：8.13.0
- Gradle Wrapper：8.14.3
- JDK：21
- Node.js：22 或更高版本

## 通用命令

```powershell
npm install
npm run native:doctor
npm run native:sync
```

`native:sync` 会先执行 Vue 生产构建，再同步 iOS 与 Android 的 Web 资源和原生插件。

## Windows 上安装 Android 工具链

项目提供本地安装脚本，所有文件都会写入：

```text
<project-root>\.toolchains
```

运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-android-toolchain.ps1
```

脚本会要求明确输入 `YES` 接受 Android SDK License，然后下载并校验：

- Eclipse Temurin JDK 21
- Android Command-line Tools 15859902
- Android Platform 36
- Android Build Tools 35.0.0 与 36.0.0
- Android Platform Tools

`.toolchains` 已加入 `.gitignore`，不会进入源码仓库。

## Android 调试包

```powershell
npm run android:debug
```

输出：

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

连接开启 USB 调试的手机后，可使用：

```powershell
.\.toolchains\android-sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

调试包使用 `.debug` Application ID 后缀，可以与正式版并存。

## Android 正式签名

创建 Google Play 上传密钥：

```powershell
npm run android:create-key
```

密钥默认写入 `release\logospraxis-upload.jks`，且已被 `.gitignore` 排除。必须把密钥和密码分别保存在两个安全位置；丢失上传密钥会增加后续版本更新成本。

在当前 PowerShell 会话临时设置签名变量：

```powershell
$env:LOGOSPRAXIS_KEYSTORE_PATH = (Resolve-Path ".\release\logospraxis-upload.jks")
$env:LOGOSPRAXIS_KEY_ALIAS = "logospraxis-upload"
$env:LOGOSPRAXIS_KEYSTORE_PASSWORD = Read-Host "Keystore password"
$env:LOGOSPRAXIS_KEY_PASSWORD = Read-Host "Key password"
```

生成 Google Play AAB：

```powershell
npm run android:release:aab
```

输出：

```text
android\app\build\outputs\bundle\release\app-release.aab
```

生成签名 APK：

```powershell
npm run android:release:apk
```

输出：

```text
android\app\build\outputs\apk\release\app-release.apk
```

签名变量只从进程环境读取，不写入 Gradle 文件、源码或日志。

## iOS

Windows 只负责生成和同步 Xcode 工程：

```powershell
npm run ios:sync
```

将整个项目复制或 Git clone 到 macOS 后运行：

```bash
npm install
npm run ios:sync
npm run ios:open
```

在 Xcode 26 或更高版本中设置 Team、签名和版本号，然后执行 Product > Archive。iOS 详细验收见 `docs/APP_STORE.md`。

## 图标与启动页

源图标：

```text
resources/icon.png
```

重新生成双端资源：

```powershell
npm run native:assets
```

该命令生成 Android Adaptive Icon、Android 12 SplashScreen、iOS 1024×1024 App Icon 及明暗启动页。iOS App Icon 已验证为 RGB，不含 Alpha 通道。

## 数据与权限

Android 仅申请 `INTERNET` 与触觉反馈需要的 `VIBRATE` 普通权限；AndroidX 会生成仅供本应用使用的动态接收器保护权限。不申请相册、存储、定位、相机、麦克风或通知权限。文件导入使用系统文件选择器，导出使用系统分享面板。

Android 已禁用系统自动备份与明文网络。iOS 会对 WebKit 学习数据设置文件保护并排除系统云备份。应用自身不上传用户 PDF、批注、闪卡或复习记录。

## 常见故障

### Android 工具链未安装

运行：

```powershell
npm run native:doctor
```

若 JDK 或 Android SDK 显示缺失，重新运行工具链安装脚本。

### iOS Package.swift 路径异常

Windows 上的同步脚本会自动把 SPM 本地依赖路径规范为 `/`。在 macOS 上再次运行 `npm run ios:sync` 也会重新生成正确路径。

### Release 构建拒绝执行

正式构建必须同时提供四个 `LOGOSPRAXIS_*` 签名环境变量。脚本缺少任意一个都会停止，避免误生成不可上传的未签名产物。

### PDF 很大时分享失败

完整备份会先在应用 Cache 目录生成 ZIP，再调用系统分享。超大 PDF 会增加内存和临时空间占用；应先确认设备剩余空间，并按书目分批管理文献。
