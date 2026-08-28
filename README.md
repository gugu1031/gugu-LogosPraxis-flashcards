<div align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="LogosPraxis icon" />
  <h1>LogosPraxis</h1>
  <p><strong>Offline-first flashcards, academic PDF reading and knowledge review.</strong></p>
  <p>一款面向理论学习与人文社科备考的本地优先学习工具。</p>

  <p>
    <a href="https://github.com/gugu1031/gugu-LogosPraxis-flashcards/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/gugu1031/gugu-LogosPraxis-flashcards/actions/workflows/ci.yml/badge.svg" /></a>
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f6b52" /></a>
    <img alt="Vue 3" src="https://img.shields.io/badge/Vue-3.5-42b883" />
    <img alt="PWA" src="https://img.shields.io/badge/PWA-offline--first-5b6b62" />
    <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-iOS%20%7C%20Android-119eff" />
  </p>
</div>

## 项目简介

LogosPraxis 将间隔重复闪卡、本地 PDF 精读、全文检索、结构化知识库与学习统计整合在同一套离线数据模型中。应用不要求注册账号，用户导入的文献、批注、卡片和复习记录默认只保存在当前浏览器或应用沙盒。

项目提供 Vue 3 PWA 以及 Capacitor iOS/Android 工程，可用于桌面浏览器、手机浏览器或原生容器。社区、云同步和在线协作仅保留隔离的扩展边界，不参与当前本地数据流。

## 核心能力

- **FSRS-4 间隔重复**：四档记忆评分、到期队列、键盘操作、复习状态持久化。
- **专业 PDF 阅读器**：本地批量导入、分页渲染、缩放、文本选择、划线、批注和摘录制卡。
- **统一全文检索**：同时检索闪卡、书目元数据和已解析的 PDF 页面文本。
- **结构化知识库**：按学科、人物、年代、来源、题型和难度组织学习内容。
- **离线数据底座**：Dexie + IndexedDB 保存 PDF Blob、索引、批注、日志和设置。
- **完整备份**：导出/恢复包含文献的 ZIP 备份，并支持闪卡 JSON 交换。
- **学习可视化**：复习趋势、学科分布、学习热力、连续学习和书目掌握度。
- **跨端体验**：PWA 安装、响应式布局、离线缓存、Capacitor 8 原生壳与触觉反馈。

## 技术栈

| 领域 | 技术 |
| --- | --- |
| Web 应用 | Vue 3、TypeScript、Vite 7、Vue Router、Pinia |
| 本地存储 | IndexedDB、Dexie |
| 记忆调度 | FSRS-4 |
| PDF | PDF.js |
| 搜索 | 本地倒排索引与中文单字/双字分词 |
| 备份 | zip.js |
| 图表 | ECharts |
| PWA | vite-plugin-pwa、Workbox |
| 原生端 | Capacitor 8、Android API 36、iOS 15+ |

## 快速开始

环境要求：Node.js 20+、npm 10+。

```bash
git clone https://github.com/gugu1031/gugu-LogosPraxis-flashcards.git
cd gugu-LogosPraxis-flashcards
npm ci
npm run dev
```

终端会显示本地地址，默认仅监听 `127.0.0.1`。

### 质量检查与生产构建

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

构建产物位于 `dist/`。Service Worker 与 Web App Manifest 会随生产构建生成。

## 移动端

仓库包含可同步的 iOS 与 Android 原生工程：

```bash
npm run native:doctor
npm run native:sync
npm run android:debug
npm run ios:sync
```

- Android 可在 Windows、macOS 或 Linux 构建。
- iOS 工程可在任意系统同步，但签名、归档和 App Store 上传必须在 macOS + Xcode 完成。
- 发布签名文件和密码只通过本机环境变量读取，不应提交到 Git。

详细步骤见 [移动端构建手册](docs/MOBILE_BUILD.md)。

## 数据与隐私

```text
PDF / ZIP 导入
  -> 浏览器或应用沙盒
  -> PDF.js 逐页解析
  -> IndexedDB 保存文献、索引与学习数据
  -> FSRS 调度、搜索与统计在本机完成
```

当前版本不包含账号系统、广告 SDK、远程数据库或行为分析服务。删除浏览器站点数据或卸载应用会删除未备份的本地数据，请定期使用设置页导出完整备份。更多说明见 [隐私文档](docs/PRIVACY.md)。

## 项目结构

```text
src/
  components/       通用界面与 PDF 组件
  data/             内置书目、知识卡与练习数据
  db/               Dexie 数据库与迁移
  pages/            页面与远期功能隔离入口
  services/         FSRS、PDF、检索、备份和原生适配
  stores/           Pinia 应用状态
  styles/           设计令牌与响应式样式
  types/            业务类型
android/            Capacitor Android 工程
ios/                Capacitor iOS SPM 工程
docs/               架构、数据库、隐私与发布文档
scripts/            构建、同步和移动端工具脚本
```

## 文档

- [技术架构](docs/ARCHITECTURE.md)
- [数据库字段](docs/DATABASE_SCHEMA.md)
- [PDF 与开放资源方案](docs/PDF_AND_RESOURCES.md)
- [UI 设计规范](docs/UI_DESIGN.md)
- [用户指南](docs/USER_GUIDE.md)
- [iOS 与 Android 构建](docs/MOBILE_BUILD.md)
- [App Store 准备](docs/APP_STORE.md)
- [Google Play 准备](docs/GOOGLE_PLAY.md)
- [路线图](docs/ROADMAP.md)

## 内容与版权边界

仓库包含应用源码、书目元数据以及用于展示学习流程的结构化学习内容，不包含用户本地导入的 PDF、扫描件或私人笔记。应用不会提供用户文献的公开分享或在线分发能力。

题目与参考答案仅用于学习、研究和软件功能演示，不代表任何院校或出版机构的官方立场。使用者应确保自己导入和使用的文献符合当地法律及相应许可。

## 参与贡献

欢迎提交 Issue 或 Pull Request。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [SECURITY.md](SECURITY.md)。

## License

源代码以 [MIT License](LICENSE) 发布。第三方依赖及内容数据仍适用各自的许可与权利声明。
