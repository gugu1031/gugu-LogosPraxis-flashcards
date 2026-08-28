# Google Play 上架说明

更新时间：2026-07-27

## 当前 Android 工程

- Application ID：`app.logospraxis.study`
- 正式版本：`1.0.0`
- Version Code：`1`
- minSdk：24
- targetSdk：36
- 输出格式：签名 AAB 与 APK
- 支持手机、平板、横屏和分屏
- 不使用广告、账号、推送或后台服务

Google Play 从 2026 年 8 月 31 日起要求新应用与更新以 Android 16，也就是 API 36 或更高版本为目标。本工程已经使用 API 36。

## Data Safety 预期回答

以当前源码为准：

- 应用不收集或共享用户数据
- 数据不传输到开发者服务器
- 不包含广告 SDK
- 不用于跟踪
- 无账号和账号删除流程
- 用户可以在设置页删除全部本地 PDF
- 用户可以导出完整备份，也可以通过卸载应用删除整个沙盒
- 数据传输仅发生在用户主动调用系统分享面板时，接收目标由用户选择

正式提交前必须用 Play Console 的 SDK Index、Data Safety 和最终 AAB 报告重新核验。

## 权限

合并后的正式 Manifest 仅包含两个 Android 平台普通权限：

```text
android.permission.INTERNET
android.permission.VIBRATE
```

`VIBRATE` 由触觉反馈插件加入；AndroidX 还会生成仅限本应用进程使用的动态接收器保护权限。本地文件导入使用 Storage Access Framework，不申请广泛存储权限。应用不申请相机、麦克风、定位、通讯录、照片、通知或附近设备权限。

## 商店资料建议

应用名称：

```text
LogosPraxis
```

简短说明：

```text
把原著阅读、PDF 批注、FSRS 闪卡与学习统计放进同一个离线知识库。
```

分类：教育

标签建议：考试准备、闪卡、笔记、电子书阅读

内容分级预期：无暴力、无色情、无赌博、无用户公开交流。社区功能正式上线后必须重新填写内容分级与 Data Safety。

## 发布流程

1. 创建并安全备份 Google Play 上传密钥。
2. 设置四个签名环境变量。
3. 运行 `npm run android:release:aab`。
4. 在 Play Console 创建应用并启用 Play App Signing。
5. 上传 `app-release.aab` 到 Internal Testing。
6. 至少完成手机、平板、Android 12、Android 15 和 Android 16 测试。
7. 完成 Data Safety、内容分级、隐私政策、商店图片与审核联系人。
8. 通过 Pre-launch Report 后再推进 Closed Testing 或 Production。

## 上架前验收

- 冷启动无白屏
- 刘海、挖孔与手势导航区域无遮挡
- 硬件返回键先返回上一页，在首页才退出
- 文件选择器能够导入 PDF、ZIP 和 JSON
- 分享面板能够导出备份
- 飞行模式下所有核心学习功能可用
- 强制结束进程后数据保留
- Android 系统备份不会上传学习数据库
- Release AAB 使用上传密钥签名
- `versionCode` 高于上一版本
- 64 位设备与大屏布局正常
- Play Pre-launch Report 无崩溃、ANR 或无障碍阻断

参考：

- [Google Play 目标 API 要求](https://developer.android.com/google/play/requirements/target-sdk)
- [Capacitor Google Play 部署](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [Android 发布检查清单](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
