---
name: project-context
description: 维护 `.ai/project.md`。负责初始化、读取、局部更新和状态门禁。
---

# Project Context

## Responsibilities

- 初始化 `.ai/project.md`
- 读取 `.ai/project.md`
- 校验关键路径是否存在
- 维护 `status`
- 局部更新模块状态、ADR 和变更记录

## Modes

### INIT

用于首次创建 `.ai/project.md`。

### READ

用于任务开始前读取项目上下文。

### UPDATE

用于任务完成后局部更新项目上下文。

## Inputs

- 项目根目录
- 关键入口文件或目录
- 当前任务结果（UPDATE 时）

## Output

输出文件：

`/.ai/project.md`

至少包含：

- `status`
- `last-verified`
- 技术栈
- 关键模块
- ADR
- 外部契约

## Status Rules

- AI 只能写入 `status: draft`
- `status: approved` 只能由人修改
- 已批准文档只允许局部追加，不允许整体重写

## INIT Rules

- 只扫描根目录和一层子目录
- 写入前先校验关键路径存在
- 生成初版后保持 `draft`

## READ Rules

- 读取 `.ai/project.md`
- 如果文件不存在，转入 INIT
- 如果 `status` 为 `draft`，显式提示风险

## UPDATE Rules

- 只做局部更新
- 更新前抽样校验记录路径仍存在
- 大量路径失效时返回 `[DRIFT_DETECTED]`
- 更新模块状态、ADR 或 changelog 时不得覆盖无关内容

## Blocked

以下情况直接阻塞：

- 关键路径无法验证
- `.ai/project.md` 结构损坏
- 需要整体重写已批准文档
