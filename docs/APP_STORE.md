# App Store 准备说明

更新时间：2026-07-27

## 当前工程状态

当前仓库已经包含：

- Capacitor 8.4 iOS 15+ Swift Package Manager 工程
- iPhone 与 iPad 自适应布局
- 原生状态栏安全区、触觉反馈、深链和系统分享
- App Icon 与明暗启动页
- `PrivacyInfo.xcprivacy` 并声明 Filesystem 插件所需的 `C617.1`
- 不跟踪、不收集数据的当前隐私模型
- `ITSAppUsesNonExemptEncryption = false`
- WebKit 学习数据的 iCloud 备份排除与文件保护处理

iOS 工程位于 `ios/App`。Windows 可以生成与同步工程，但编译、真机测试、签名、Archive 和上传必须在 macOS 上使用 Xcode 26 或更高版本完成。

## macOS 构建流程

```bash
npm install
npm run ios:sync
npm run ios:open
```

在 Xcode 中完成：

1. 选中 `App` Target，在 Signing & Capabilities 选择自己的 Team。
2. 确认 Bundle Identifier 为 `app.logospraxis.study`，若要修改必须在首次上架前统一修改 Web 配置、iOS 与 Android 工程。
3. 设置 `Marketing Version` 与 `Current Project Version`。
4. 连接至少一台 iPhone 和一台 iPad 执行真机测试。
5. Product > Archive，完成 Validate App 后上传至 App Store Connect。
6. 先通过 TestFlight 完成离线、文件导入、备份与恢复验收，再提交审核。

Capacitor 8 使用 Swift Package Manager。`npm run ios:sync` 会重新生成 `ios/App/CapApp-SPM/Package.swift` 并同步 Web 资源。

## App Privacy 建议

以当前源码和依赖为准，App Store Connect 中预期选择：

- 不收集数据
- 不用于跟踪
- 不包含广告 SDK
- 不使用第三方登录
- PDF、批注、闪卡和复习记录只保存在应用沙盒

应用使用系统文件选择器导入用户主动选择的 PDF/ZIP/JSON，使用系统分享面板导出用户主动生成的备份。最终回答仍须以 Xcode Privacy Report 和提交二进制为准。

## Privacy Manifest

实际清单位于：

```text
ios/App/App/PrivacyInfo.xcprivacy
```

同步模板位于：

```text
native/ios/PrivacyInfo.xcprivacy
```

当前清单声明：

- `NSPrivacyTracking = false`
- 无跟踪域名
- 无开发者收集的数据类型
- Filesystem 文件时间戳 API 使用理由 `C617.1`

每次新增原生插件后必须重新审计 Required Reason API，不能直接沿用旧清单。

## TestFlight 验收

- 飞行模式强制结束进程后仍能启动
- 导入 500 MB 以上 PDF 时有进度且不崩溃
- PDF 逐页索引完成后可全文检索
- 退出进程后页码、批注、闪卡和复习状态保留
- 备份能够通过 iOS 分享面板保存到“文件”
- 完整备份可以恢复全部 PDF 和学习记录
- 深色模式下状态栏、手势区与底部导航颜色正确
- iPhone 刘海、Dynamic Island 和 iPad 分屏无内容遮挡
- VoiceOver 能读出导航、评分按钮和表单标签
- 大字体模式下复习评分按钮不截断
- 删除应用后本地数据随沙盒一并删除
- Instruments 与 Xcode 控制台没有持续网络请求或敏感日志
- Xcode Privacy Report 与 App Store Connect 回答一致

## 审核说明

审核备注应写明：

- 应用无需账号即可使用
- 首次启动包含 6 张自编示例卡片
- 文献通过用户自己的文件选择器导入
- 测试路径：图书馆 > 导入 PDF > 阅读 > 选中文本 > 新建闪卡 > 背诵
- 社区、模考和协同只是不可用的远期入口，不连接服务器

## 必须由发布者补齐的外部信息

这些内容无法从源码自动决定：

- Apple Developer Team 与签名证书
- App Store Connect 应用记录
- 可公开访问的隐私政策 URL
- 支持 URL 与联系邮箱
- App Store 截图、年龄分级和价格区域
- 内容授权证明与审核联系信息

参考：

- [Capacitor 8 iOS 环境要求](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor App Store 部署](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple 加密出口合规](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-app-encryption-documentation/)
