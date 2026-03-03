---
name: code-reviewer
description: 对产生的 Git Diff 进行机器级审计。根据预设的拦截底座产生检验报告，决定驳回或生成 Commit。对标 CodiumAI 的 PR-Agent。
---
# Code Reviewer (代码审查员)

## Core Purpose (核心目标)
此技能作为代码提交流水线的最后一环，进行自动化的**只读 (Read-Only)** 代码审查。它的职责是拦截大模型常见的偷懒行为（魔法值、写瞎眼中文、乱用 `any`），坚决捍卫代码底线！

## 武器库执行令 (Scripts Payload)
你被剥夺了仅凭肉眼阅读代码的权力，你必须依靠**生杀予夺的底层静态断言脚本**！

👉 **运行方式**：
在项目根目录强制运行：
```bash
node C:\Users\mr_zh\.gemini\antigravity\skills\code-reviewer\scripts\diff_linter.js
```

## Workflow (工作流)
1. **触发法庭仪轨 (Run Diff Linter)**：调用上述脚手架命令 `diff_linter.js`，脚本会自动拦截当前的变动（需存在未 commit 的修改）。
2. **分析判决 (Analyze Judgement)**：
   - 🔴 如果脚本返回了 `fail` 和一大串 Violations：说明执行 AI (task-coder) 没守规矩！你需要立刻提取脚本中的错误行号和原因，严厉驳回并勒令重做。
   - 🟢 如果脚本返回 `pass`：确认完全合规！
3. **出具结果 (Output Results)**：若合规通过，请生成一条极其标准的 Conventional Commits 规范的**全英文 Commit Message**，交由人类。如果有不合规的，将其罗列清楚。
