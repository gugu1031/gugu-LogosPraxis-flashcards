# 数据库全字段设计

数据库名：`LogosPraxisDB`

当前版本：1

## 1. books

书目元数据和本地导入状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 主键，内置书目使用稳定 slug，私人书目使用 UUID |
| title | string | 书名 |
| authors | string[] | 作者或编写组 |
| category | enum | 马理论、马工程教材、西方哲学、西方马克思主义、拓展阅读 |
| subCategory | string | 细分类 |
| era | string? | 哲学史年代 |
| thinkers | string[] | 相关哲学家或理论家 |
| tags | string[] | 书目标签 |
| description | string | 简短说明 |
| status | enum | catalog、indexing、local、error |
| fileId | string? | 关联 files 主键 |
| fileName | string? | 用户本地文件名 |
| fileSize | number? | 字节数 |
| pageCount | number? | PDF 页数 |
| indexedPages | number | 已完成索引页数 |
| importError | string? | 最近一次导入错误 |
| lastOpenedPage | number | 上次阅读页 |
| lastOpenedAt | ISO string? | 上次打开时间 |
| createdAt | ISO string | 创建时间 |
| updatedAt | ISO string | 更新时间 |

索引：`category`、`subCategory`、`status`、`lastOpenedAt`、`thinkers[]`、`tags[]`

## 2. files

本地原始文件。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 主键 |
| bookId | string | 关联书目 |
| name | string | 原文件名 |
| mime | string | MIME 类型 |
| size | number | 字节数 |
| blob | Blob | 原始 PDF |
| createdAt | ISO string | 导入时间 |

索引：`bookId`、`createdAt`

## 3. pdfPages

逐页纯文本。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | `bookId:page` |
| bookId | string | 关联书目 |
| page | number | 1 起始页码 |
| text | string | PDF.js 提取的页面文本 |

索引：`bookId`、复合索引 `[bookId+page]`

## 4. cards

闪卡主体和 FSRS 状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | UUID 或稳定示例 ID |
| front | string | 正面问题 |
| back | string | 标准答案 |
| answerTemplate | string? | 答题结构 |
| excerpt | string? | 原著短摘录 |
| sources | SourceLink[] | 多书目、页码与摘录 |
| tags.subjects | string[] | 学科 |
| tags.thinkers | string[] | 人物 |
| tags.questionTypes | string[] | 题型 |
| tags.difficulty | enum | 基础、进阶、冲刺 |
| tags.eras | string[] | 年代 |
| tags.schools | string[] | 流派 |
| flatTags | string[] | 为 IndexedDB 多值索引准备的扁平标签 |
| exam | ExamMetadata? | 院校历年题或大纲预测题结构化元数据 |
| fsrs | FsrsState | 调度状态 |
| suspended | boolean | 是否暂停 |
| createdAt | ISO string | 创建时间 |
| updatedAt | ISO string | 更新时间 |

`SourceLink`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| bookId | string | 书目 ID |
| page | number? | PDF 页码 |
| quote | string? | 关联原文 |

`ExamMetadata`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| institution | string | 出题院校 |
| year | number | 历年题年份或大纲适用年份 |
| subjectCode | string? | 院校科目代码 |
| subjectName | string | 科目名称 |
| questionType | string | 名词解释、简答、论述、材料分析等 |
| questionNumber | string? | 原卷题号 |
| sourceTitle | string? | 资料来源名称 |
| sourceKind | past_exam \| syllabus_forecast? | 历年题或大纲预测题；旧数据缺省时按历年题处理 |

`cards` 在数据库 v2 中额外索引 `exam.institution`、`exam.year` 和 `exam.subjectCode`。内置内容包按版本增量安装，只添加缺失 ID，不覆盖用户已编辑的卡片与复习状态。

`FsrsState`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| due | ISO string | 下次到期 |
| stability | number | 稳定性，单位天 |
| difficulty | number | 难度，1 到 10 |
| elapsedDays | number | 上次间隔 |
| scheduledDays | number | 当前排期间隔 |
| reps | number | 总复习次数 |
| lapses | number | 遗忘次数 |
| lastReview | ISO string? | 上次复习 |

## 5. reviewLogs

不可变的复习事件。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | UUID |
| cardId | string | 卡片 ID |
| rating | 1\|2\|3\|4 | 评分 |
| reviewedAt | ISO string | 评分时间 |
| elapsedDays | number | 实际经过天数 |
| scheduledDays | number | 新间隔 |
| stabilityBefore | number | 复习前稳定性 |
| stabilityAfter | number | 复习后稳定性 |
| durationMs | number | 本卡停留时长 |

## 6. annotations

阅读划线与批注。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | UUID |
| bookId | string | 书目 |
| page | number | 页码 |
| text | string | 选中的原文 |
| note | string | 用户批注，可为空 |
| color | enum | sage、amber、blue |
| cardId | string? | 可选关联卡片 |
| createdAt | ISO string | 创建时间 |
| updatedAt | ISO string | 更新时间 |

## 7. sessions

按日聚合的学习统计。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | UUID |
| date | YYYY-MM-DD | 本地学习日 |
| reviewCount | number | 完成评分数 |
| newCardCount | number | 当日新增卡片数 |
| minutes | number | 累计学习分钟 |
| updatedAt | ISO string | 更新时间 |

## 8. searchDocs

统一全文检索文档。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | `type:refId` |
| type | enum | card、book、pdf |
| refId | string | 原表主键 |
| bookId | string? | 书目限定 |
| page | number? | PDF 页码 |
| title | string | 结果标题 |
| content | string | 可检索完整文本 |
| tokens | string[] | 多值倒排 token |
| updatedAt | ISO string | 更新时间 |

## 9. settings

通用键值设置。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| key | string | 主键 |
| value | unknown | JSON 可序列化设置值 |

当前键：`theme`

## 10. 远期表设计

一期不创建以下表，避免把远程概念混入本地数据库。远期可在服务端独立实现：

- users
- communities
- posts
- reports
- sharedDecks
- mockExams
- examAttempts
- workspaces
- workspaceMembers
- syncChanges

本地对象若需要同步，应增加 `ownerId`、`workspaceId`、`revision`、`deletedAt`，而不是直接复用现有 `id` 推断权限。
