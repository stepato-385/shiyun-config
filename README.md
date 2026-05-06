# shiyun-config

Claude Code 一键配置工具，自动配置 API 中转连接。

---

## 功能说明

本工具为 Claude Code 用户提供一键式 API 配置，自动完成以下操作：

- 创建或更新 `~/.claude/settings.json` 配置文件
- 设置 `ANTHROPIC_BASE_URL` 为中转地址
- 设置 `ANTHROPIC_API_KEY` 为用户提供的密钥
- 保留已有配置内容，仅修改相关字段

---

## 前置要求

- Node.js 14.0 或更高版本
- 已安装 Claude Code（`npm install -g @anthropic-ai/claude-code`）

---

## 安装

```bash
npm install -g shiyun-config
```

---

## 使用方法

### 交互式配置（推荐）

```bash
shiyun-config
```

运行后按提示输入 API Key 即可完成配置。

### 直接传入 Key

```bash
shiyun-config --key sk-your-api-key-here
```

### 查看当前配置

```bash
shiyun-config --status
```

### 重置配置

```bash
shiyun-config --reset
```

---

## 完整流程（从零开始）

**第一步：安装配置工具**

```bash
npm install -g shiyun-config
```

**第二步：运行配置**

```bash
shiyun-config
```

输入 API Key 后，重启 Claude Code 即可使用。

---

## 配置文件位置

| 系统 | 路径 |
|------|------|
| Windows | `C:\Users\<用户名>\.claude\settings.json` |
| macOS | `/Users/<用户名>/.claude/settings.json` |
| Linux | `/home/<用户名>/.claude/settings.json` |

---

## 配置内容

工具会在 `settings.json` 中写入以下字段：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.nuoda.vip",
    "ANTHROPIC_API_KEY": "your-api-key"
  }
}
```

---

## 常见问题

**Q: 配置后 Claude Code 没有生效？**

请完全退出并重新启动 Claude Code。

**Q: 提示权限不足？**

Windows 用户请以管理员身份运行命令提示符；macOS/Linux 用户可尝试 `sudo shiyun-config`。

**Q: 如何恢复默认配置？**

运行 `shiyun-config --reset` 即可清除中转配置。

---

## 技术支持

如有问题请联系管理员获取帮助。

---

## License

MIT
