---
name: repo-map-generator
description: 提取存储库结构映射（AST/文件树），提供精确的上下文，避免加载完整文件内容。灵感来自 Aider 的 Repomap。
---
# Repository Map Generator (存储库地图生成器)

## Core Purpose (核心目标)
此技能负责提取代码库的骨架（目录结构、类定义、函数签名、接口），**严格禁止**读取完整的业务逻辑文件体（防幻觉、省 Token）。该过程对标了 Aider 中的 `Repomap` 机制。

## 武器库执行令 (Scripts Payload)
你绝不允许自己使用 `grep_search` 推测上下文，你必须**强制调用底层专门准备的扫描脚本**！

👉 **运行方式**：
```bash
node C:\Users\mr_zh\.gemini\antigravity\skills\repo-map-generator\scripts\ast_extractor.js [目标扫描目录相对路径]
```
*(例：`node C:\Users\mr_zh\.gemini\antigravity\skills\repo-map-generator\scripts\ast_extractor.js ./apps/studio/src`)*

## Workflow (工作流)
1. **定位靶区 (Locate Target)**：明确用户需求所属的模块目录路径。
2. **硬件扫描 (Run Extractor)**：必须执行上述的 `ast_extractor.js` 脚本获取 100% 精确的对象地图。
3. **输出映射 (Generate Map)**：直接整理脚本输出的拓扑图。
4. **移交 (Handoff)**：将这张无幻觉的骨架图，转交给 `system-architect` (系统架构师) 或者供用户继续对话使用。
