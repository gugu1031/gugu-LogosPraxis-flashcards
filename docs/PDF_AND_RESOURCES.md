# PDF 解析与开放资源方案

## 1. 导入流程

1. 用户从设备选择一个或多个 PDF，也可选择含 PDF 的 ZIP。
2. 系统清洗文件名并尝试匹配内置书名。
3. 没有匹配时创建“拓展阅读 / 未分类”私人书目。
4. PDF.js 读取文档页数。
5. 原始 Blob 写入 `files`。
6. 每页调用 `getTextContent()`，合并文本项并写入 `pdfPages`。
7. 对页面文本做 NFKC 规范化、中文单字与双字切分、英文三字符切分。
8. token 写入 `searchDocs.tokens` 多值索引。
9. 每完成一页更新 `books.indexedPages`，界面展示进度。
10. 完成后状态改为 `local`。

## 2. 渲染方案

阅读器只渲染当前页：

- Canvas 负责页面视觉
- PDF.js `TextLayer` 负责文字选择和复制
- 设备像素比最多取 2，避免高分屏画布无边界增长
- 页面切换取消旧渲染任务
- 划线根据选中文本保存在批注表，重绘时对匹配文本层添加高亮

当前高亮是文本锚点，不保存 PDF 坐标。优点是备份体积小、文本缩放稳定。限制是扫描版 OCR 或同句重复时定位不够精确。原生高级批注阶段应扩展：

```ts
interface PdfAnchor {
  page: number;
  quote: string;
  prefix?: string;
  suffix?: string;
  rects?: Array<{ x: number; y: number; width: number; height: number }>;
}
```

## 3. 扫描 PDF 与 OCR

当前版本不内置 OCR。纯扫描 PDF 可以阅读，但全文索引为空。

替代路径：

1. 桌面端导入前使用 OCRmyPDF 生成带文本层版本。
2. 原生版本按页调用 Apple Vision，识别结果仍只写本地。
3. 浏览器版本按需加载 Tesseract.js Worker，但大文档会显著占用 CPU、内存和包体。

推荐顺序是 OCRmyPDF、Apple Vision、Tesseract.js。

## 4. 加密与异常文件

- 密码 PDF：PDF.js 会报告密码错误，当前界面提示重新处理后导入。
- 字体映射异常：仍可渲染，但提取文本可能乱码。
- 超大 PDF：浏览器读取时需要一次 ArrayBuffer，低内存手机可能失败。
- 损坏 PDF：书目状态写入 `error`，不会被标记为完成。
- ZIP 中 EPUB：一期忽略，因为阅读器范围是 PDF。

## 5. 开放资源检索策略

应用只提供搜索入口，不做静默抓取与镜像。

来源分层：

1. 公共领域原著：维基文库、Internet Archive 明确公共领域条目
2. 马克思主义文献：Marxists Internet Archive，逐页核验版权说明与版本
3. 权威释义：Stanford Encyclopedia of Philosophy
4. 出版社或作者公开版本：只保存原始来源 URL 和版本信息

检索元数据建议：

```ts
interface ExternalResource {
  id: string;
  title: string;
  author: string;
  sourceName: string;
  sourceUrl: string;
  language: string;
  edition?: string;
  translator?: string;
  rightsStatus: "public-domain" | "open-license" | "controlled-access" | "unknown";
  licenseUrl?: string;
  verifiedAt: string;
}
```

只有 `public-domain` 或明确允许下载的 `open-license` 才应出现直接下载按钮。`controlled-access` 只跳转借阅页面，`unknown` 只展示检索线索。

## 6. 用户提供压缩包的处理原则

`考研资料.zip` 与 `课外书.zip` 只用于建立书目元数据和验证批量导入需求，原文件没有复制到仓库。这样可以同时满足：

- 用户继续保留原始私人文件
- Git 仓库与 App 安装包不携带教材正文
- 上架版本仍能通过本地导入实现完整使用逻辑

## 7. 技术难点

- PDF 文本项顺序不一定等于视觉阅读顺序
- 中文 PDF 常缺少可靠书签与章节结构
- 扫描件没有文本层
- IndexedDB 配额因浏览器和设备变化
- ZIP 与大 PDF 会造成内存峰值
- 文本锚点跨版本页码可能失效

解决优先级：

1. 保证文件可读和备份可恢复
2. 保证页码级跳转
3. 再增加章节识别、OCR 和精确坐标批注
