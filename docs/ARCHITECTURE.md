# 技术架构

## 1. 技术选型

| 层级 | 选型 | 原因 |
| --- | --- | --- |
| 应用框架 | Vue 3 + TypeScript | 组合式 API 适合状态密集的本地应用，类型边界清晰 |
| 构建工具 | Vite 7 | 开发启动快，适配 PWA 与按路由拆包 |
| 路由 | Vue Router | 阅读器等沉浸页面可独立懒加载 |
| 全局状态 | Pinia | 只承担跨页面的学习与设置状态 |
| 本地数据库 | IndexedDB + Dexie | 支持 Blob、索引、事务与大于 LocalStorage 的容量 |
| PDF | PDF.js | 浏览器端解析、渲染和文本提取成熟 |
| 全文检索 | 本地倒排 token 表 | 中文双字索引无需远程服务，能与 IndexedDB 事务结合 |
| 备份 | zip.js | 可把结构化数据与 PDF Blob 写入一个 ZIP |
| 图表 | ECharts Core | 只注册折线、饼图与必要组件，避免完整包体 |
| 图标 | Phosphor Vue | 统一线性图标家族，免费开源 |
| 离线缓存 | vite-plugin-pwa + Workbox | 自动生成 Service Worker 与 Web App Manifest |
| 原生壳 | Capacitor 8.4 | 共用 Vue 业务层，生成 iOS 15+ SPM 工程与 Android API 36 工程 |

## 2. 运行结构

```text
Vue 页面
  -> Pinia 学习状态
    -> 业务服务
      -> Dexie / IndexedDB

PDF 导入
  -> PDF.js 提取逐页文本
  -> pdfPages 保存原文
  -> searchDocs 保存分词索引
  -> files 保存原始 Blob

闪卡复习
  -> FSRS-4 计算下一状态
  -> cards 更新
  -> reviewLogs 追加
  -> sessions 聚合
```

## 3. 离线策略

Service Worker 只缓存应用壳、脚本、样式、图标和字体声明。用户 PDF 不进入 Workbox Cache，而是进入 IndexedDB，避免缓存淘汰策略和 URL 变化影响私人文件。

离线时可用：

- 已导入 PDF 阅读
- 已建立的全文检索
- 闪卡复习与编辑
- 统计和设置
- 备份导出

需要网络的内容：

- 开放资源外链
- 未来社区、协作和云同步

## 4. 性能策略

- 页面按路由懒加载
- PDF.js、ECharts 和存储库拆成独立构建块
- PDF 一页一页提取文本，避免一次性创建全部页面 DOM
- 阅读器同一时间只渲染当前页
- 检索先通过 `searchDocs.tokens` 多值索引取候选，再做精排
- 图表只注册用到的图形和 Canvas 渲染器
- 动画只使用透明度与变换，并尊重减少动态效果设置

## 5. 安全与隐私

- 不含用户账号和远程 API
- 没有前端 API 密钥
- 外部检索使用新窗口且附带 `noopener,noreferrer`
- 卡片摘录进入 DOM 时使用 Vue 文本绑定，不使用 `v-html`
- 备份导入先验证格式标识与版本
- PDF 删除使用明确书目目标，保留卡片关系
- 完整恢复需要用户确认

## 6. 原生扩展边界

一期的文件访问使用浏览器文件选择器。进入 Capacitor iOS 阶段后，新增原生适配器，但不改业务页面：

```ts
interface DocumentGateway {
  pickDocuments(): Promise<File[]>;
  exportBackup(blob: Blob, filename: string): Promise<void>;
}
```

Web 实现继续使用 `<input type="file">` 与下载链接，iOS 实现可切换到系统文档选择器和分享面板。

## 7. 已知技术替代方案

| 当前方案 | 替代方案 | 触发条件 |
| --- | --- | --- |
| IndexedDB | SQLite 原生插件 | 原生版本需要超大文献库或更复杂迁移 |
| 自建 token 索引 | FlexSearch / SQLite FTS5 | 文献页数达到数十万且检索延迟明显 |
| PDF.js 单页 | 原生 PDFKit | iOS 需要 Apple Pencil、高级批注或系统级无障碍 |
| 完整 ZIP 备份 | 分片归档 | 备份超过浏览器内存限制 |
| 本地单设备 | 端到端加密同步 | 用户明确需要跨设备且服务器上线 |
