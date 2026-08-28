# Security Policy

## Supported version

安全修复优先覆盖 `main` 分支和最新 GitHub Release。

## Reporting a vulnerability

请不要通过公开 Issue 披露可被利用的漏洞、隐私泄露或凭证。请使用 GitHub 仓库的 **Security → Report a vulnerability** 私密报告入口，并提供：

- 受影响版本与平台；
- 可复现步骤；
- 实际影响；
- 建议修复方式（如有）。

## Security model

LogosPraxis 默认在用户设备上处理 PDF、批注、卡片和学习记录。项目不应在前端代码中包含 API 密钥、上传签名、Android keystore 或任何私人数据。新增远程服务前，应同步更新隐私文档、威胁模型和数据删除机制。
