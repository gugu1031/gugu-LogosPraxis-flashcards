# Contributing to LogosPraxis

感谢你愿意改进 LogosPraxis。为保持本地优先架构和数据安全，请在提交前遵循以下约定。

## 开发流程

1. Fork 仓库并从 `main` 创建功能分支。
2. 使用 `npm ci` 安装锁定版本的依赖。
3. 保持改动聚焦，不提交构建产物、本地文献、测试账号或密钥。
4. 为调度、迁移或数据处理逻辑补充测试。
5. 提交 Pull Request 前运行完整检查。

```bash
npm run typecheck
npm test
npm run build
```

## 代码约定

- 使用 TypeScript 和 Vue Composition API。
- 页面只组织交互，数据持久化与业务逻辑放在 `services/`、`stores/` 或 `db/`。
- 所有数据迁移必须向后兼容，并保留用户编辑内容与 FSRS 状态。
- 新增网络能力时必须说明数据流、失败策略和隐私影响。
- UI 应尊重 `prefers-reduced-motion`，并保持键盘和移动端可用性。

## 内容贡献

请勿提交未经授权的教材全文、扫描 PDF、付费课程材料或可识别个人身份的信息。结构化卡片需要标注来源类型，并区分历史题目、训练题和个人笔记。

## Commit 与 Pull Request

Commit 建议使用简洁的祈使句，例如：

```text
Fix PDF worker loading in offline mode
Add migration for structured source metadata
```

Pull Request 请说明问题、实现方式、验证结果，以及是否影响本地数据格式或移动端工程。
